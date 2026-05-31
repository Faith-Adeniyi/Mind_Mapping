import { useCallback, useEffect, useState } from 'react'
import { listMaps } from '../lib/mindMapsApi'
import type { SavedMindMap } from '../types'

export function useMindMaps(userId: string | null) {
  const [maps, setMaps] = useState<SavedMindMap[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await listMaps()
      setMaps(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load maps')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Reset cached state when the user changes so account A's maps never leak into account B's view.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset tied to userId identity change
    setMaps([])
    setError(null)
    if (!userId) return
    void refresh()
  }, [userId, refresh])

  const upsertLocal = useCallback((map: SavedMindMap) => {
    setMaps((curr) => {
      const filtered = curr.filter((m) => m.id !== map.id)
      const next = [map, ...filtered]
      next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      return next
    })
  }, [])

  const removeLocal = useCallback((id: string) => {
    setMaps((curr) => curr.filter((m) => m.id !== id))
  }, [])

  return { maps, isLoading, error, refresh, upsertLocal, removeLocal }
}
