import { ICON_BY_TERM, getIconByIndex } from '../data/iconDefaults'

function hashToIndex(text: string) {
  let hash = 0

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0
  }

  return hash
}

export function assignIcon(text: string) {
  const normalized = text.toLowerCase()

  for (const [term, icon] of Object.entries(ICON_BY_TERM)) {
    if (normalized.includes(term)) {
      return icon
    }
  }

  return getIconByIndex(hashToIndex(normalized))
}
