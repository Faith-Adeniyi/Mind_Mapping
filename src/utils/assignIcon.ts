import { getFallbackIcon, iconLibrary } from '../data/iconLibrary'

export function assignIcon(text: string) {
  const lowerText = text.toLowerCase()

  for (const [keyword, icon] of Object.entries(iconLibrary)) {
    if (keyword === 'default') {
      continue
    }

    if (lowerText.includes(keyword)) {
      return icon
    }
  }

  return getFallbackIcon(text)
}
