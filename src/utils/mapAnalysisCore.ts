import type { GeneratedSegmentDraft } from '../types'

export type SegmentAnalysisOptions = {
  minSegments: number
  maxSegments: number
}

// ── Stop words ───────────────────────────────────────────────────────────────
// Comprehensive English stop-word list so keyword extraction returns
// meaningful terms rather than grammatical glue words.
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'also', 'am',
  'an', 'and', 'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before',
  'being', 'below', 'between', 'both', 'but', 'by', 'can', 'cannot', 'could',
  'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'else', 'even',
  'few', 'for', 'from', 'further', 'get', 'got', 'had', 'has', 'have',
  'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his',
  'how', 'however', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself',
  'just', 'let', 'like', 'make', 'may', 'me', 'might', 'more', 'most',
  'much', 'my', 'myself', 'need', 'no', 'nor', 'not', 'now', 'of', 'off',
  'on', 'once', 'only', 'or', 'other', 'our', 'out', 'over', 'own', 'per',
  'put', 'say', 'see', 'she', 'should', 'since', 'so', 'some', 'such',
  'take', 'than', 'that', 'the', 'their', 'them', 'then', 'there', 'these',
  'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'us', 'use', 'used', 'using', 'very', 'was', 'we', 'well', 'were',
  'what', 'when', 'where', 'which', 'while', 'who', 'will', 'with', 'would',
  'you', 'your', 'yourself',
])

// Lowercase abbreviations that end in a period and should NOT trigger
// a sentence boundary split.
const ABBREVIATIONS = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'vs', 'etc', 'eg', 'ie',
  'approx', 'dept', 'est', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul',
  'aug', 'sep', 'oct', 'nov', 'dec', 'st', 'ave', 'blvd', 'co', 'corp',
  'inc', 'ltd', 'govt', 'univ',
])

const TRANSITION_CUES = [
  'first', 'second', 'third', 'fourth', 'fifth',
  'next', 'finally', 'lastly', 'to begin', 'to start',
  'in addition', 'furthermore', 'moreover', 'additionally',
  'however', 'nevertheless', 'on the other hand', 'in contrast',
  'therefore', 'as a result', 'consequently', 'thus',
  'in summary', 'in conclusion', 'to summarize', 'to conclude',
  'key point', 'importantly', 'notably', 'significantly',
]

const GENERIC_WORDS = new Set([
  'introduction', 'overview', 'summary', 'conclusion', 'background',
  'topic', 'segment', 'point', 'section', 'part', 'item', 'thing',
  'aspect', 'area', 'issue', 'matter',
])

const TOPIC_LABEL_PREFIX = /^(?:title|topic|main topic|subject|theme)\s*[:\-–]\s*/i

const GENERIC_TOPIC_PHRASES = new Set([
  'project presentation', 'main topic', 'topic', 'overview', 'summary',
  'conclusion', 'introduction', 'untitled', 'key insight', 'core message',
])

const FALLBACK_MAIN_TOPIC = 'Key Message'

// ── Text utilities ────────────────────────────────────────────────────────────

function normalizeWhitespace(text: string) {
  return text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').trim()
}

function stripListPrefix(line: string) {
  return line.replace(/^(?:[-*•·]\s+|\d+[).\s]\s*)/, '').trim()
}

function normalizeIconTokens(value: unknown) {
  if (!Array.isArray(value)) return undefined
  const cleaned = value
    .map((t) => (typeof t === 'string' ? t.trim() : ''))
    .filter((t) => t.length > 0)
    .slice(0, 2)
  return cleaned.length > 0 ? cleaned : undefined
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

function toContentTokens(text: string) {
  return tokenize(text).filter((t) => t.length > 2 && !STOP_WORDS.has(t))
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

function toTitle(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
}

function toTopicCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => toTitle(word))
    .join(' ')
}

// ── Sentence splitting ────────────────────────────────────────────────────────
// Splits a block of text into sentences while avoiding false splits on
// common abbreviations (Mr., Dr., etc.) and decimal numbers.

