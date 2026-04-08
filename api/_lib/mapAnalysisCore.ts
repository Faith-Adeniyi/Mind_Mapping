import type { GeneratedSegmentDraft } from './contracts.js'

export type SegmentAnalysisOptions = {
  minSegments: number
  maxSegments: number
}

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'because',
  'been',
  'being',
  'by',
  'for',
  'from',
  'had',
  'has',
  'have',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'of',
  'on',
  'or',
  'our',
  'so',
  'that',
  'the',
  'their',
  'there',
  'these',
  'this',
  'those',
  'to',
  'was',
  'we',
  'were',
  'with',
  'you',
  'your',
])

const TRANSITION_CUES = [
  'first',
  'second',
  'third',
  'next',
  'however',
  'therefore',
  'meanwhile',
  'in summary',
  'in conclusion',
  'key point',
  'important',
  'notably',
  'finally',
]

const GENERIC_WORDS = new Set([
  'introduction',
  'overview',
  'summary',
  'conclusion',
  'background',
  'topic',
  'segment',
  'point',
])

function normalizeWhitespace(text: string) {
  return text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim()
}

function normalizeIconTokens(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined
  }

  const cleaned = value
    .map((token) => (typeof token === 'string' ? token.trim() : ''))
    .filter((token) => token.length > 0)
    .slice(0, 2)

  return cleaned.length > 0 ? cleaned : undefined
}

