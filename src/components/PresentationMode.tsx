import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import type { LayoutMode, PresentationViewMode, Segment } from '../types'
import { useManagedFullscreen } from '../hooks/useManagedFullscreen'
import { ClockRay } from './ClockRay'
import { FullscreenToggleButton } from './FullscreenToggleButton'
import { GridView } from './GridView'
import { IconGlyph } from './IconGlyph'
import { LinearView } from './LinearView'

export type PresentationModeHandle = {
  enterFullscreen: () => Promise<boolean>
}

type PresentationModeProps = {
  isOpen: boolean
  topic: string
  layoutMode: LayoutMode
  segments: Segment[]
  activeSegmentId: string | null
  currentIndex: number
  mode: PresentationViewMode
  isCompact?: boolean
  onClose: () => void
  onSelectSegment: (segmentId: string) => void
  onNext: () => void
  onPrevious: () => void
}

export const PresentationMode = forwardRef<PresentationModeHandle, PresentationModeProps>(function PresentationMode({
  isOpen,
  topic,
  layoutMode,
  segments,
  activeSegmentId,
  currentIndex,
  mode,
  isCompact = false,
  onClose,
  onSelectSegment,
  onNext,
  onPrevious,
}, ref) {
  const isCompanion = mode === 'companion'
  const mapSurfaceRef = useRef<HTMLElement | null>(null)
  const {
    enterFullscreen,
    isFullscreen,
    isFullscreenSupported,
    toggleFullscreen,
  } = useManagedFullscreen({
    targetRef: mapSurfaceRef,
    enabled: isOpen,
  })

  useImperativeHandle(ref, () => ({
    enterFullscreen,
  }), [enterFullscreen])

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

      if (event.key === 'ArrowRight' || event.key === ' ' || event.key === 'PageDown') {
        event.preventDefault()
        onNext()
        return
      }

      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        onPrevious()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose, onNext, onPrevious])

  const content = useMemo(() => {
    if (isCompanion) {
      return (
        <ClockRay
          topic={topic}
          segments={segments}
          activeSegmentId={activeSegmentId}
          onSelectSegment={onSelectSegment}
          variant="companion"
          surfaceRef={mapSurfaceRef}
          isCompact
          isFullscreen={isFullscreen}
          isFullscreenSupported={isFullscreenSupported}
          onToggleFullscreen={() => void toggleFullscreen()}
        />
      )
    }

    if (layoutMode === 'grid') {
      return (
        <GridView
          topic={topic}
          segments={segments}
          activeSegmentId={activeSegmentId}
          onSelectSegment={onSelectSegment}
          surfaceRef={mapSurfaceRef}
          isCompact={isCompact}
          isFullscreen={isFullscreen}
          isFullscreenSupported={isFullscreenSupported}
          onToggleFullscreen={() => void toggleFullscreen()}
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
          surfaceRef={mapSurfaceRef}
          isCompact={isCompact}
          isFullscreen={isFullscreen}
          isFullscreenSupported={isFullscreenSupported}
          onToggleFullscreen={() => void toggleFullscreen()}
        />
      )
    }

    return (
      <ClockRay
        topic={topic}
        segments={segments}
        activeSegmentId={activeSegmentId}
        onSelectSegment={onSelectSegment}
        variant="default"
        surfaceRef={mapSurfaceRef}
        isCompact={isCompact}
        isFullscreen={isFullscreen}
        isFullscreenSupported={isFullscreenSupported}
        onToggleFullscreen={() => void toggleFullscreen()}
      />
    )
  }, [
    activeSegmentId,
    isCompact,
    isCompanion,
    isFullscreen,
    isFullscreenSupported,
    layoutMode,
    onSelectSegment,
    segments,
    toggleFullscreen,
    topic,
  ])

  if (!isOpen) {
    return null
  }

  const activeSegment = segments[currentIndex] ?? null
  const progress = segments.length > 0 ? ((currentIndex + 1) / segments.length) * 100 : 0

  return (
    <div
      className={`presentation-overlay ${isCompanion ? 'presentation-overlay--companion' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={isCompanion ? 'Companion Mode' : 'Presentation Mode'}
    >
      <div className={`presentation-shell glass-panel ${isCompanion ? 'presentation-shell--companion' : ''}`}>
        <header className="presentation-shell__head">
          <div>
            <p className="panel-kicker">{isCompanion ? 'Companion Mode' : 'Presentation Mode'}</p>
            <h2>{topic || 'Untitled Map'}</h2>
          </div>
          <div className="presentation-shell__actions">
            <span className="hotkey-pill">Left / Right / Page Up / Page Down / Space / Esc</span>
            <FullscreenToggleButton
              isFullscreen={isFullscreen}
              isSupported={isFullscreenSupported}
              onToggle={() => void toggleFullscreen()}
              className="presentation-shell__fullscreen"
            />
            <button type="button" className="ghost-button" onClick={onClose}>
              Exit
            </button>
          </div>
        </header>

        <div className="presentation-shell__body">{content}</div>

        <footer className="presentation-shell__foot">
          {!isCompanion ? (
            <div className="progress-track" aria-hidden="true">
              <span className="progress-track__fill" style={{ width: `${progress}%` }} />
            </div>
          ) : null}

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

          {!isCompanion && activeSegment ? (
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
})