function splitSentences(text: string): string[] {
  const normalized = normalizeWhitespace(text).replace(/\n/g, ' ')
  if (!normalized) return []

  // Tokenise into words then reassemble respecting abbreviations.
  const raw = normalized.split(/(?<=[.!?])(?:\s+)(?=[A-Z"'(])/)

  const merged: string[] = []
  let buffer = ''

  for (const chunk of raw) {
    const lastWord = (buffer || chunk)
      .replace(/[^a-z.]/gi, ' ')
      .trim()
      .split(/\s+/)
      .pop()
      ?.replace(/\.$/, '')
      ?.toLowerCase() ?? ''

    const isAbbrev = ABBREVIATIONS.has(lastWord)
    // Decimal numbers like "3.14" should not be split.
    const isDecimal = /\d\.\s*\d/.test(buffer.slice(-6) + chunk.slice(0, 6))

    if (buffer && (isAbbrev || isDecimal)) {
      buffer = (buffer + ' ' + chunk).replace(/\s+/g, ' ')
    } else {
      if (buffer) merged.push(buffer.trim())
      buffer = chunk
    }
  }
  if (buffer.trim()) merged.push(buffer.trim())

  return merged.filter(Boolean)
}

// ── Paragraph-aware block splitting ──────────────────────────────────────────
// Returns logical blocks (paragraphs, list items, headings) preserving
// the document's own structural signals before we do any NLP segmentation.

function splitIntoBlocks(raw: string): string[] {
  const lines = raw.replace(/\r\n/g, '\n').split('\n')
  const blocks: string[] = []
  let current: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) {
      // Blank line = paragraph break
      if (current.length > 0) {
        blocks.push(current.join(' ').replace(/\s+/g, ' ').trim())
        current = []
      }
      continue
    }

    // Numbered or bulleted list item: treat each as its own block
    if (/^(?:[-*•·]\s+|\d+[).\s]\s+)/.test(trimmed)) {
      if (current.length > 0) {
        blocks.push(current.join(' ').replace(/\s+/g, ' ').trim())
        current = []
      }
      blocks.push(stripListPrefix(trimmed))
      continue
    }

    // All-caps short line → heading / section title
    if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed) && trimmed.length <= 80) {
      if (current.length > 0) {
        blocks.push(current.join(' ').replace(/\s+/g, ' ').trim())
        current = []
      }
      blocks.push(trimmed)
      continue
    }

    current.push(trimmed)
  }

  if (current.length > 0) {
    blocks.push(current.join(' ').replace(/\s+/g, ' ').trim())
  }

  return blocks.filter((b) => b.length > 0)
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function scoreTransitionCue(sentence: string) {
  const n = sentence.toLowerCase()
  for (const cue of TRANSITION_CUES) {
    if (n.startsWith(cue) || n.includes(' ' + cue + ' ') || n.includes(' ' + cue + ',')) {
      return 1.4
    }
  }
  return 0
}

function jaccardSimilarity(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) return 0
  const ls = new Set(left)
  const rs = new Set(right)
  let overlap = 0
  for (const t of ls) { if (rs.has(t)) overlap++ }
  const union = ls.size + rs.size - overlap
  return union > 0 ? overlap / union : 0
}

// ── Keyword extraction ────────────────────────────────────────────────────────

// Extracts meaningful unigrams ranked by frequency (TF-style).
function extractRankedTerms(text: string, limit: number): string[] {
  const tokens = toContentTokens(text).filter((t) => !GENERIC_WORDS.has(t))
  const counts = new Map<string, number>()
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1)
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([t]) => t)
}

