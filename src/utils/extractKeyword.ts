const stopWords = new Set([
  'the',
  'and',
  'for',
  'with',
  'that',
  'this',
  'from',
  'they',
  'have',
  'were',
  'been',
  'their',
  'would',
  'there',
  'could',
  'should',
  'about',
  'into',
  'when',
  'where',
  'which',
  'what',
  'your',
  'our',
  'you',
  'are',
  'was',
  'will',
  'can',
  'may',
  'not',
  'but',
  'all',
  'any',
  'some',
  'more',
  'most',
  'many',
  'much',
  'over',
  'under',
  'very',
  'after',
  'before',
  'first',
  'last',
  'then',
  'than',
])

export function extractKeyword(text: string) {
  const words = text
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3)

  const significantWords = words.filter((word) => !stopWords.has(word.toLowerCase()))

  if (significantWords.length >= 2) {
    return significantWords.slice(0, 2).join(' ')
  }

  if (significantWords.length === 1) {
    return significantWords[0].slice(0, 18)
  }

  if (words.length > 0) {
    return words[0].slice(0, 18)
  }

  return 'Topic'
}
