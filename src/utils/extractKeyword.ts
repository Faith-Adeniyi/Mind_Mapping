const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'because',
  'by',
  'for',
  'from',
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
  'we',
  'with',
  'you',
  'your',
])

function toTitleCase(word: string) {
  return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
}

export function extractKeyword(text: string) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)

  const important = words.filter((word) => word.length > 2 && !STOP_WORDS.has(word))
  const source = important.length > 0 ? important : words

  if (source.length === 0) {
    return 'Untitled Segment'
  }

  return source
    .slice(0, 3)
    .map((word) => toTitleCase(word))
    .join(' ')
}
