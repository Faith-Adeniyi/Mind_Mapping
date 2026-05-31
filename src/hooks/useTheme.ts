import { useCallback, useEffect, useState } from 'react'

export type ThemeMode = 'day' | 'blue'

const STORAGE_KEY = 'clockray:theme'
const DEFAULT_THEME: ThemeMode = 'day'

function readStored(): ThemeMode {
  if (typeof window === 'undefined') return DEFAULT_THEME
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'day' || stored === 'blue' ? stored : DEFAULT_THEME
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  root.classList.add('theming')
  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.classList.remove('theming'))
  })
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => readStored())

  useEffect(() => {
    applyTheme(theme)
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'day' ? 'blue' : 'day'))
  }, [])

  return { theme, setTheme, toggleTheme }
}
