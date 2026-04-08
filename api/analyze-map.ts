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

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
    finishReason?: string
  }>
  promptFeedback?: {
    blockReason?: string
  }
}

const DEFAULT_MIN_SEGMENTS = 6
const DEFAULT_MAX_SEGMENTS = 6
const MAX_INPUT_LENGTH = 32000
const ALLOWED_ICON_TOKENS = [
  '💡',
  '🎯',
  '⚠️',
  '📈',
  '📉',
  '💰',
  '✂️',
  '👥',
  '🕒',
  '🚀',
  '🧩',
  '🔍',
  '📚',
  '✅',
  '❌',
  '🧠',
  '🧪',
  '🔒',
  '📣',
  '🤝',
  '🛠️',
  '📝',
  'iconify:tabler:scissors',
  'iconify:tabler:coins',
  'iconify:tabler:chart-line',
  'iconify:tabler:alert-triangle',
  'iconify:tabler:users',
  'iconify:tabler:clock-hour-4',
  'iconify:tabler:rocket',
  'iconify:tabler:puzzle',
  'iconify:tabler:search',
  'iconify:tabler:bulb',
] as const

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

function parseJsonObjectText(value: string) {
  const trimmed = value.trim()

  try {
    return JSON.parse(trimmed) as { segments?: GeneratedSegmentDraft[] }
  } catch {
    const blockMatch = trimmed.match(/```(?:json)?\s*([\s\S]+?)\s*```/i)
    if (blockMatch?.[1]) {
      return JSON.parse(blockMatch[1]) as { segments?: GeneratedSegmentDraft[] }
    }
    throw new Error('Model returned malformed JSON')
  }
}

function parseSegmentsFromGemini(response: GeminiGenerateContentResponse): GeneratedSegmentDraft[] {
  const blockReason = response.promptFeedback?.blockReason
  if (blockReason) {
    throw new Error(`Gemini blocked prompt: ${blockReason}`)
  }

  const parts = response.candidates?.[0]?.content?.parts ?? []
  const content = parts
    .map((part) => (typeof part.text === 'string' ? part.text : ''))
    .join('\n')
    .trim()

  if (!content) {
    const finishReason = response.candidates?.[0]?.finishReason
    const reasonSuffix = finishReason ? ` (finishReason: ${finishReason})` : ''
    throw new Error(`Gemini returned empty content${reasonSuffix}`)
  }

  const parsed = parseJsonObjectText(content)
  if (!Array.isArray(parsed.segments)) {
    throw new Error('Model response missing segments')
  }

  return parsed.segments
}

async function requestGeminiSegments(apiKey: string, payload: AnalyzeMapRequestPayload): Promise<GeneratedSegmentDraft[]> {
  const model = getEnvVariable('GEMINI_MODEL') || 'gemini-2.5-flash-lite'

  const instructions = [
    'You convert long-form text into a sequence of meaningful memory-map points.',
    'Return strict JSON with field: segments.',
    'Each segment must include: text, keyword, and optional iconTokens.',
    `Produce between ${payload.minSegments} and ${payload.maxSegments} ordered segments.`,
    'Each keyword must be a concise title in 2-5 words, title-cased, no filler, no trailing punctuation.',
    'Avoid generic labels like Introduction, Overview, Summary, Conclusion unless the segment is explicitly about those concepts.',
    'Prefer insight/action/decision-oriented phrasing when possible.',
    'iconTokens can contain 1-2 items from the allowed icon list only.',
    'Use 2 icons only when a combination improves clarity (for example, budget cut -> money plus scissors).',
    `Allowed icon tokens: ${ALLOWED_ICON_TOKENS.join(', ')}`,
  ]

  const prompt = [
    instructions.join(' '),
    '',
    'INPUT:',
    payload.text,
  ].join('\n')

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseJsonSchema: {
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
                  iconTokens: {
                    type: 'array',
                    minItems: 1,
                    maxItems: 2,
                    items: {
                      type: 'string',
                      enum: [...ALLOWED_ICON_TOKENS],
                    },
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
    throw new Error(`Gemini request failed (${response.status}): ${errorText}`)
  }

  const completion = (await response.json()) as GeminiGenerateContentResponse
  return parseSegmentsFromGemini(completion)
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

  const apiKey = getEnvVariable('GEMINI_API_KEY')
  if (!apiKey) {
    res.status(503).json({ error: 'GEMINI_API_KEY is not configured' })
    return
  }

  try {
    const modelSegments = await requestGeminiSegments(apiKey, payload)
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
      fallbackReason: 'Gemini analysis unavailable; local fallback used.',
    })
  }
}
