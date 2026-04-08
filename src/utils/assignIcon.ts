import { ICON_BY_TERM } from '../data/iconDefaults'

export const ICON_COMBO_SEPARATOR = ' + '

const EMOJI_TOKENS = [
  '💡',
  '🎯',
  '⚠️',
  '📈',
  '📉',
  '💰',
  '✂️',
  '👥',
  '🕒',
  '🚀',
  '🧩',
  '🔍',
  '📚',
  '✅',
  '❌',
  '🧠',
  '🧪',
  '🔒',
  '📣',
  '🤝',
  '🛠️',
  '📝',
] as const

const ICONIFY_TOKENS = [
  'iconify:tabler:scissors',
  'iconify:tabler:coins',
  'iconify:tabler:chart-line',
  'iconify:tabler:alert-triangle',
  'iconify:tabler:users',
  'iconify:tabler:clock-hour-4',
  'iconify:tabler:rocket',
  'iconify:tabler:puzzle',
  'iconify:tabler:search',
  'iconify:tabler:bulb',
] as const

const ALLOWED_AUTO_ICON_TOKENS = new Set<string>([...EMOJI_TOKENS, ...ICONIFY_TOKENS])

type AssignIconInput = {
  text: string
  keyword?: string | null
  iconTokens?: string[] | null
}

type ComboRule = {
  groups: string[][]
  icons: [string, string]
}

const COMBO_RULES: ComboRule[] = [
  {
    groups: [
      ['budget', 'cost', 'spend', 'expense', 'funding', 'finance'],
      ['cut', 'slash', 'reduce', 'trim', 'drop', 'decrease'],
    ],
    icons: ['💰', 'iconify:tabler:scissors'],
  },
  {
    groups: [
      ['timeline', 'deadline', 'schedule', 'time'],
      ['risk', 'delay', 'blocked', 'issue', 'problem'],
    ],
    icons: ['🕒', '⚠️'],
  },
  {
    groups: [
      ['team', 'people', 'staff', 'workforce', 'org'],
      ['conflict', 'friction', 'alignment', 'communication', 'culture'],
    ],
    icons: ['👥', '📣'],
  },
  {
    groups: [
      ['growth', 'revenue', 'kpi', 'metric', 'performance'],
      ['decline', 'drop', 'dip', 'fall', 'loss'],
    ],
    icons: ['📈', '📉'],
  },
  {
    groups: [
      ['security', 'compliance', 'privacy', 'access'],
      ['risk', 'incident', 'breach', 'threat'],
    ],
    icons: ['🔒', '⚠️'],
  },
  {
    groups: [
      ['research', 'analysis', 'investigation', 'study'],
      ['experiment', 'test', 'validation', 'trial'],
    ],
    icons: ['🔍', '🧪'],
  },
  {
    groups: [
      ['launch', 'rollout', 'release', 'go-live'],
      ['plan', 'strategy', 'roadmap', 'execution'],
    ],
    icons: ['🚀', '🧩'],
  },
]

const SINGLE_ICON_RULES: Array<{ terms: string[]; icon: string }> = [
  { terms: ['budget', 'finance', 'cost', 'expense', 'funding'], icon: '💰' },
  { terms: ['cut', 'trim', 'reduce', 'downsize'], icon: 'iconify:tabler:scissors' },
  { terms: ['risk', 'issue', 'problem', 'challenge', 'incident'], icon: '⚠️' },
  { terms: ['growth', 'kpi', 'metric', 'performance', 'revenue'], icon: 'iconify:tabler:chart-line' },
  { terms: ['team', 'people', 'customer', 'audience'], icon: 'iconify:tabler:users' },
  { terms: ['timeline', 'deadline', 'schedule', 'time'], icon: 'iconify:tabler:clock-hour-4' },
  { terms: ['launch', 'release', 'deployment', 'rollout'], icon: 'iconify:tabler:rocket' },
  { terms: ['research', 'analysis', 'discover', 'investigation'], icon: 'iconify:tabler:search' },
  { terms: ['idea', 'insight', 'solution', 'concept', 'innovation'], icon: 'iconify:tabler:bulb' },
  { terms: ['plan', 'strategy', 'roadmap', 'architecture'], icon: '🧩' },
  { terms: ['agreement', 'partnership', 'stakeholder', 'collaboration'], icon: '🤝' },
  { terms: ['task', 'action', 'execution', 'operation', 'workflow'], icon: '🛠️' },
]

function normalizeToken(token: string) {
  return token.trim()
}

function normalizeAutoIconToken(token: string) {
  const normalized = normalizeToken(token)
  return ALLOWED_AUTO_ICON_TOKENS.has(normalized) ? normalized : null
}

function sanitizeAutoIconTokens(tokens: readonly string[] | null | undefined) {
  if (!tokens || tokens.length === 0) {
    return []
  }

  const unique = new Set<string>()

  for (const token of tokens) {
    const normalized = normalizeAutoIconToken(token)
    if (!normalized || unique.has(normalized)) {
      continue
    }

    unique.add(normalized)
    if (unique.size >= 2) {
      break
    }
  }

  return [...unique]
}

export function splitIconTokens(value: string) {
  return value
    .split(/\s*\+\s*/)
    .map((token) => normalizeToken(token))
    .filter(Boolean)
    .slice(0, 2)
}

function formatIconTokens(tokens: readonly string[]) {
  return tokens.join(ICON_COMBO_SEPARATOR)
}

function toSearchText(input: AssignIconInput) {
  const text = input.text?.toLowerCase() ?? ''
  const keyword = input.keyword?.toLowerCase() ?? ''
  return `${keyword} ${text}`.trim()
}

function groupMatches(searchText: string, terms: readonly string[]) {
  return terms.some((term) => searchText.includes(term))
}

function findContextualCombo(searchText: string) {
  for (const rule of COMBO_RULES) {
    const matches = rule.groups.every((group) => groupMatches(searchText, group))
    if (matches) {
      return [...rule.icons]
    }
  }

  return null
}

function findContextualSingle(searchText: string) {
  for (const [term, icon] of Object.entries(ICON_BY_TERM)) {
    if (searchText.includes(term)) {
      return icon
    }
  }

  let bestIcon: string | null = null
  let bestScore = 0

  for (const rule of SINGLE_ICON_RULES) {
    const score = rule.terms.reduce((sum, term) => (searchText.includes(term) ? sum + 1 : sum), 0)
    if (score > bestScore) {
      bestScore = score
      bestIcon = rule.icon
    }
  }

  return bestIcon ?? '💡'
}

export function assignIcon(input: string | AssignIconInput) {
  const normalizedInput: AssignIconInput = typeof input === 'string' ? { text: input } : input
  const suggested = sanitizeAutoIconTokens(normalizedInput.iconTokens)

  if (suggested.length > 0) {
    return formatIconTokens(suggested)
  }

  const searchText = toSearchText(normalizedInput)
  const combo = findContextualCombo(searchText)

  if (combo && combo.length > 0) {
    return formatIconTokens(combo)
  }

  return findContextualSingle(searchText)
}
