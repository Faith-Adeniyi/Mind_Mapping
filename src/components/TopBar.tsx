import { useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import { supabase } from '../lib/supabase'
import type { ThemeMode } from '../hooks/useTheme'
import type { SaveState } from '../hooks/useAutoSaveMap'
import type { LayoutMode } from '../types'

type TopBarProps = {
  layoutMode: LayoutMode
  canPresent: boolean
  canExport: boolean
  hasSegments: boolean
  userEmail: string
  theme: ThemeMode
  saveState: SaveState
  lastSavedAt: number | null
  onLayoutChange: (mode: LayoutMode) => void
  onNewMap: () => void
  onPresent: () => void
  onExportPdf: () => void
  onToggleTheme: () => void
  onOpenHistory: () => void
}

const VIEW_OPTIONS: Array<{ mode: LayoutMode; label: string; icon: string }> = [
  { mode: 'clock', label: 'Clock', icon: 'tabler:clock' },
  { mode: 'grid', label: 'Grid', icon: 'tabler:layout-grid' },
  { mode: 'linear', label: 'Linear', icon: 'tabler:list' },
]

function avatarLabel(email: string) {
  const trimmed = email.trim()
  if (!trimmed) return 'U'
  return trimmed[0]?.toUpperCase() ?? 'U'
}

function saveLabel(state: SaveState, lastSavedAt: number | null) {
  if (state === 'saving') return 'Saving…'
  if (state === 'error') return 'Save failed'
  if (state === 'saved' || lastSavedAt) {
    if (!lastSavedAt) return 'Saved'
    const diffMin = Math.floor((Date.now() - lastSavedAt) / 60000)
    if (diffMin < 1) return 'Saved · just now'
    if (diffMin < 60) return `Saved · ${diffMin}m ago`
    return 'Saved'
  }
  return null
}

export function TopBar({
  layoutMode,
  canPresent,
  canExport,
  hasSegments,
  userEmail,
  theme,
  saveState,
  lastSavedAt,
  onLayoutChange,
  onNewMap,
  onPresent,
  onExportPdf,
  onToggleTheme,
  onOpenHistory,
}: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handlePointer = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen])

  const handleSignOut = () => {
    setMenuOpen(false)
    void supabase.auth.signOut()
  }

  const isDark = theme === 'blue'
  const logoSrc = isDark ? '/brand/icon+wordmark_logo_white.png' : '/brand/icon+wordmark_logo_blue.png'
  const savedMessage = saveLabel(saveState, lastSavedAt)

  return (
    <header className="bar">
      <button type="button" className="bar__brand" onClick={onNewMap} aria-label="ClockRay home">
        <img src={logoSrc} alt="Allison's Memory ClockRay" />
      </button>

      <nav className="switcher" aria-label="View">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.mode}
            type="button"
            className={layoutMode === option.mode ? 'on' : ''}
            disabled={!hasSegments}
            onClick={() => onLayoutChange(option.mode)}
            aria-pressed={layoutMode === option.mode}
          >
            <Icon icon={option.icon} width={16} height={16} />
            <span>{option.label}</span>
          </button>
        ))}
      </nav>

      <div className="bar__actions">
        {savedMessage ? (
          <span
            className={`bar__save bar__save--${saveState === 'error' ? 'err' : 'ok'}`}
            aria-live="polite"
          >
            {savedMessage}
          </span>
        ) : null}
        <button
          type="button"
          className="btn btn--icon btn--ghost"
          onClick={onToggleTheme}
          aria-label={`Switch to ${isDark ? 'Daylight' : 'Blue Hour'} theme`}
          title={`Switch to ${isDark ? 'Daylight' : 'Blue Hour'} theme`}
        >
          <Icon icon={isDark ? 'tabler:sun' : 'tabler:moon'} width={16} height={16} />
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onOpenHistory}
          aria-label="My maps"
          title="My maps"
        >
          <Icon icon="tabler:history" width={16} height={16} />
          <span className="max-md:hidden">My maps</span>
        </button>
        <button type="button" className="btn btn--ghost" onClick={onNewMap}>
          <Icon icon="tabler:plus" width={16} height={16} />
          <span className="max-md:hidden">New</span>
        </button>
        <button type="button" className="btn btn--ghost" disabled={!canExport} onClick={onExportPdf}>
          <Icon icon="tabler:file-export" width={16} height={16} />
          <span className="max-md:hidden">Export</span>
        </button>
        <button type="button" className="btn btn--brand" disabled={!canPresent} onClick={onPresent}>
          <Icon icon="tabler:presentation" width={16} height={16} />
          <span className="max-md:hidden">Present</span>
        </button>
        <div className="avatar-menu" ref={menuRef}>
          <button
            type="button"
            className="avatar"
            title={userEmail ? `Signed in as ${userEmail}` : 'Account'}
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {avatarLabel(userEmail)}
          </button>
          {menuOpen ? (
            <div className="avatar-menu__pop" role="menu">
              {userEmail ? (
                <div className="avatar-menu__who">
                  <span className="avatar-menu__label">Signed in as</span>
                  <span className="avatar-menu__email" title={userEmail}>{userEmail}</span>
                </div>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className="avatar-menu__item"
                onClick={handleSignOut}
              >
                <Icon icon="tabler:logout" width={16} height={16} />
                <span>Sign out</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
