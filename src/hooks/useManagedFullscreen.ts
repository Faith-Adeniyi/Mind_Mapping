import { useCallback, useEffect, useState, type RefObject } from 'react'

type UseManagedFullscreenOptions = {
  targetRef: RefObject<HTMLElement | null>
  enabled?: boolean
}

type UseManagedFullscreenResult = {
  isFullscreen: boolean
  isFullscreenSupported: boolean
  isRequestInFlight: boolean
  enterFullscreen: () => Promise<boolean>
  toggleFullscreen: () => Promise<boolean>
  exitFullscreen: () => Promise<boolean>
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  const tagName = target.tagName.toLowerCase()
  return tagName === 'input' || tagName === 'textarea' || target.isContentEditable
}

function ownsFullscreenElement(target: HTMLElement | null, fullscreenElement: Element | null) {
  if (!target || !fullscreenElement) {
    return false
  }

  return target === fullscreenElement || target.contains(fullscreenElement)
}

export function useManagedFullscreen({
  targetRef,
  enabled = true,
}: UseManagedFullscreenOptions): UseManagedFullscreenResult {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isFullscreenSupported, setIsFullscreenSupported] = useState(false)
  const [isRequestInFlight, setIsRequestInFlight] = useState(false)

  useEffect(() => {
    const target = targetRef.current
    const supported = typeof document !== 'undefined' &&
      typeof document.fullscreenEnabled === 'boolean' &&
      document.fullscreenEnabled &&
      Boolean(target?.requestFullscreen)

    setIsFullscreenSupported(supported)
  }, [targetRef])

  useEffect(() => {
    if (!enabled) {
      setIsFullscreen(false)
      return undefined
    }

    const syncFullscreenState = () => {
      setIsFullscreen(ownsFullscreenElement(targetRef.current, document.fullscreenElement))
      setIsRequestInFlight(false)
    }

    syncFullscreenState()

    document.addEventListener('fullscreenchange', syncFullscreenState)
    document.addEventListener('fullscreenerror', syncFullscreenState)

    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreenState)
      document.removeEventListener('fullscreenerror', syncFullscreenState)
    }
  }, [enabled, targetRef])

  const exitFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      return false
    }

    setIsRequestInFlight(true)

    try {
      await document.exitFullscreen()
      return true
    } catch {
      return false
    } finally {
      setIsRequestInFlight(false)
    }
  }, [])

  const enterFullscreen = useCallback(async () => {
    if (!enabled || !isFullscreenSupported || !targetRef.current) {
      return false
    }

    setIsRequestInFlight(true)

    try {
      await targetRef.current.requestFullscreen()
      return true
    } catch {
      return false
    } finally {
      setIsRequestInFlight(false)
    }
  }, [enabled, isFullscreenSupported, targetRef])

  const toggleFullscreen = useCallback(async () => {
    if (isFullscreen) {
      return exitFullscreen()
    }

    return enterFullscreen()
  }, [enterFullscreen, exitFullscreen, isFullscreen])

  useEffect(() => {
    if (!enabled) {
      if (ownsFullscreenElement(targetRef.current, document.fullscreenElement)) {
        void exitFullscreen()
      }
      return undefined
    }

    return undefined
  }, [enabled, exitFullscreen, targetRef])

  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.key.toLowerCase() !== 'f') {
        return
      }

      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || isEditableTarget(event.target)) {
        return
      }

      event.preventDefault()
      void toggleFullscreen()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, isFullscreen, isFullscreenSupported, toggleFullscreen])

  return {
    isFullscreen,
    isFullscreenSupported,
    isRequestInFlight,
    enterFullscreen,
    toggleFullscreen,
    exitFullscreen,
  }
}