// Extracts candidate bigrams (two consecutive content words) as phrases.
function extractBigrams(text: string, limit: number): string[] {
  const tokens = toContentTokens(text)
  const counts = new Map<string, number>()
  for (let i = 0; i < tokens.length - 1; i++) {
    const pair = `${tokens[i]} ${tokens[i + 1]}`
    counts.set(pair, (counts.get(pair) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)        // must appear at least twice
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([pair]) => pair)
}

// ── Keyword label building ────────────────────────────────────────────────────

function enforceKeywordShape(label: string, segmentText: string): string {
  // Prefer a bigram phrase if one repeats in the segment
  const bigrams = extractBigrams(segmentText, 3)
  if (bigrams.length > 0) {
    const phrase = bigrams[0]
    const parts = phrase.split(' ').map(toTitle)
    if (parts.length === 2) return parts.join(' ')
  }

  let words = label
    .replace(/[^a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .map((w) => w.trim().toLowerCase())
    .filter(Boolean)
    .filter((w) => !GENERIC_WORDS.has(w) && !STOP_WORDS.has(w) && w.length > 2)

  if (words.length < 2) {
    const fallback = extractRankedTerms(segmentText, 6)
    const merged = [...words]
    for (const t of fallback) {
      if (!merged.includes(t)) merged.push(t)
      if (merged.length >= 2) break
    }
    words = merged
  }

  if (words.length === 0) words = ['Key', 'Insight'].map((w) => w.toLowerCase())
  if (words.length > 4) words = words.slice(0, 4)
  if (words.length === 1) words = [words[0], 'Focus']

  return words.map(toTitle).join(' ')
}

export function createKeywordSummary(text: string): string {
  const sentences = splitSentences(text)
  const source = sentences.length > 0 ? sentences : [normalizeWhitespace(text)]
  const contentBySentence = source.map((s) => toContentTokens(s))
  const globalCounts = new Map<string, number>()

  for (const tokens of contentBySentence) {
    for (const t of tokens) globalCounts.set(t, (globalCounts.get(t) ?? 0) + 1)
  }

  const scores = source.map((sentence, i) => {
    const terms = contentBySentence[i]
    const termScore = terms.reduce((acc, t) => acc + (globalCounts.get(t) ?? 0), 0)
    const cueScore = scoreTransitionCue(sentence)
    const len = tokenize(sentence).length
    return termScore + cueScore + (len >= 6 && len <= 30 ? 1 : 0.5)
  })

  const best = scores.reduce((b, s, i, a) => (s > a[b] ? i : b), 0)
  const preferred = contentBySentence[best] ?? []
  const unique: string[] = []
  for (const t of preferred) {
    if (!unique.includes(t) && !GENERIC_WORDS.has(t)) unique.push(t)
  }

  const targets = unique.length >= 2 ? unique : extractRankedTerms(text, 5)
  const desired = targets.length >= 4 ? 4 : targets.length >= 3 ? 3 : 2
  const labelWords = targets.slice(0, clamp(desired, 2, 4))

  return enforceKeywordShape(labelWords.join(' '), text)
}

// ── Segment merge / split helpers ─────────────────────────────────────────────

function splitLongestUnit(units: string[]): string[] {
  const idx = units.reduce(
    (best, cur, i, a) => (cur.length > a[best].length ? i : best),
    0,
  )
  const target = units[idx] ?? ''
  if (target.length < 56) return units

  const byClause = target.split(/[,;:]\s+/).map((p) => p.trim()).filter(Boolean)
  if (byClause.length >= 2) {
    const mid = Math.floor(byClause.length / 2)
    const a = byClause.slice(0, mid).join(', ').trim()
    const b = byClause.slice(mid).join(', ').trim()
    if (a && b) return [...units.slice(0, idx), a, b, ...units.slice(idx + 1)]
  }

  const midpoint = Math.floor(target.length / 2)
  const r = target.indexOf(' ', midpoint)
  const l = target.lastIndexOf(' ', midpoint)
  const pivot = r > -1 ? r : l
  if (pivot <= 0 || pivot >= target.length - 1) return units

  const first = target.slice(0, pivot).trim()
  const second = target.slice(pivot + 1).trim()
  if (!first || !second) return units
  return [...units.slice(0, idx), first, second, ...units.slice(idx + 1)]
}

function mergeSmallestNeighbors(drafts: GeneratedSegmentDraft[]): GeneratedSegmentDraft[] {
  if (drafts.length <= 1) return drafts

  let mergeIdx = 0
  let shortest = Infinity
  for (let i = 0; i < drafts.length - 1; i++) {
    const score = drafts[i].text.length + drafts[i + 1].text.length
    if (score < shortest) { shortest = score; mergeIdx = i }
  }

  const merged = `${drafts[mergeIdx].text} ${drafts[mergeIdx + 1].text}`.replace(/\s+/g, ' ').trim()
  return [
    ...drafts.slice(0, mergeIdx),
    { text: merged, keyword: createKeywordSummary(merged) },
    ...drafts.slice(mergeIdx + 2),
  ]
}

function makeDistinctKeywords(drafts: GeneratedSegmentDraft[]): GeneratedSegmentDraft[] {
  const seen = new Map<string, number>()

  return drafts.map((draft) => {
    let keyword = enforceKeywordShape(draft.keyword, draft.text)
    let normalized = keyword.toLowerCase()
    let count = seen.get(normalized) ?? 0

    if (count > 0) {
      const words = keyword.split(/\s+/)
      const additions = extractRankedTerms(draft.text, 4).map(toTitle)
      const extension = additions.find((t) => !words.includes(t))
      if (extension) {
        const updated = words.length < 4 ? [...words, extension] : [...words.slice(0, 3), extension]
        keyword = updated.join(' ')
        normalized = keyword.toLowerCase()
        count = seen.get(normalized) ?? 0
      }
      if (count > 0) {
        keyword = keyword + ' ' + String(count + 1)
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

// ── Topic inference ───────────────────────────────────────────────────────────

function normalizeTopicCandidate(topic: string): string {
  let cleaned = normalizeWhitespace(topic)
  cleaned = cleaned.replace(TOPIC_LABEL_PREFIX, '')
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, '').trim()
  cleaned = cleaned.replace(/[|/]+/g, ' ').replace(/\s+/g, ' ').trim()
  cleaned = cleaned.replace(/[.,;:!?-]+$/g, '').trim()

  if (!cleaned) return ''
  if (cleaned.length > 72) {
    const head = cleaned.split(/[.!?;:]/)[0]?.trim() ?? ''
    cleaned = head.length >= 12 ? head : cleaned.slice(0, 72).trim()
  }

  if (GENERIC_TOPIC_PHRASES.has(cleaned.toLowerCase())) return ''

  const words = tokenize(cleaned)
  const content = toContentTokens(cleaned)
  if (words.length < 2 || content.length === 0) return ''

  return toTopicCase(cleaned)
}

function detectExplicitTopicFromText(text: string): string {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  if (lines.length === 0) return ''

  for (const line of lines.slice(0, 8)) {
    if (!TOPIC_LABEL_PREFIX.test(line)) continue
    const c = normalizeTopicCandidate(line)
    if (c) return c
  }

  for (const line of lines.slice(0, 5)) {
    const stripped = stripListPrefix(line)
    if (!stripped || /[.!?]$/.test(stripped)) continue
    const words = tokenize(stripped)
    const content = toContentTokens(stripped)
    const isHeadingLike = words.length >= 2 && words.length <= 10 && stripped.length <= 80
    const isContentHeavy = content.length >= 2 && content.length / Math.max(words.length, 1) >= 0.45
    if (!isHeadingLike || !isContentHeavy) continue
    const c = normalizeTopicCandidate(stripped)
    if (c) return c
  }

  return ''
}

function synthesizeMainTopic(text: string): string {
  // Prefer a recurring bigram as the topic (it's often the "about" phrase)
  const bigrams = extractBigrams(text, 3)
  if (bigrams.length > 0) {
    const candidate = normalizeTopicCandidate(bigrams[0])
    if (candidate) return candidate
  }

  const summary = normalizeTopicCandidate(createKeywordSummary(text))
  if (summary) return summary

  const ranked = extractRankedTerms(text, 5).map(toTitle)
  if (ranked.length >= 2) {
    const c = normalizeTopicCandidate(ranked.slice(0, 4).join(' '))
    if (c) return c
  }

  return FALLBACK_MAIN_TOPIC
}

export function inferMainTopic(text: string, suggestedTopic?: string): string {
  const normalizedText = normalizeWhitespace(text)
  if (!normalizedText) return FALLBACK_MAIN_TOPIC

  const explicit = detectExplicitTopicFromText(normalizedText)
  if (explicit) return explicit

  const model = normalizeTopicCandidate(suggestedTopic ?? '')
  if (model) return model

  return synthesizeMainTopic(normalizedText)
}

// ── Normalise LLM draft output ────────────────────────────────────────────────

export function normalizeGeneratedDrafts(
  drafts: GeneratedSegmentDraft[],
  options: SegmentAnalysisOptions,
  fallbackText: string,
): GeneratedSegmentDraft[] {
  const minSegments = clamp(options.minSegments, 1, 24)
  const maxSegments = clamp(options.maxSegments, minSegments, 24)

  let next: GeneratedSegmentDraft[] = drafts
    .map((d) => {
      const it = normalizeIconTokens(d.iconTokens)
      return it
        ? { text: normalizeWhitespace(d.text), keyword: normalizeWhitespace(d.keyword), iconTokens: it }
        : { text: normalizeWhitespace(d.text), keyword: normalizeWhitespace(d.keyword) }
    })
    .filter((d) => d.text.length > 0)

  if (next.length === 0) {
    next = localAnalyzeMapText(fallbackText, { minSegments, maxSegments })
  }

  while (next.length > maxSegments) next = mergeSmallestNeighbors(next)

  while (next.length < minSegments) {
    const src = next.length > 0 ? next : [{ text: fallbackText, keyword: '' }]
    const attempt = splitLongestUnit(src.map((s) => s.text))
    if (attempt.length <= src.length) break
    next = attempt.map((text) => ({ text, keyword: createKeywordSummary(text) }))
  }

  next = next.map((d) => {
    const it = normalizeIconTokens(d.iconTokens)
    const keyword = enforceKeywordShape(d.keyword || createKeywordSummary(d.text), d.text)
    return it ? { text: d.text, keyword, iconTokens: it } : { text: d.text, keyword }
  })

  return makeDistinctKeywords(next)
}

// ── Main local analysis entry point ──────────────────────────────────────────

export function localAnalyzeMapText(
  text: string,
  options: SegmentAnalysisOptions,
): GeneratedSegmentDraft[] {
  const minSegments = clamp(options.minSegments, 1, 24)
  const maxSegments = clamp(options.maxSegments, minSegments, 24)
  const normalizedInput = normalizeWhitespace(text)
  if (!normalizedInput) return []

  // Step 1 — use paragraph/list structure as primary segmentation signal.
  const blocks = splitIntoBlocks(normalizedInput)

  // Step 2 — if blocks already give us a usable count, work from them.
  //          Otherwise fall back to sentence-level splitting.
  let units: string[] = blocks.length >= 2 ? blocks : splitSentences(normalizedInput)
  if (units.length === 0) units = [normalizedInput]

  // Step 3 — split long blocks further until we have enough raw units.
  const hardTarget = clamp(Math.ceil(units.length / 2), minSegments, maxSegments)
  let expansions = 0
  while (units.length < hardTarget && expansions < 12) {
    const split = splitLongestUnit(units)
    if (split.length === units.length) break
    units = split
    expansions++
  }

  const targetSegments = clamp(hardTarget, 1, units.length)

  // Step 4 — compute boundary scores using topic-shift + transition cues.
  const contentPerUnit = units.map((u) => toContentTokens(u))
  const termCounts = new Map<string, number>()
  for (const tokens of contentPerUnit) {
    for (const t of tokens) termCounts.set(t, (termCounts.get(t) ?? 0) + 1)
  }

  const sentenceScores = units.map((u, i) => {
    const terms = contentPerUnit[i]
    const termScore = terms.reduce((acc, t) => acc + (termCounts.get(t) ?? 0), 0)
    const cueScore = scoreTransitionCue(u)
    const posScore = i === 0 || i === units.length - 1 ? 0.5 : 0
    return termScore + cueScore + posScore
  })

  const candidateBoundaries: { index: number; score: number }[] = []
  for (let i = 0; i < units.length - 1; i++) {
    const left = contentPerUnit[i]
    const right = contentPerUnit[i + 1]
    const topicShift = 1 - jaccardSimilarity(left, right)
    const cueShift = scoreTransitionCue(units[i + 1])
    const salience = (sentenceScores[i] + sentenceScores[i + 1]) * 0.08
    // Paragraph boundaries coming from splitIntoBlocks are already strong
    // splits; boost them here by noting that consecutive very-short raw units
    // typically come from list items (already natural splits).
    const isNaturalBreak = units[i].length < 120 && units[i + 1].length < 120 ? 0.3 : 0
    candidateBoundaries.push({ index: i, score: topicShift + cueShift + salience + isNaturalBreak })
  }

  candidateBoundaries.sort((a, b) => b.score - a.score)
  const boundaryCount = Math.max(0, targetSegments - 1)
  const selectedBoundaries = candidateBoundaries
    .slice(0, boundaryCount)
    .map((c) => c.index)
    .sort((a, b) => a - b)

  // Even-split fallback when no clear boundaries emerge
  if (selectedBoundaries.length === 0 && boundaryCount > 0) {
    const size = Math.floor(units.length / targetSegments)
    const computed = new Set<number>()
    for (let i = 1; i < targetSegments; i++) {
      computed.add(clamp(i * size - 1, 0, units.length - 2))
    }
    selectedBoundaries.push(...computed)
    selectedBoundaries.sort((a, b) => a - b)
  }

  // Step 5 — group units into segments.
  const drafts: GeneratedSegmentDraft[] = []
  let start = 0

  for (const boundary of selectedBoundaries) {
    const chunk = units.slice(start, boundary + 1).join(' ').trim()
    if (chunk) drafts.push({ text: chunk, keyword: createKeywordSummary(chunk) })
    start = boundary + 1
  }

  const tail = units.slice(start).join(' ').trim()
  if (tail) drafts.push({ text: tail, keyword: createKeywordSummary(tail) })

  return normalizeGeneratedDrafts(drafts, { minSegments, maxSegments }, normalizedInput)
}
