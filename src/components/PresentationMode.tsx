import { Icon } from '@iconify/react'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { PresentationViewMode, Segment } from '../types'
import { IconGlyph } from './IconGlyph'

/**
 * Minimal percent-positioned clock used only inside Present mode.
 * Both the hub and the nodes resolve against the same parent box via %,
 * so the hub is mathematically centered on the orbit (no JS measurement
 * involved, no view-surface wrapper chain to drift the layout).
 */
function PresentClock({ segments, activeId }: { segments: Segment[]; activeId: string | null }) {
  const orbitPct = 38
  const nodePct = 17
  const hubPct = 22
  const activeIdx = Math.max(0, segments.findIndex((s) => s.id === activeId))
  const handAngle = (activeIdx / Math.max(segments.length, 1)) * 360 - 90

  return (
    <div className="pclock">
      <span className="pclock__ring" aria-hidden="true" />
      <span className="pclock__face" aria-hidden="true" />

      {Array.from({ length: 12 }).map((_, i) => {
        const hour = i + 1
        const a = (hour / 12) * Math.PI * 2 - Math.PI / 2
        const r = orbitPct - nodePct / 2 - 6
        const x = 50 + Math.cos(a) * r
        const y = 50 + Math.sin(a) * r
        return (
          <span
            key={`num-${hour}`}
            className="pclock__num"
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-hidden="true"
          >
            {hour}
          </span>
        )
      })}

      {/* hub: centered with translate-50/-50 so 50%/50% is its midpoint */}
      <div className="pclock__hub" style={{ width: `${hubPct}%`, height: `${hubPct}%` }} aria-hidden="true" />

      {/* hand */}
      <span
        className="pclock__hand"
        style={{ width: `${orbitPct}%`, transform: `translateY(-50%) rotate(${handAngle}deg)` }}
        aria-hidden="true"
      />

      {/* nodes */}
      {segments.map((s, i) => {
        const a = (i / segments.length) * Math.PI * 2
        const x = 50 + Math.sin(a) * orbitPct
        const y = 50 - Math.cos(a) * orbitPct
        const isActive = s.id === activeId
        return (
          <div
            key={s.id}
            className={`pclock__node ${isActive ? 'on' : ''}`}
            style={{ left: `${x}%`, top: `${y}%`, width: `${nodePct}%`, height: `${nodePct}%` }}
          >
            <span className="pclock__node-idx">{String(i + 1).padStart(2, '0')}</span>
            <IconGlyph value={s.icon} className="pclock__node-icon" />
            <span className="pclock__node-kw">{s.keyword}</span>
          </div>
        )
      })}
    </div>
  )
}

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

export const PresentationMode = forwardRef<PresentationModeHandle, PresentationModeProps>(function PresentationMode(
  {
    isOpen,
    topic,
    segments,
    currentIndex,
    mode,
    onClose,
    onNext,
    onPrevious,
  }: PresentationModeProps,
  ref,
) {
  const onCloseRef = useRef(onClose)
  const onNextRef = useRef(onNext)
  const onPreviousRef = useRef(onPrevious)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    onCloseRef.current = onClose
    onNextRef.current = onNext
    onPreviousRef.current = onPrevious
  })

  useImperativeHandle(
    ref,
    () => ({
      enterFullscreen: async () => {
        try {
          await document.documentElement.requestFullscreen?.()
          return true
        } catch {
          return false
        }
      },
    }),
    [],
  )

  useEffect(() => {
    if (!isOpen) return undefined
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
        if (!document.fullscreenElement) onCloseRef.current()
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
  const isCompanion = mode === 'companion'
  const activeId = activeSegment?.id ?? null

  return (
    <div className="present" role="dialog" aria-modal="true" aria-label="Presentation mode" ref={containerRef}>
      <div className="present__bg" />

      <div className="present__top">
        <span className="present__topic">
          {isCompanion ? 'Companion · ' : ''}
          {topic || 'Untitled Map'}
        </span>
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          <Icon icon="tabler:x" width={16} height={16} />
          Exit
        </button>
      </div>

      <div className="present__stage">
        <div className="present__left">
          <span className="present__idx">
            {String(currentIndex + 1).padStart(2, '0')} / {String(segments.length).padStart(2, '0')}
          </span>
          {activeSegment ? (
            <>
              <h2 className="present__kw">
                <IconGlyph value={activeSegment.icon} />
                {activeSegment.keyword}
              </h2>
              <p className="present__text">{activeSegment.text}</p>
            </>
          ) : (
            <p className="meta-text">No segments to display.</p>
          )}
        </div>

        <div className="present__clock">
          <div className="present__clock-frame">
            {segments.length > 0 ? <PresentClock segments={segments} activeId={activeId} /> : null}
          </div>
        </div>
      </div>

      <div className="present__bottom">
        <button
          type="button"
          className="btn btn--icon btn--ghost"
          disabled={currentIndex <= 0}
          onClick={onPrevious}
          aria-label="Previous"
        >
          <Icon icon="tabler:chevron-left" width={18} height={18} />
        </button>
        <div className="present__progress" role="tablist">
          {segments.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === currentIndex}
              aria-label={`Go to anchor ${i + 1}`}
              className={i === currentIndex ? 'on' : ''}
              onClick={() => {
                if (i > currentIndex) {
                  for (let n = currentIndex; n < i; n++) onNextRef.current()
                } else if (i < currentIndex) {
                  for (let n = currentIndex; n > i; n--) onPreviousRef.current()
                }
              }}
            />
          ))}
        </div>
        <button
          type="button"
          className="btn btn--icon btn--ghost"
          disabled={currentIndex >= segments.length - 1}
          onClick={onNext}
          aria-label="Next"
        >
          <Icon icon="tabler:chevron-right" width={18} height={18} />
        </button>
      </div>
    </div>
  )
})
