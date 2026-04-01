export type SegmentOptions = {
  minSegments?: number
  maxSegments?: number
}

function normalizeInput(text: string) {
  return text.replace(/\r\n/g, '\n').replace(/\t/g, ' ').trim()
}

function splitParagraphs(text: string) {
  return text
    .split(/\n\s*\n+/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter((part) => part.length > 0)
}

function splitSentences(text: string) {
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0)
}

function chunkEvenly(parts: string[], targetCount: number) {
  if (parts.length <= targetCount) {
    return [...parts]
  }

  const result: string[] = []
  const base = Math.floor(parts.length / targetCount)
  const remainder = parts.length % targetCount
  let cursor = 0

  for (let chunk = 0; chunk < targetCount; chunk += 1) {
    const take = base + (chunk < remainder ? 1 : 0)
    result.push(parts.slice(cursor, cursor + take).join(' ').trim())
    cursor += take
  }

  return result.filter(Boolean)
}

function splitLongestSegment(segments: string[]) {
  const targetIndex = segments.reduce((best, current, index, list) =>
    current.length > list[best].length ? index : best,
  0)

  const longest = segments[targetIndex] ?? ''
  if (longest.length < 80) {
    return segments
  }

  const middle = Math.floor(longest.length / 2)
  const rightPivot = longest.indexOf(' ', middle)
  const leftPivot = longest.lastIndexOf(' ', middle)
  const pivot = rightPivot > -1 ? rightPivot : leftPivot

  if (pivot <= 0 || pivot >= longest.length - 1) {
    return segments
  }

  const firstHalf = longest.slice(0, pivot).trim()
  const secondHalf = longest.slice(pivot + 1).trim()

  if (!firstHalf || !secondHalf) {
    return segments
  }

  return [...segments.slice(0, targetIndex), firstHalf, secondHalf, ...segments.slice(targetIndex + 1)]
}

function mergeSmallestNeighborPair(segments: string[]) {
  if (segments.length <= 1) {
    return segments
  }

  let mergeIndex = 0
  let smallestScore = Number.POSITIVE_INFINITY

  for (let index = 0; index < segments.length - 1; index += 1) {
    const score = segments[index].length + segments[index + 1].length
    if (score < smallestScore) {
      smallestScore = score
      mergeIndex = index
    }
  }

  const merged = `${segments[mergeIndex]} ${segments[mergeIndex + 1]}`.replace(/\s+/g, ' ').trim()
  return [...segments.slice(0, mergeIndex), merged, ...segments.slice(mergeIndex + 2)]
}

function rebalanceSegments(segments: string[], minSegments: number, maxSegments: number) {
  let next = [...segments]

  while (next.length > maxSegments) {
    next = mergeSmallestNeighborPair(next)
  }

  while (next.length < minSegments) {
    const split = splitLongestSegment(next)
    if (split.length === next.length) {
      break
    }
    next = split
  }

  return next
}

export function segmentText(text: string, options: SegmentOptions = {}) {
  const minSegments = options.minSegments ?? 4
  const maxSegments = options.maxSegments ?? 12

  const normalized = normalizeInput(text)
  if (!normalized) {
    return []
  }

  let segments = splitParagraphs(normalized)

  if (segments.length < minSegments) {
    const sentences = splitSentences(normalized)
    if (sentences.length > 0) {
      const target = Math.min(maxSegments, Math.max(minSegments, Math.ceil(sentences.length / 2)))
      segments = chunkEvenly(sentences, target)
    }
  }

  segments = segments
    .map((segment) => segment.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  if (segments.length === 0) {
    return []
  }

  return rebalanceSegments(segments, minSegments, maxSegments)
}
