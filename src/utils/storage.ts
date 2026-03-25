import type { DraftState } from '../types'

const DRAFT_KEY = 'clockrail-draft'

export function loadDraft(): DraftState | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as DraftState
    return {
      ...parsed,
      presentation: {
        ...(parsed.presentation ?? {}),
        isOpen: false,
        currentIndex: 0,
        isFullscreen: false,
      },
    }
  } catch {
    return null
  }
}

export function saveDraft(draft: DraftState) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // ignore storage failures
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore storage failures
  }
}
