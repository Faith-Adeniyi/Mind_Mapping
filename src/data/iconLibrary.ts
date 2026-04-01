export type IconSource = 'emoji' | 'symbol'

export type IconOption = {
  id: string
  glyph: string
  label: string
  keywords: string[]
  category: string
  source: IconSource
}

export type IconSourceData = {
  options: IconOption[]
  categories: string[]
}

type EmojiSkin = {
  native?: string
}

type EmojiEntry = {
  name?: string
  keywords?: string[]
  skins?: EmojiSkin[]
}

type EmojiCategory = {
  id: string
  name?: string
  emojis: string[]
}

type EmojiMartDataset = {
  categories: EmojiCategory[]
  emojis: Record<string, EmojiEntry>
}

type IconifySet = {
  prefix: string
  icons: Record<string, unknown>
}

const SYMBOL_LIMIT = 2400

const sourceCache: Partial<Record<IconSource, Promise<IconSourceData>>> = {}

function splitWords(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((word) => word.trim())
    .filter(Boolean)
}

function normalizeLabel(value: string) {
  return value
    .split('-')
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join(' ')
}

function normalizeCategoryLabel(value: string) {
  return value
    .split(/[-_]/g)
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join(' ')
}

function categorizeSymbol(name: string) {
  const tokens = splitWords(name)
  const has = (keywords: string[]) => keywords.some((keyword) => tokens.includes(keyword))

  if (has(['user', 'users', 'userplus', 'man', 'woman', 'child', 'friends', 'person', 'id'])) {
    return 'People'
  }

  if (has(['message', 'mail', 'chat', 'phone', 'call', 'at', 'send', 'inbox', 'outbox'])) {
    return 'Communication'
  }

  if (has(['chart', 'coin', 'cash', 'credit', 'wallet', 'receipt', 'currency', 'bank'])) {
    return 'Business'
  }

  if (has(['map', 'route', 'location', 'plane', 'car', 'bus', 'train', 'ship', 'travel'])) {
    return 'Travel'
  }

  if (has(['camera', 'video', 'music', 'play', 'movie', 'microphone', 'speaker'])) {
    return 'Media'
  }

  if (has(['device', 'cpu', 'server', 'database', 'code', 'terminal', 'cloud', 'wifi', 'bluetooth'])) {
    return 'Technology'
  }

  if (has(['calendar', 'clock', 'timer', 'hourglass', 'alarm'])) {
    return 'Time'
  }

  if (has(['book', 'school', 'pencil', 'pen', 'brain', 'bulb', 'idea', 'certificate'])) {
    return 'Learning'
  }

  if (has(['heart', 'mood', 'sparkles', 'star', 'sun', 'moon', 'weather'])) {
    return 'Mood'
  }

  if (has(['lock', 'shield', 'alert', 'warning', 'bug', 'fire', 'police'])) {
    return 'Security'
  }

  return 'General'
}

function toSourceData(options: IconOption[]): IconSourceData {
  return {
    options,
    categories: Array.from(new Set(options.map((option) => option.category))),
  }
}

function buildEmojiOptions(emojiDataRaw: unknown) {
  const emojiData = emojiDataRaw as EmojiMartDataset
  const options: IconOption[] = []

  for (const category of emojiData.categories ?? []) {
    const categoryName = normalizeCategoryLabel(category.name || category.id || 'General')

    for (const emojiId of category.emojis ?? []) {
      const entry = emojiData.emojis?.[emojiId]
      const native = entry?.skins?.[0]?.native

      if (!native) {
        continue
      }

      const label = entry.name ? normalizeCategoryLabel(entry.name) : normalizeCategoryLabel(emojiId)
      const keywords = Array.from(
        new Set([
          ...splitWords(emojiId),
          ...splitWords(label),
          ...(entry.keywords ?? []).flatMap((keyword) => splitWords(keyword)),
        ]),
      )

      options.push({
        id: `emoji:${emojiId}`,
        glyph: native,
        label,
        keywords,
        category: categoryName,
        source: 'emoji',
      })
    }
  }

  return options
}

function buildSymbolOptions(tablerCollectionRaw: unknown) {
  const tablerIconSet = tablerCollectionRaw as IconifySet
  const options: IconOption[] = []
  const symbolNames = Object.keys(tablerIconSet.icons ?? {}).sort().slice(0, SYMBOL_LIMIT)

  for (const name of symbolNames) {
    const label = normalizeLabel(name)
    const keywords = Array.from(new Set([...splitWords(name), ...splitWords(label)]))

    options.push({
      id: `symbol:${name}`,
      glyph: `iconify:${tablerIconSet.prefix}:${name}`,
      label,
      keywords,
      category: categorizeSymbol(name),
      source: 'symbol',
    })
  }

  return options
}

async function loadEmojiSourceData() {
  const module = await import('@emoji-mart/data')
  return toSourceData(buildEmojiOptions(module.default))
}

async function loadSymbolSourceData() {
  const module = await import('@iconify-json/tabler')
  return toSourceData(buildSymbolOptions(module.icons))
}

export function loadIconSourceData(source: IconSource): Promise<IconSourceData> {
  const cached = sourceCache[source]
  if (cached) {
    return cached
  }

  const loader = source === 'emoji' ? loadEmojiSourceData : loadSymbolSourceData

  const promise = loader().catch((error) => {
    delete sourceCache[source]
    throw error
  })

  sourceCache[source] = promise
  return promise
}

export function searchIconOptions(options: IconOption[], query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) {
    return options
  }

  return options.filter((option) => {
    const inLabel = option.label.toLowerCase().includes(normalized)
    const inCategory = option.category.toLowerCase().includes(normalized)
    const inKeywords = option.keywords.some((keyword) => keyword.includes(normalized))

    return inLabel || inCategory || inKeywords
  })
}
