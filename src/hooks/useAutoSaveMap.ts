import { useEffect, useRef, useState } from 'react'
import { updateMap } from '../lib/mindMapsApi'
import type { MapDraft, SavedMindMap } from '../types'

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

type Options = {
  mapId: string | null
  draft: MapDraft
  onSaved?: (saved: SavedMindMap) => void
  onError?: (error: unknown) => void
  debounceMs?: number
}

function serializeDraft(draft: MapDraft) {
  return JSON.stringify({
    topic: draft.topic,
    rawText: draft.rawText,
    desiredSegmentCount: draft.desiredSegmentCount,
    segments: draft.segments,
    layoutMode: draft.layoutMode,
  })
}

export function useAutoSaveMap({ mapId, draft, onSaved, onError, debounceMs = 1500 }: Options) {
  const [state, setState] = useState<SaveState>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const timerRef = useRef<number | null>(null)
  const baselineRef = useRef<{ mapId: string | null; serialized: string }>({
    mapId: null,
    serialized: '',
  })

  useEffect(() => {
    if (!mapId) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
      baselineRef.current = { mapId: null, serialized: '' }
      return
    }

    const serialized = serializeDraft(draft)

    // mapId just changed (loaded / created) — adopt current draft as baseline, no save.
    if (baselineRef.current.mapId !== mapId) {
      baselineRef.current = { mapId, serialized }
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // Same map, no actual change.
    if (baselineRef.current.serialized === serialized) return

    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      setState('saving')
      updateMap(mapId, draft)
        .then((saved) => {
          baselineRef.current = { mapId, serialized }
          setState('saved')
          setLastSavedAt(Date.now())
          onSaved?.(saved)
        })
        .catch((err) => {
          setState('error')
          onError?.(err)
        })
    }, debounceMs)

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [mapId, draft, debounceMs, onSaved, onError])

  return { state, lastSavedAt }
}