function splitSentences(text: string) {
  const normalized = normalizeWhitespace(text)
  if (!normalized) {
    return []
  }

  return normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function toContentTokens(text: string) {
  return tokenize(text).filter((token) => token.length > 2 && !STOP_WORDS.has(token))
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

function toTitle(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

function scoreTransitionCue(sentence: string) {
  const normalized = sentence.toLowerCase()

  for (const cue of TRANSITION_CUES) {
    if (normalized.startsWith(cue) || normalized.includes(` ${cue} `)) {
      return 1.2
    }
  }

  return 0
}

function jaccardSimilarity(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) {
    return 0
  }

  const leftSet = new Set(left)
  const rightSet = new Set(right)
  let overlap = 0

  for (const token of leftSet) {
    if (rightSet.has(token)) {
      overlap += 1
    }
  }

  const union = leftSet.size + rightSet.size - overlap
  return union > 0 ? overlap / union : 0
}

function splitLongestUnit(units: string[]) {
  const index = units.reduce((best, current, currentIndex, list) =>
    current.length > list[best].length ? currentIndex : best,
  0)

  const target = units[index] ?? ''
  if (target.length < 56) {
    return units
  }

  const splitByClause = target.split(/[,;:]\s+/).map((part) => part.trim()).filter(Boolean)
  if (splitByClause.length >= 2) {
    const middle = Math.floor(splitByClause.length / 2)
    const first = splitByClause.slice(0, middle).join(', ').trim()
    const second = splitByClause.slice(middle).join(', ').trim()

    if (first && second) {
      return [...units.slice(0, index), first, second, ...units.slice(index + 1)]
    }
  }

  const midpoint = Math.floor(target.length / 2)
  const pivotRight = target.indexOf(' ', midpoint)
  const pivotLeft = target.lastIndexOf(' ', midpoint)
  const pivot = pivotRight > -1 ? pivotRight : pivotLeft

  if (pivot <= 0 || pivot >= target.length - 1) {
    return units
  }

  const firstHalf = target.slice(0, pivot).trim()
  const secondHalf = target.slice(pivot + 1).trim()

  if (!firstHalf || !secondHalf) {
    return units
  }

  return [...units.slice(0, index), firstHalf, secondHalf, ...units.slice(index + 1)]
}

function mergeSmallestNeighbors(drafts: GeneratedSegmentDraft[]) {
  if (drafts.length <= 1) {
    return drafts
  }

  let mergeIndex = 0
  let shortestLength = Number.POSITIVE_INFINITY

  for (let index = 0; index < drafts.length - 1; index += 1) {
    const score = drafts[index].text.length + drafts[index + 1].text.length
    if (score < shortestLength) {
      shortestLength = score
      mergeIndex = index
    }
  }

  const mergedText = `${drafts[mergeIndex].text} ${drafts[mergeIndex + 1].text}`.replace(/\s+/g, ' ').trim()
  const mergedKeyword = createKeywordSummary(mergedText)

  return [
    ...drafts.slice(0, mergeIndex),
    { text: mergedText, keyword: mergedKeyword },
    ...drafts.slice(mergeIndex + 2),
  ]
}

function extractRankedTerms(text: string, limit: number) {
  const tokens = toContentTokens(text).filter((token) => !GENERIC_WORDS.has(token))
  const counts = new Map<string, number>()

  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([token]) => token)
}

function enforceKeywordShape(label: string, segmentText: string) {
  let words = label
    .replace(/[^a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean)
    .filter((word) => !GENERIC_WORDS.has(word))

  if (words.length < 2) {
    const fallbackTerms = extractRankedTerms(segmentText, 5)
    const merged = [...words]

    for (const term of fallbackTerms) {
      if (!merged.includes(term)) {
        merged.push(term)
      }
      if (merged.length >= 2) {
        break
      }
    }

    words = merged
  }

  if (words.length === 0) {
    words = ['Key', 'Insight'].map((word) => word.toLowerCase())
  }

  if (words.length > 5) {
    words = words.slice(0, 5)
  }

  if (words.length === 1) {
    words = [words[0], 'Insight']
  }

  return words.map((word) => toTitle(word)).join(' ')
}

function makeDistinctKeywords(drafts: GeneratedSegmentDraft[]) {
  const seen = new Map<string, number>()

  return drafts.map((draft) => {
    let keyword = enforceKeywordShape(draft.keyword, draft.text)
    let normalized = keyword.toLowerCase()
    let count = seen.get(normalized) ?? 0

    if (count > 0) {
      const words = keyword.split(/\s+/)
      const additions = extractRankedTerms(draft.text, 4).map((term) => toTitle(term))
      const extension = additions.find((term) => !words.includes(term))

      if (extension) {
        if (words.length < 5) {
          words.push(extension)
        } else {
          words[words.length - 1] = extension
        }
        keyword = words.slice(0, 5).join(' ')
        normalized = keyword.toLowerCase()
        count = seen.get(normalized) ?? 0
      }

      if (count > 0) {
        const suffix = String(count + 1)
        const numberedWords = keyword.split(/\s+/)
        if (numberedWords.length < 5) {
          numberedWords.push(suffix)
        } else {
          numberedWords[numberedWords.length - 1] = suffix
        }
        keyword = numberedWords.join(' ')
        normalized = keyword.toLowerCase()
      }
    }

    seen.set(normalized, (seen.get(normalized) ?? 0) + 1)

    return {
      text: normalizeWhitespace(draft.text),
      keyword,
      iconTokens: normalizeIconTokens(draft.iconTokens),
    }
  })
}

export function createKeywordSummary(text: string) {
  const sentences = splitSentences(text)
  const sourceSentences = sentences.length > 0 ? sentences : [normalizeWhitespace(text)]
  const contentBySentence = sourceSentences.map((sentence) => toContentTokens(sentence))
  const globalCounts = new Map<string, number>()

  for (const tokens of contentBySentence) {
    for (const token of tokens) {
      globalCounts.set(token, (globalCounts.get(token) ?? 0) + 1)
    }
  }

  const sentenceScores = sourceSentences.map((sentence, index) => {
    const tokens = contentBySentence[index]
    const termScore = tokens.reduce((score, token) => score + (globalCounts.get(token) ?? 0), 0)
    const cueScore = scoreTransitionCue(sentence)
    const length = tokenize(sentence).length
    const readabilityScore = length >= 7 && length <= 28 ? 1 : 0.5

    return termScore + cueScore + readabilityScore
  })

  const bestSentenceIndex = sentenceScores.reduce((best, score, index, list) => (score > list[best] ? index : best), 0)
  const preferredTokens = contentBySentence[bestSentenceIndex] ?? []
  const uniqueOrdered: string[] = []

  for (const token of preferredTokens) {
    if (!uniqueOrdered.includes(token) && !GENERIC_WORDS.has(token)) {
      uniqueOrdered.push(token)
    }
  }

  let targetWords = uniqueOrdered
  if (targetWords.length < 2) {
    targetWords = extractRankedTerms(text, 5)
  }

  const desiredLength = targetWords.length >= 4 ? 4 : targetWords.length >= 3 ? 3 : 2
  const labelWords = targetWords.slice(0, clamp(desiredLength, 2, 5))

  return enforceKeywordShape(labelWords.join(' '), text)
}

export function normalizeGeneratedDrafts(
  drafts: GeneratedSegmentDraft[],
  options: SegmentAnalysisOptions,
  fallbackText: string,
) {
  const minSegments = clamp(options.minSegments, 1, 24)
  const maxSegments = clamp(options.maxSegments, minSegments, 24)

  let next: GeneratedSegmentDraft[] = drafts
    .map((draft) => {
      const iconTokens = normalizeIconTokens(draft.iconTokens)
      return iconTokens
        ? {
            text: normalizeWhitespace(draft.text),
            keyword: normalizeWhitespace(draft.keyword),
            iconTokens,
          }
        : {
            text: normalizeWhitespace(draft.text),
            keyword: normalizeWhitespace(draft.keyword),
          }
    })
    .filter((draft) => draft.text.length > 0)

  if (next.length === 0) {
    next = localAnalyzeMapText(fallbackText, { minSegments, maxSegments })
  }

  while (next.length > maxSegments) {
    next = mergeSmallestNeighbors(next)
  }

  while (next.length < minSegments) {
    const source = next.length > 0 ? next : [{ text: fallbackText, keyword: '' }]
    const splitAttempt = splitLongestUnit(source.map((segment) => segment.text))

    if (splitAttempt.length <= source.length) {
      break
    }

    next = splitAttempt.map((text) => ({
      text,
      keyword: createKeywordSummary(text),
    }))
  }

  next = next.map((draft) => {
    const iconTokens = normalizeIconTokens(draft.iconTokens)
    return iconTokens
      ? {
          text: draft.text,
          keyword: enforceKeywordShape(draft.keyword || createKeywordSummary(draft.text), draft.text),
          iconTokens,
        }
      : {
          text: draft.text,
          keyword: enforceKeywordShape(draft.keyword || createKeywordSummary(draft.text), draft.text),
        }
  })

  return makeDistinctKeywords(next)
}

export function localAnalyzeMapText(text: string, options: SegmentAnalysisOptions): GeneratedSegmentDraft[] {
  const minSegments = clamp(options.minSegments, 1, 24)
  const maxSegments = clamp(options.maxSegments, minSegments, 24)
  const normalizedInput = normalizeWhitespace(text)

  if (!normalizedInput) {
    return []
  }

  let units = splitSentences(normalizedInput)
  if (units.length === 0) {
    units = [normalizedInput]
  }

  const hardTarget = clamp(Math.ceil(units.length / 2), minSegments, maxSegments)

  while (units.length < hardTarget) {
    const split = splitLongestUnit(units)
    if (split.length === units.length) {
      break
    }
    units = split
  }

  const targetSegments = clamp(hardTarget, 1, units.length)
  const contentTokens = units.map((unit) => toContentTokens(unit))
  const termCounts = new Map<string, number>()

  for (const tokens of contentTokens) {
    for (const token of tokens) {
      termCounts.set(token, (termCounts.get(token) ?? 0) + 1)
    }
  }

  const sentenceScores = units.map((unit, index) => {
    const terms = contentTokens[index]
    const termScore = terms.reduce((score, token) => score + (termCounts.get(token) ?? 0), 0)
    const cueScore = scoreTransitionCue(unit)
    const positionScore = index === 0 || index === units.length - 1 ? 0.35 : 0
    return termScore + cueScore + positionScore
  })

  const candidateBoundaries: { index: number; score: number }[] = []
  for (let index = 0; index < units.length - 1; index += 1) {
    const left = contentTokens[index]
    const right = contentTokens[index + 1]
    const topicShift = 1 - jaccardSimilarity(left, right)
    const cueShift = scoreTransitionCue(units[index + 1])
    const salience = (sentenceScores[index] + sentenceScores[index + 1]) * 0.08
    const score = topicShift + cueShift + salience

    candidateBoundaries.push({ index, score })
  }

  candidateBoundaries.sort((left, right) => right.score - left.score)
  const boundaryCount = Math.max(0, targetSegments - 1)
  const selectedBoundaries = candidateBoundaries
    .slice(0, boundaryCount)
    .map((candidate) => candidate.index)
    .sort((left, right) => left - right)

  if (selectedBoundaries.length === 0 && boundaryCount > 0) {
    const evenSize = Math.floor(units.length / targetSegments)
    const computed = new Set<number>()
    for (let index = 1; index < targetSegments; index += 1) {
      computed.add(Math.min(units.length - 2, Math.max(0, index * evenSize - 1)))
    }
    selectedBoundaries.push(...computed.values())
    selectedBoundaries.sort((left, right) => left - right)
  }

  const drafts: GeneratedSegmentDraft[] = []
  let start = 0

  for (const boundary of selectedBoundaries) {
    const textChunk = units.slice(start, boundary + 1).join(' ').trim()
    if (textChunk) {
      drafts.push({
        text: textChunk,
        keyword: createKeywordSummary(textChunk),
      })
    }
    start = boundary + 1
  }

  const tail = units.slice(start).join(' ').trim()
  if (tail) {
    drafts.push({
      text: tail,
      keyword: createKeywordSummary(tail),
    })
  }

  return normalizeGeneratedDrafts(drafts, { minSegments, maxSegments }, normalizedInput)
}
