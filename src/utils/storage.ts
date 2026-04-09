import type { LayoutMode, MapDraft, Segment, SegmentTone } from '../types'
import { sanitizeTopicInput } from './inputValidation'

const STORAGE_KEY = 'clockrail:mvp:draft'
const MIN_DESIRED_SEGMENTS = 3
const MAX_DESIRED_SEGMENTS = 12
const DEFAULT_DESIRED_SEGMENTS = 6

function clampDesiredSegmentCount(value: number) {
  return Math.max(MIN_DESIRED_SEGMENTS, Math.min(MAX_DESIRED_SEGMENTS, value))
}

function isLayoutMode(value: unknown): value is LayoutMode {
  return value === 'clock' || value === 'grid' || value === 'linear'
}

function isTone(value: unknown): value is SegmentTone {
  return value === 'primary' || value === 'secondary' || value === 'tertiary' || value === 'alert' || value === 'neutral'
}

function isSegment(value: unknown): value is Segment {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<Segment>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.order === 'number' &&
    typeof candidate.text === 'string' &&
    typeof candidate.keyword === 'string' &&
    typeof candidate.icon === 'string' &&
    typeof candidate.preview === 'string' &&
    isTone(candidate.tone)
  )
}

function isMapDraft(value: unknown): value is MapDraft {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<MapDraft>

  return (
    typeof candidate.topic === 'string' &&
    typeof candidate.rawText === 'string' &&
    (candidate.desiredSegmentCount === undefined ||
      (typeof candidate.desiredSegmentCount === 'number' && Number.isFinite(candidate.desiredSegmentCount))) &&
    Array.isArray(candidate.segments) &&
    candidate.segments.every((segment) => isSegment(segment)) &&
    (typeof candidate.activeSegmentId === 'string' || candidate.activeSegmentId === null) &&
    isLayoutMode(candidate.layoutMode)
  )
}

export function loadDraft() {
  try {
    // Legacy privacy cleanup: remove persisted cross-session drafts from previous localStorage usage.
    window.localStorage.removeItem(STORAGE_KEY)

    const raw = window.sessionStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return null
    }

    const parsed: unknown = JSON.parse(raw)
    if (!isMapDraft(parsed)) {
      return null
    }

    return {
      ...parsed,
      topic: sanitizeTopicInput(parsed.topic),
      desiredSegmentCount: clampDesiredSegmentCount(
        typeof parsed.desiredSegmentCount === 'number' ? parsed.desiredSegmentCount : DEFAULT_DESIRED_SEGMENTS,
      ),
    }
  } catch {
    return null
  }
}

export function saveDraft(draft: MapDraft) {
  try {
    const safeDraft: MapDraft = {
      ...draft,
      topic: sanitizeTopicInput(draft.topic),
    }
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(safeDraft))
  } catch {
    // Ignore persistence errors silently.
  }
}

export function clearDraft() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore persistence errors silently.
  }
}
