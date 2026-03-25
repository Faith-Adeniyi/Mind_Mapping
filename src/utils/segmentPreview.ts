export function createPreview(text: string, length = 72) {
  const trimmed = text.trim()
  if (trimmed.length <= length) {
    return trimmed
  }

  return `${trimmed.slice(0, length).trim()}…`
}
