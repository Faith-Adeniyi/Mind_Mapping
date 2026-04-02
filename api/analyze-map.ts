import type { AnalyzeMapRequestPayload, GeneratedSegmentDraft } from './_lib/contracts.js'
import { localAnalyzeMapText, normalizeGeneratedDrafts } from './_lib/mapAnalysisCore.js'

type ServerRequest = {
  method?: string
  body?: unknown
}

type ServerResponse = {
  setHeader: (name: string, value: string) => void
  status: (code: number) => ServerResponse
  json: (payload: unknown) => void
}

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
}

const DEFAULT_MIN_SEGMENTS = 4
const DEFAULT_MAX_SEGMENTS = 12
const MAX_INPUT_LENGTH = 32000

function getEnvVariable(name: string) {
  const processRef = (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } }).process
  return processRef?.env?.[name]
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

function parseBody(body: unknown): Partial<AnalyzeMapRequestPayload> {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Partial<AnalyzeMapRequestPayload>
    } catch {
      return {}
    }
  }

  if (body && typeof body === 'object') {
    return body as Partial<AnalyzeMapRequestPayload>
  }

  return {}
}

function parseSegmentsFromModel(response: ChatCompletionResponse): GeneratedSegmentDraft[] {
  const content = response.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Model returned empty content')
  }

  const parsed = JSON.parse(content) as { segments?: GeneratedSegmentDraft[] }
  if (!Array.isArray(parsed.segments)) {
    throw new Error('Model response missing segments')
  }

  return parsed.segments
}

async function requestOpenAiSegments(
  apiKey: string,
  payload: AnalyzeMapRequestPayload,
): Promise<GeneratedSegmentDraft[]> {
  const model = getEnvVariable('OPENAI_MODEL') || 'gpt-4o-mini'

  const systemPrompt = [
    'You convert long-form text into a sequence of meaningful memory-map points.',
    'Return strict JSON with field: segments.',
    'Each segment must include: text and keyword.',
    `Produce between ${payload.minSegments} and ${payload.maxSegments} ordered segments.`,
    'Each keyword must be a concise title in 2-5 words, title-cased, no filler, no trailing punctuation.',
    'Avoid generic labels like Introduction, Overview, Summary, Conclusion unless the segment is explicitly about those concepts.',
    'Prefer insight/action/decision-oriented phrasing when possible.',
  ].join(' ')

  const userPrompt = JSON.stringify({
    text: payload.text,
    constraints: {
      minSegments: payload.minSegments,
      maxSegments: payload.maxSegments,
      keywordWords: '2-5',
    },
  })

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_completion_tokens: 1400,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'map_analysis',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            required: ['segments'],
            properties: {
              segments: {
                type: 'array',
                minItems: payload.minSegments,
                maxItems: payload.maxSegments,
                items: {
                  type: 'object',
                  additionalProperties: false,
                  required: ['text', 'keyword'],
                  properties: {
                    text: { type: 'string' },
                    keyword: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI request failed (${response.status}): ${errorText}`)
  }

  const completion = (await response.json()) as ChatCompletionResponse
  return parseSegmentsFromModel(completion)
}

export default async function handler(req: ServerRequest, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  const parsed = parseBody(req.body)
  const text = typeof parsed.text === 'string' ? parsed.text.trim() : ''

  if (!text) {
    res.status(400).json({ error: 'Text is required' })
    return
  }

  if (text.length > MAX_INPUT_LENGTH) {
    res.status(400).json({ error: 'Text is too long' })
    return
  }

  const minSegments = clamp(parsed.minSegments ?? DEFAULT_MIN_SEGMENTS, 1, 24)
  const maxSegments = clamp(parsed.maxSegments ?? DEFAULT_MAX_SEGMENTS, minSegments, 24)
  const payload: AnalyzeMapRequestPayload = {
    text,
    minSegments,
    maxSegments,
  }

  const apiKey = getEnvVariable('OPENAI_API_KEY')
  if (!apiKey) {
    res.status(503).json({ error: 'OPENAI_API_KEY is not configured' })
    return
  }

  try {
    const modelSegments = await requestOpenAiSegments(apiKey, payload)
    const normalized = normalizeGeneratedDrafts(modelSegments, { minSegments, maxSegments }, text)

    res.status(200).json({
      source: 'llm',
      segments: normalized,
    })
    return
  } catch {
    const fallback = localAnalyzeMapText(text, { minSegments, maxSegments })
    res.status(200).json({
      source: 'local',
      segments: fallback,
      fallbackReason: 'OpenAI analysis unavailable; local fallback used.',
    })
  }
}
