import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { Segment } from '../types'
import { computeClockLayout } from '../utils/layoutClock'
import { IconGlyph } from './IconGlyph'

type ClockRailProps = {
  topic: string
  segments: Segment[]
  activeSegmentId: string | null
  onSelectSegment: (segmentId: string) => void
}

type StageSize = {
  width: number
  height: number
}

type TitleScaleClass = 'title-scale-short' | 'title-scale-medium' | 'title-scale-long' | 'title-scale-xlong'

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

function getClockHourLabel(positionIndex: number, totalNodes: number) {
  if (totalNodes <= 0) {
    return ''
  }

  const sampledHour = Math.round((positionIndex * 12) / totalNodes) % 12
  return String(sampledHour === 0 ? 12 : sampledHour)
}

function getTitleScaleClass(title: string): TitleScaleClass {
  const length = title.trim().length

  if (length <= 14) {
    return 'title-scale-short'
  }

  if (length <= 22) {
    return 'title-scale-medium'
  }

  if (length <= 30) {
    return 'title-scale-long'
  }

  return 'title-scale-xlong'
}

export function ClockRail({ topic, segments, activeSegmentId, onSelectSegment }: ClockRailProps) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [stageSize, setStageSize] = useState<StageSize>({ width: 960, height: 680 })

  useEffect(() => {
    if (!stageRef.current) {
      return undefined
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) {
        return
      }

      setStageSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })

    observer.observe(stageRef.current)

    return () => observer.disconnect()
  }, [])

  const positions = useMemo(
    () => computeClockLayout(segments, stageSize.width, stageSize.height),
    [segments, stageSize.height, stageSize.width],
  )

  const center = {
    x: stageSize.width / 2,
    y: stageSize.height / 2,
  }

  const isDense = segments.length >= 10
  const nodeDiameter = isDense
    ? clamp(stageSize.width * 0.14, 108, 132)
    : clamp(stageSize.width * 0.16, 132, 162)
  const hubDiameter = isDense
    ? clamp(stageSize.width * 0.24, 176, 220)
    : clamp(stageSize.width * 0.28, 200, 270)
  const nodeRadius = nodeDiameter / 2

  return (
    <section className="view-surface glass-panel">
      <div className="view-head">
        <div>
          <p className="panel-kicker">Clock View</p>
          <h2>{topic || 'Untitled Map'}</h2>
        </div>
        <p className="meta-text">Follow the clockwise orbit for presentation recall.</p>
      </div>

      <div
        ref={stageRef}
        className={`clock-stage ${isDense ? 'clock-stage--dense' : ''}`}
        role="list"
        aria-label="Allison Mind Mapping segment map"
        style={
          {
            '--clock-node-size': `${nodeDiameter}px`,
            '--clock-hub-size': `${hubDiameter}px`,
          } as CSSProperties
        }
      >
        {positions.map((position) => {
          const dx = position.x - center.x
          const dy = position.y - center.y
          const distance = Math.max(0, Math.hypot(dx, dy) - nodeRadius - 6)
          const angle = (Math.atan2(dy, dx) * 180) / Math.PI
          const isActive = position.id === activeSegmentId

          return (
            <span
              key={`line-${position.id}`}
              className={`clock-connector ${isActive ? 'is-active' : ''}`}
              style={{
                left: `${center.x}px`,
                top: `${center.y}px`,
                width: `${distance}px`,
                transform: `rotate(${angle}deg)`,
              }}
            />
          )
        })}

        <div className="clock-hub">
          <p>Main Topic</p>
          <strong>{topic || 'Untitled Map'}</strong>
          <span>{segments.length > 0 ? `${segments.length} nodes` : 'No nodes yet'}</span>
        </div>

        {positions.map((position, positionIndex) => {
          const segment = segments.find((item) => item.id === position.id)
          if (!segment) {
            return null
          }

          const isActive = segment.id === activeSegmentId
          const clockHourLabel = getClockHourLabel(positionIndex, positions.length)
          const titleScaleClass = getTitleScaleClass(segment.keyword)

          return (
            <button
              key={segment.id}
              type="button"
              className={`clock-node tone-${segment.tone} ${isActive ? 'is-active' : ''}`}
              style={{ left: `${position.x}px`, top: `${position.y}px` }}
              onClick={() => onSelectSegment(segment.id)}
              aria-current={isActive}
            >
              <span className="clock-node__index">{clockHourLabel}</span>
              <IconGlyph value={segment.icon} className="clock-node__icon" />
              <strong className={`clock-node__title ${titleScaleClass}`}>{segment.keyword}</strong>
            </button>
          )
        })}
      </div>
    </section>
  )
}
