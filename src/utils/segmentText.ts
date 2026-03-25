export function parseTextIntoSegments(text: string) {
  const trimmed = text.trim()
  if (!trimmed) {
    return []
  }

  let parts = trimmed
    .split(/\n\s*\n+/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (parts.length <= 1) {
    parts = trimmed
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .filter((part) => part.length > 10)
  }

  return parts.map((part) => part.trim()).filter(Boolean)
}

export function combineSegments(segments: string[], maxSegments: number) {
  if (segments.length <= maxSegments) {
    return segments
  }

  const groupSize = Math.ceil(segments.length / maxSegments)
  const combined: string[] = []

  for (let index = 0; index < segments.length; index += groupSize) {
    combined.push(segments.slice(index, index + groupSize).join(' '))
  }

  return combined.slice(0, maxSegments)
}

export function splitLongSegments(segments: string[], minSegments: number) {
  if (segments.length >= minSegments) {
    return segments
  }

  const result: string[] = []
  const targetLength = 120

  for (const segment of segments) {
    if (segment.length > targetLength && result.length < minSegments - 1) {
      const mid = Math.floor(segment.length / 2)
      const splitPoint = segment.indexOf(' ', mid)

      if (splitPoint > 0) {
        result.push(segment.slice(0, splitPoint).trim())
        result.push(segment.slice(splitPoint + 1).trim())
        continue
      }
    }

    result.push(segment)
  }

  return result
}
