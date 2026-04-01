export function createPreview(text: string, length = 84) {
  const normalized = text.replace(/\s+/g, ' ').trim()

  if (normalized.length <= length) {
    return normalized
  }

  return `${normalized.slice(0, length).trimEnd()}...`
}
