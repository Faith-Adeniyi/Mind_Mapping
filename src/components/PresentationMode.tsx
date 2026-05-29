import { forwardRef, useEffect, useRef } from 'react'
import type { PresentationViewMode, Segment } from '../types'
import { IconGlyph } from './IconGlyph'

export type PresentationModeHandle = {
  enterFullscreen: () => Promise<boolean>
}

type PresentationModeProps = {
  isOpen: boolean
  topic: string
  segments: Segment[]
  currentIndex: number
  mode: PresentationViewMode
  isCompact?: boolean
  onClose: () => void
  onNext: () => void
  onPrevious: () => void
}

export const PresentationMode = forwardRef<PresentationModeHandle, PresentationModeProps>(function PresentationMode({
  isOpen,
  topic,
  segments,
  currentIndex,
  mode,
  isCompact = false,
  onClose,
  onNext,
  onPrevious,
}: PresentationModeProps) {
  const onCloseRef = useRef(onClose)
  const onNextRef = useRef(onNext)
  const onPreviousRef = useRef(onPrevious)

  // Keep callback refs current without retriggering the listener effects below.
  // Parent passes inline callbacks, so depending on them directly would re-run
  // the fullscreen effect every render.
  useEffect(() => {
    onCloseRef.current = onClose
    onNextRef.current = onNext
    onPreviousRef.current = onPrevious
  })

  useEffect(() => {
    if (!isOpen) return undefined

    const el = document.documentElement
    el.requestFullscreen?.().catch(() => {})

    const onFsChange = () => {
      if (!document.fullscreenElement) onCloseRef.current()
    }
    document.addEventListener('fullscreenchange', onFsChange)

    return () => {
      document.removeEventListener('fullscreenchange', onFsChange)
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return undefined

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // In fullscreen, the browser handles Escape natively and fires
        // fullscreenchange, which calls onClose. Outside fullscreen
        // (e.g. requestFullscreen was rejected), close manually.
        if (!document.fullscreenElement) {
          onCloseRef.current()
        }
        return
      }
      if (event.key === 'ArrowRight' || event.key === ' ') {
        event.preventDefault()
        onNextRef.current()
        return
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onPreviousRef.current()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  if (!isOpen) return null

  const activeSegment = segments[currentIndex] ?? null
  const progress = segments.length > 0 ? ((currentIndex + 1) / segments.length) * 100 : 0
  const isCompanion = mode === 'companion'
  const overlayClassName = `presentation-overlay ${isCompanion ? 'presentation-overlay--companion' : ''} ${isCompact ? 'presentation-overlay--compact' : ''}`.trim()
  const shellClassName = `presentation-shell ${isCompanion ? 'presentation-shell--companion' : ''} ${isCompact ? 'presentation-shell--compact' : ''}`.trim()

  return (
    <div className={overlayClassName} role="dialog" aria-modal="true" aria-label="Presentation Mode">
      <div className={shellClassName}>
        <header className="presentation-shell__head">
          <div>
            <p className="panel-kicker">{isCompanion ? 'Companion Mode' : 'Presentation Mode'}</p>
            <h2>{topic || 'Untitled Map'}</h2>
          </div>
          <div className="presentation-shell__actions">
            <span className="hotkey-pill">← → Space · Esc exits</span>
            <button type="button" className="ghost-button" onClick={onClose}>
              Exit
            </button>
          </div>
        </header>

        <main className="presentation-main">
          {activeSegment ? (
            <div key={currentIndex} className={`presentation-slide tone-slide-${activeSegment.tone}`}>
              <div className="slide-meta">
                <span className="slide-index">{String(currentIndex + 1).padStart(2, '0')}</span>
                <span aria-hidden="true">—</span>
                <span>{segments.length} sections</span>
              </div>
              <IconGlyph value={activeSegment.icon} className="slide-icon" />
              <h1 className="slide-keyword">{activeSegment.keyword}</h1>
              <p className="slide-text">{activeSegment.text}</p>
            </div>
          ) : (
            <p className="empty-text">No segments to display.</p>
          )}
        </main>

        <footer className="presentation-shell__foot">
          <div className="progress-track" aria-hidden="true">
            <span className="progress-track__fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="presentation-shell__nav">
            <p className="meta-text">
              {segments.length > 0 ? `${currentIndex + 1} / ${segments.length}` : '0 / 0'}
            </p>
            <div className="presentation-shell__nav-buttons">
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
        </footer>
      </div>
    </div>
  )
})
