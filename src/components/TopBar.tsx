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
        <button type="button" className="ghost-button ghost-button--disabled" disabled aria-disabled="true">
          Export PDF
          <span className="soon-pill">Coming soon</span>
        </button>
      </div>
    </header>
  )
}
