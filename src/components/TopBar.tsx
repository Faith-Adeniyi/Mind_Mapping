import { useEffect, useRef, useState } from 'react'
import type { LayoutMode } from '../types'

type TopBarProps = {
  layoutMode: LayoutMode
  canPresent: boolean
  onLayoutChange: (mode: LayoutMode) => void
  onNewMap: () => void
  onPresent: () => void
}

const VIEW_OPTIONS: Array<{ mode: LayoutMode; label: string }> = [
  { mode: 'clock', label: 'Clock' },
  { mode: 'grid', label: 'Grid' },
  { mode: 'linear', label: 'Linear' },
]

export function TopBar({ layoutMode, canPresent, onLayoutChange, onNewMap, onPresent }: TopBarProps) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const moreMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isMoreMenuOpen) {
      return undefined
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!moreMenuRef.current) {
        return
      }

      const target = event.target as Node
      if (!moreMenuRef.current.contains(target)) {
        setIsMoreMenuOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMoreMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMoreMenuOpen])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1180) {
        setIsMoreMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <header className="topbar glass-panel">
      <div className="topbar__brand">
        <img
          src="/brand/allison-icon-64.png"
          alt=""
          className="topbar__brand-icon"
          width={32}
          height={32}
          loading="eager"
          decoding="async"
          aria-hidden="true"
        />
        <div className="topbar__brand-copy">
          <p className="topbar__logo">Allison Mind Mapping</p>
          <p className="topbar__subtitle">Memory Workspace</p>
        </div>
      </div>

      <div className="topbar__switcher" role="tablist" aria-label="Visualization Mode">
        {VIEW_OPTIONS.map((option) => (
          <button
            key={option.mode}
            type="button"
            className={`switcher-pill ${layoutMode === option.mode ? 'is-active' : ''}`}
            onClick={() => onLayoutChange(option.mode)}
            role="tab"
            aria-selected={layoutMode === option.mode}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="topbar__actions">
        <button type="button" className="ghost-button" onClick={onNewMap}>
          New Map
        </button>
        <button type="button" className="primary-button" onClick={onPresent} disabled={!canPresent}>
          Present
        </button>
        <button
          type="button"
          className="ghost-button ghost-button--disabled topbar__action-export-desktop"
          disabled
          aria-disabled="true"
        >
          Export PDF
          <span className="soon-pill">Coming soon</span>
        </button>
        <div className="topbar__more" ref={moreMenuRef}>
          <button
            type="button"
            className="ghost-button topbar__more-trigger"
            aria-haspopup="menu"
            aria-expanded={isMoreMenuOpen}
            onClick={() => setIsMoreMenuOpen((current) => !current)}
          >
            More
          </button>
          {isMoreMenuOpen ? (
            <div className="topbar__more-menu" role="menu" aria-label="More actions">
              <button
                type="button"
                className="ghost-button ghost-button--disabled topbar__more-item"
                role="menuitem"
                disabled
                aria-disabled="true"
              >
                Export PDF
                <span className="soon-pill">Coming soon</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
