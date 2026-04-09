import type { AnalyzeMapRequestPayload, GeneratedSegmentDraft } from './_lib/contracts.js'
import { inferMainTopic, localAnalyzeMapText, normalizeGeneratedDrafts } from './_lib/mapAnalysisCore.js'
import { sanitizeTopicInput, validateAnalyzeMapPayload } from './_lib/inputValidation.js'

type ServerRequest = {
  method?: string
  body?: unknown
  headers?: Record<string, string | string[] | undefined>
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
// Best-effort limiter for serverless: memory is per-instance and not globally shared.
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 20
const rateLimitBuckets = new Map<string, number[]>()
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

function getHeaderValue(req: ServerRequest, name: string) {
  const key = name.toLowerCase()
  const value = req.headers?.[key]

  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

function getRequestFingerprint(req: ServerRequest) {
  const forwardedFor = getHeaderValue(req, 'x-forwarded-for')
  const forwardedIp = forwardedFor?.split(',')[0]?.trim()
  const realIp = getHeaderValue(req, 'x-real-ip')?.trim()
  const cfIp = getHeaderValue(req, 'cf-connecting-ip')?.trim()
  const userAgent = getHeaderValue(req, 'user-agent')?.trim()

  const ip = forwardedIp || realIp || cfIp || 'unknown'
  return `${ip}|${(userAgent || 'unknown').slice(0, 120)}`
}

function checkRateLimit(key: string) {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const existing = rateLimitBuckets.get(key) ?? []
  const active = existing.filter((timestamp) => timestamp > windowStart)

  if (active.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldest = active[0] ?? now
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000))
    rateLimitBuckets.set(key, active)

    return {
      allowed: false,
      retryAfterSeconds,
    } as const
  }

  active.push(now)
  rateLimitBuckets.set(key, active)

  return {
    allowed: true,
    retryAfterSeconds: 0,
  } as const
}

function sendError(
  res: ServerResponse,
  status: number,
  code: string,
  message: string,
  extras?: { retryAfterSeconds?: number },
) {
  if (extras?.retryAfterSeconds) {
    res.setHeader('Retry-After', String(extras.retryAfterSeconds))
  }

  res.status(status).json({
    error: {
      code,
      message,
    },
    ...(extras?.retryAfterSeconds ? { retryAfterSeconds: extras.retryAfterSeconds } : {}),
  })
}

function parseBody(body: unknown) {
  if (typeof body === 'string') {
    try {
      return {
        ok: true,
        value: JSON.parse(body) as unknown,
      } as const
    } catch {
      return {
        ok: false,
        code: 'INVALID_JSON',
        message: 'Request body must be valid JSON.',
      } as const
    }
  }

  if (body && typeof body === 'object') {
    return {
      ok: true,
      value: body,
    } as const
  }

  return {
    ok: false,
    code: 'INVALID_BODY',
    message: 'Request body must be a JSON object.',
  } as const
}

function parseJsonObjectText(value: string) {
  const trimmed = value.trim()

  try {
    return JSON.parse(trimmed) as { topic?: string; segments?: GeneratedSegmentDraft[] }
  } catch {
    const blockMatch = trimmed.match(/```(?:json)?\s*([\s\S]+?)\s*```/i)
    if (blockMatch?.[1]) {
      return JSON.parse(blockMatch[1]) as { topic?: string; segments?: GeneratedSegmentDraft[] }
    }
    throw new Error('Model returned malformed JSON')
  }
}

type ParsedGeminiAnalysis = {
  topic?: string
  segments: GeneratedSegmentDraft[]
}

function parseAnalysisFromGemini(response: GeminiGenerateContentResponse): ParsedGeminiAnalysis {
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

  return {
    topic: typeof parsed.topic === 'string' ? parsed.topic : undefined,
    segments: parsed.segments,
  }
}

async function requestGeminiSegments(apiKey: string, payload: AnalyzeMapRequestPayload): Promise<ParsedGeminiAnalysis> {
  const model = getEnvVariable('GEMINI_MODEL') || 'gemini-2.5-flash-lite'

  const instructions = [
    'You convert long-form text into a sequence of meaningful memory-map points.',
    'Return strict JSON with fields: topic, segments.',
    'topic must be a short, concrete main topic (3-7 words), title-cased, and never generic placeholder text.',
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
          required: ['topic', 'segments'],
          properties: {
            topic: { type: 'string' },
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
    if (response.status === 400 || response.status === 422) {
      throw new Error('Gemini rejected the analysis request.')
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error('Gemini authentication failed.')
    }

    if (response.status === 429) {
      throw new Error('Gemini rate limit reached.')
    }

    throw new Error('Gemini service is temporarily unavailable.')
  }

  const completion = (await response.json()) as GeminiGenerateContentResponse
  return parseAnalysisFromGemini(completion)
}

export default async function handler(req: ServerRequest, res: ServerResponse) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    sendError(res, 405, 'METHOD_NOT_ALLOWED', 'Method Not Allowed')
    return
  }

  const fingerprint = getRequestFingerprint(req)
  const limitResult = checkRateLimit(fingerprint)
  if (!limitResult.allowed) {
    sendError(
      res,
      429,
      'RATE_LIMITED',
      'Too many requests. Please wait before trying again.',
      { retryAfterSeconds: limitResult.retryAfterSeconds },
    )
    return
  }

  const parsedBody = parseBody(req.body)
  if (!parsedBody.ok) {
    sendError(res, 400, parsedBody.code, parsedBody.message)
    return
  }

  const validation = validateAnalyzeMapPayload(parsedBody.value, {
    minSegments: DEFAULT_MIN_SEGMENTS,
    maxSegments: DEFAULT_MAX_SEGMENTS,
  })

  if (!validation.ok) {
    sendError(res, validation.status, validation.code, validation.message)
    return
  }

  const { text, minSegments, maxSegments } = validation.value
  const payload: AnalyzeMapRequestPayload = {
    text,
    minSegments,
    maxSegments,
  }

  const apiKey = getEnvVariable('GEMINI_API_KEY')
  if (!apiKey) {
    sendError(res, 503, 'CONFIG_ERROR', 'GEMINI_API_KEY is not configured.')
    return
  }

  try {
    const modelAnalysis = await requestGeminiSegments(apiKey, payload)
    const normalized = normalizeGeneratedDrafts(modelAnalysis.segments, { minSegments, maxSegments }, text)
    const topic = sanitizeTopicInput(inferMainTopic(text, modelAnalysis.topic))

    res.status(200).json({
      source: 'llm',
      topic,
      segments: normalized,
    })
    return
  } catch {
    const fallback = localAnalyzeMapText(text, { minSegments, maxSegments })
    const topic = sanitizeTopicInput(inferMainTopic(text))
    res.status(200).json({
      source: 'local',
      topic,
      segments: fallback,
      fallbackReason: 'Gemini analysis unavailable; local fallback used.',
    })
  }
}
