export const MAX_ANALYSIS_TEXT_LENGTH = 32000
export const MIN_API_SEGMENTS = 1
export const MAX_API_SEGMENTS = 24
export const MAX_TOPIC_LENGTH = 80

type ValidationFailure = {
  ok: false
  status: 400 | 413 | 422
  code: string
  message: string
}

type ValidationSuccess = {
  ok: true
  value: {
    text: string
    minSegments: number
    maxSegments: number
  }
}

export type ApiValidationResult = ValidationFailure | ValidationSuccess

function hasUnsafeControlChars(value: string) {
  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.charCodeAt(index)
    const isUnsafeControl = (codePoint >= 0 && codePoint <= 8) ||
      codePoint === 11 ||
      codePoint === 12 ||
      (codePoint >= 14 && codePoint <= 31) ||
      codePoint === 127

    if (isUnsafeControl) {
      return true
    }
  }

  return false
}

function clearUnsafeControlChars(value: string) {
  let sanitized = ''

  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.charCodeAt(index)
    const isUnsafeControl = (codePoint >= 0 && codePoint <= 8) ||
      codePoint === 11 ||
      codePoint === 12 ||
      (codePoint >= 14 && codePoint <= 31) ||
      codePoint === 127

    if (!isUnsafeControl) {
      sanitized += value[index]
    }
  }

  return sanitized
}

function normalizeTextInput(value: string) {
  return value.replace(/\r\n/g, '\n')
}

function toInteger(value: unknown) {
  return typeof value === 'number' && Number.isInteger(value) ? value : Number.NaN
}

export function sanitizeTopicInput(value: string) {
  const normalized = clearUnsafeControlChars(value).replace(/\s+/g, ' ').trim()
  return normalized.slice(0, MAX_TOPIC_LENGTH)
}

export function validateAnalyzeMapPayload(
  body: unknown,
  defaults: { minSegments: number; maxSegments: number },
): ApiValidationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {
      ok: false,
      status: 400,
      code: 'INVALID_BODY',
      message: 'Request body must be a JSON object.',
    }
  }

  const payload = body as Record<string, unknown>
  const textRaw = payload.text

  if (typeof textRaw !== 'string') {
    return {
      ok: false,
      status: 400,
      code: 'TEXT_REQUIRED',
      message: 'Text is required.',
    }
  }

  const normalizedText = normalizeTextInput(textRaw)
  if (!normalizedText.trim()) {
    return {
      ok: false,
      status: 422,
      code: 'EMPTY_TEXT',
      message: 'Text must not be empty.',
    }
  }

  if (normalizedText.length > MAX_ANALYSIS_TEXT_LENGTH) {
    return {
      ok: false,
      status: 413,
      code: 'TEXT_TOO_LONG',
      message: `Text must be at most ${MAX_ANALYSIS_TEXT_LENGTH} characters.`,
    }
  }

  if (hasUnsafeControlChars(normalizedText)) {
    return {
      ok: false,
      status: 422,
      code: 'UNSAFE_CHARACTERS',
      message: 'Text contains unsupported control characters.',
    }
  }

  const minSegments = toInteger(payload.minSegments ?? defaults.minSegments)
  const maxSegments = toInteger(payload.maxSegments ?? defaults.maxSegments)

  if (!Number.isFinite(minSegments) || !Number.isFinite(maxSegments)) {
    return {
      ok: false,
      status: 422,
      code: 'INVALID_SEGMENT_COUNT',
      message: 'Segment counts must be whole numbers.',
    }
  }

  if (minSegments < MIN_API_SEGMENTS || maxSegments > MAX_API_SEGMENTS || maxSegments < minSegments) {
    return {
      ok: false,
      status: 422,
      code: 'SEGMENT_COUNT_OUT_OF_RANGE',
      message: `Segment counts must be between ${MIN_API_SEGMENTS} and ${MAX_API_SEGMENTS}.`,
    }
  }

  return {
    ok: true,
    value: {
      text: normalizedText.trim(),
      minSegments,
      maxSegments,
    },
  }
}
