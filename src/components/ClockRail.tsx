import type { CSSProperties } from 'react'
import type { Segment } from '../types'
import { getClockPositions, getResponsiveRadius } from '../utils/layoutClock'
import { SegmentCard } from './SegmentCard'

type ClockRailProps = {
  title: string
  subtitle: string
  segments: Segment[]
  activeIndex: number
  onSegmentSelect: (index: number) => void
  onSegmentRemove: (index: number) => void
  onAddSegment: () => void
  onToggleFullscreen: () => void
  onExitFullscreen: () => void
  isFullscreen: boolean
  showRemoveControl: boolean
  width: number
}

export function ClockRail({
  title,
  subtitle,
  segments,
  activeIndex,
  onSegmentSelect,
  onSegmentRemove,
  onAddSegment,
  onToggleFullscreen,
  onExitFullscreen,
  isFullscreen,
  showRemoveControl,
  width,
}: ClockRailProps) {
  const radius = getResponsiveRadius(width)
  const centerX = width / 2
  const centerY = width / 2
  const clockPositions = getClockPositions(segments.length, radius, centerX, centerY)
  const segmentSize = Math.max(116, Math.min(182, width / 5.3))

  return (
    <section className="clock-rail">
      <div className="clock-rail__header">
        <p className="clock-rail__eyebrow">ClockRail map</p>
        <h2>{title || 'Main Topic'}</h2>
        <p>{subtitle || 'A visual memory map for presentation and recall.'}</p>
      </div>

      <div
        className={`clock-stage ${isFullscreen ? 'clock-stage--fullscreen' : ''}`}
        style={{ width, height: width, '--clock-radius': `${radius}px` } as CSSProperties}
      >
        <div className="clock-stage__toolbar">
          <button type="button" className="ghost-btn" onClick={onAddSegment}>
            + Add card
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={isFullscreen ? onExitFullscreen : onToggleFullscreen}
          >
            {isFullscreen ? 'Exit full screen' : 'Full screen'}
          </button>
        </div>

        <div className="clock-ring" />
        <div className="clock-core">
          <span className="clock-core__icon">🕐</span>
          <strong>{title || 'Main Topic'}</strong>
          <small>{subtitle || 'Visual cue rail'}</small>
        </div>

        {clockPositions.map((position, index) => {
          const segment = segments[index]

          if (!segment) {
            return null
          }

          return (
            <SegmentCard
              key={segment.id}
              segment={segment}
              index={index}
              isActive={index === activeIndex}
              x={position.x}
              y={position.y}
              size={segmentSize}
              showRemoveControl={showRemoveControl}
              onClick={() => onSegmentSelect(index)}
              onRemove={() => onSegmentRemove(index)}
            />
          )
        })}
      </div>
    </section>
  )
}
