import type { Segment } from '../types'

type PresentationModeProps = {
  isOpen: boolean
  title: string
  subtitle: string
  segments: Segment[]
  currentIndex: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
}

export function PresentationMode({
  isOpen,
  title,
  subtitle,
  segments,
  currentIndex,
  onClose,
  onPrevious,
  onNext,
}: PresentationModeProps) {
  const activeSegment = segments[currentIndex]

  if (!isOpen) {
    return null
  }

  return (
    <div className="presentation-overlay" role="dialog" aria-modal="true" aria-label="Presentation mode">
      <div className="presentation-shell">
        <header className="presentation-header">
          <div>
            <p className="panel__eyebrow">Presentation mode</p>
            <h2>{title || 'Main Topic'}</h2>
            <p className="presentation-subtitle">{subtitle || 'Use the memory rail to present confidently.'}</p>
          </div>

          <button type="button" className="ghost-btn" onClick={onClose}>
            Exit
          </button>
        </header>

        <main className="presentation-body">
          <div className="presentation-preview">
            <div className="presentation-preview__core">
              <span className="presentation-preview__icon">{activeSegment?.icon ?? '🕐'}</span>
              <strong>{activeSegment?.keyword ?? 'Ready'}</strong>
              <p>
                {activeSegment?.text ??
                  'Click next to begin moving through your ClockRail memory map.'}
              </p>
            </div>

            <div className="presentation-progress">
              <div
                className="presentation-progress__bar"
                style={{
                  width:
                    segments.length > 0
                      ? `${((currentIndex + 1) / segments.length) * 100}%`
                      : '0%',
                }}
              />
            </div>

            <p className="presentation-counter">
              {segments.length > 0 ? `${currentIndex + 1} / ${segments.length}` : '0 / 0'}
            </p>
          </div>

          <div className="presentation-controls">
            <button type="button" className="ghost-btn" onClick={onPrevious} disabled={currentIndex <= 0}>
              Previous
            </button>
            <button
              type="button"
              className="primary-btn"
              onClick={onNext}
              disabled={currentIndex >= segments.length - 1}
            >
              Next
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
