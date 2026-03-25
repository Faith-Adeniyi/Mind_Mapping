type TopBarProps = {
  onOpenPresentation: () => void
  onReset: () => void
  canPresent: boolean
}

export function TopBar({ onOpenPresentation, onReset, canPresent }: TopBarProps) {
  return (
    <header className="topbar">
      <div>
        <p className="topbar__brand">ClockRail</p>
        <h1 className="topbar__title">Visual memory mapping for presentations</h1>
      </div>

      <div className="topbar__actions">
        <button type="button" className="ghost-btn" onClick={onReset}>
          New map
        </button>
        <button type="button" className="primary-btn" onClick={onOpenPresentation} disabled={!canPresent}>
          Present
        </button>
      </div>
    </header>
  )
}
