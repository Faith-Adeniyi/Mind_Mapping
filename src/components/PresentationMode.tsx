import { useEffect, useMemo } from 'react'
import type { LayoutMode, Segment } from '../types'
import { ClockRay } from './ClockRay'
import { GridView } from './GridView'
import { IconGlyph } from './IconGlyph'
import { LinearView } from './LinearView'

type PresentationModeProps = {
  isOpen: boolean
  topic: string
  layoutMode: LayoutMode
  segments: Segment[]
  activeSegmentId: string | null
  currentIndex: number
  onClose: () => void
  onSelectSegment: (segmentId: string) => void
  onNext: () => void
  onPrevious: () => void
}

export function PresentationMode({
  isOpen,
  topic,
  layoutMode,
  segments,
  activeSegmentId,
  currentIndex,
  onClose,
  onSelectSegment,
  onNext,
  onPrevious,
}: PresentationModeProps) {
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault()
        onNext()
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onPrevious()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose, onNext, onPrevious])

  const content = useMemo(() => {
    if (layoutMode === 'grid') {
      return (
        <GridView
          topic={topic}
          segments={segments}
          activeSegmentId={activeSegmentId}
          onSelectSegment={onSelectSegment}
        />
      )
    }

    if (layoutMode === 'linear') {
      return (
        <LinearView
          topic={topic}
          segments={segments}
          activeSegmentId={activeSegmentId}
          onSelectSegment={onSelectSegment}
        />
      )
    }

    return (
      <ClockRay
        topic={topic}
        segments={segments}
        activeSegmentId={activeSegmentId}
        onSelectSegment={onSelectSegment}
      />
    )
  }, [activeSegmentId, layoutMode, onSelectSegment, segments, topic])

  if (!isOpen) {
    return null
  }

  const activeSegment = segments[currentIndex] ?? null
  const progress = segments.length > 0 ? ((currentIndex + 1) / segments.length) * 100 : 0

  return (
    <div className="presentation-overlay" role="dialog" aria-modal="true" aria-label="Presentation Mode">
      <div className="presentation-shell glass-panel">
        <header className="presentation-shell__head">
          <div>
            <p className="panel-kicker">Presentation Mode</p>
            <h2>{topic || 'Untitled Map'}</h2>
          </div>
          <div className="presentation-shell__actions">
            <span className="hotkey-pill">Left / Right / Space / Esc</span>
            <button type="button" className="ghost-button" onClick={onClose}>
              Exit
            </button>
          </div>
        </header>

        <div className="presentation-shell__body">{content}</div>

        <footer className="presentation-shell__foot">
          <div className="progress-track" aria-hidden="true">
            <span className="progress-track__fill" style={{ width: `${progress}%` }} />
          </div>

          <div className="presentation-shell__meta">
            <p>
              {segments.length > 0 ? `${currentIndex + 1} / ${segments.length}` : '0 / 0'}
            </p>
            <div className="presentation-shell__nav">
              <button type="button" className="ghost-button" onClick={onPrevious} disabled={currentIndex <= 0}>
                Previous
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={onNext}
                disabled={currentIndex >= segments.length - 1}
              >
                Next
              </button>
            </div>
          </div>

          {activeSegment ? (
            <div className={`focus-card tone-${activeSegment.tone}`}>
              <IconGlyph value={activeSegment.icon} className="focus-card__icon" />
              <strong>{activeSegment.keyword}</strong>
              <p>{activeSegment.text}</p>
            </div>
          ) : null}
        </footer>
      </div>
    </div>
  )
}
