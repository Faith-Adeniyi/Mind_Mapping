export const MAX_ANALYSIS_TEXT_LENGTH = 32000
export const MIN_UI_SEGMENTS = 3
export const MAX_UI_SEGMENTS = 12
export const MIN_API_SEGMENTS = 1
export const MAX_API_SEGMENTS = 24
export const MAX_TOPIC_LENGTH = 80

type ValidationFailure = {
  ok: false
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

export type ValidationResult = ValidationFailure | ValidationSuccess

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

export function sanitizeTopicInput(value: string) {
  const normalized = clearUnsafeControlChars(value).replace(/\s+/g, ' ').trim()
  return normalized.slice(0, MAX_TOPIC_LENGTH)
}

export function validateAnalyzeMapInput(params: {
  text: string
  minSegments: number
  maxSegments: number
  minAllowed?: number
  maxAllowed?: number
}): ValidationResult {
  const minAllowed = params.minAllowed ?? MIN_API_SEGMENTS
  const maxAllowed = params.maxAllowed ?? MAX_API_SEGMENTS

  if (!Number.isInteger(params.minSegments) || !Number.isInteger(params.maxSegments)) {
    return {
      ok: false,
      code: 'INVALID_SEGMENT_COUNT',
      message: 'Node count must be a whole number.',
    }
  }

  if (params.minSegments < minAllowed || params.maxSegments > maxAllowed || params.maxSegments < params.minSegments) {
    return {
      ok: false,
      code: 'SEGMENT_COUNT_OUT_OF_RANGE',
      message: `Node count must be between ${minAllowed} and ${maxAllowed}.`,
    }
  }

  const normalizedText = normalizeTextInput(params.text)
  if (!normalizedText.trim()) {
    return {
      ok: false,
      code: 'EMPTY_TEXT',
      message: 'Paste source material before generating.',
    }
  }

  if (normalizedText.length > MAX_ANALYSIS_TEXT_LENGTH) {
    return {
      ok: false,
      code: 'TEXT_TOO_LONG',
      message: `Source text is too long. Keep it under ${MAX_ANALYSIS_TEXT_LENGTH.toLocaleString()} characters.`,
    }
  }

  if (hasUnsafeControlChars(normalizedText)) {
    return {
      ok: false,
      code: 'UNSAFE_CHARACTERS',
      message: 'Source text contains unsupported control characters. Remove them and try again.',
    }
  }

  return {
    ok: true,
    value: {
      text: normalizedText.trim(),
      minSegments: params.minSegments,
      maxSegments: params.maxSegments,
    },
  }
}

export function validateGenerationInput(params: {
  text: string
  desiredSegmentCount: number
}) {
  return validateAnalyzeMapInput({
    text: params.text,
    minSegments: params.desiredSegmentCount,
    maxSegments: params.desiredSegmentCount,
    minAllowed: MIN_UI_SEGMENTS,
    maxAllowed: MAX_UI_SEGMENTS,
  })
}
