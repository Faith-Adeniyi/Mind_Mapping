import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type Ref } from 'react'
import type { Segment } from '../types'
import { getClockHandAngles, getClockHourSlotForIndex } from '../utils/clockHands'
import { computeClockLayout, getClockLayoutMetrics } from '../utils/layoutClock'
import { IconGlyph } from './IconGlyph'
import { MapFrame } from './MapFrame'

type ClockRayProps = {
  topic: string
  segments: Segment[]
  activeSegmentId: string | null
  onSelectSegment: (segmentId: string) => void
  variant?: 'default' | 'companion'
  surfaceRef?: Ref<HTMLElement>
  isCompact?: boolean
  isFullscreen?: boolean
  isFullscreenSupported?: boolean
  onToggleFullscreen?: () => void
}

type StageSize = {
  width: number
  height: number
}

type TitleScaleClass = 'title-scale-short' | 'title-scale-medium' | 'title-scale-long' | 'title-scale-xlong'

const CLOCK_NUMERALS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

function getClockHourLabel(positionIndex: number, totalNodes: number) {
  if (totalNodes <= 0) return ''
  // Only use real clock-hour labels when the nodes land exactly on hour marks.
  // For 12 nodes every node sits precisely on an hour; for other counts nodes
  // fall between marks, so sequential position numbers are clearer.
  if (totalNodes === 12) {
    const hour = positionIndex === 0 ? 12 : positionIndex
    return String(hour)
  }
  return String(positionIndex + 1)
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

function getNumeralPosition(hour: number, center: { x: number; y: number }, radius: number) {
  const step = (Math.PI * 2) / 12
  const angle = -Math.PI / 2 + (hour % 12) * step

  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  }
}

export function ClockRay({
  topic,
  segments,
  activeSegmentId,
  onSelectSegment,
  variant = 'default',
  surfaceRef,
  isCompact = false,
  isFullscreen,
  isFullscreenSupported,
  onToggleFullscreen,
}: ClockRayProps) {
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [stageSize, setStageSize] = useState<StageSize>({ width: 960, height: 680 })

  const measureStage = useCallback(() => {
    if (!stageRef.current) {
      return
    }

    const rect = stageRef.current.getBoundingClientRect()
    const width = Math.max(1, rect.width)
    const height = Math.max(1, rect.height)

    setStageSize((current) => {
      if (Math.abs(current.width - width) < 0.5 && Math.abs(current.height - height) < 0.5) {
        return current
      }

      return { width, height }
    })
  }, [])

  useEffect(() => {
    if (!stageRef.current) {
      return undefined
    }

    measureStage()

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) {
        return
      }

      const contentWidth = Math.max(1, entry.contentRect.width)
      const contentHeight = Math.max(1, entry.contentRect.height)

      setStageSize((current) => {
        if (Math.abs(current.width - contentWidth) < 0.5 && Math.abs(current.height - contentHeight) < 0.5) {
          return current
        }

        return {
          width: contentWidth,
          height: contentHeight,
        }
      })
    })

    observer.observe(stageRef.current)

    return () => observer.disconnect()
  }, [measureStage])

  const activeIndex = Math.max(0, segments.findIndex((segment) => segment.id === activeSegmentId))
  const handAngles = getClockHandAngles(activeIndex, segments.length)
  const minDimension = Math.min(stageSize.width, stageSize.height)
  const isDense = segments.length >= 10
  const isSmallStage = stageSize.width <= 640
  const isMediumStage = stageSize.width <= 980

  const getTierValue = (small: number, medium: number, desktop: number) => {
    if (isSmallStage) {
      return small
    }

    if (isMediumStage) {
      return medium
    }

    return desktop
  }

  const denseNodeMin = getTierValue(62, 70, 82)
  const regularNodeMin = getTierValue(68, 78, 92)
  const denseHubMin = getTierValue(48, 54, 60)
  const regularHubMin = getTierValue(54, 60, 70)
  const nodeDiameter = isDense
    ? clamp(minDimension * 0.18, denseNodeMin, isSmallStage ? 88 : 104)
    : clamp(minDimension * 0.2, regularNodeMin, isSmallStage ? 96 : 118)
  const hubDiameter = isDense
    ? clamp(minDimension * 0.16, denseHubMin, isSmallStage ? 72 : 86)
    : clamp(minDimension * 0.17, regularHubMin, isSmallStage ? 78 : 94)
  const clockEdgePadding = getTierValue(12, 18, 28)
  const layoutMetrics = useMemo(
    () =>
      getClockLayoutMetrics(stageSize.width, stageSize.height, {
        estimatedNodeDiameter: nodeDiameter,
        edgePadding: clockEdgePadding,
        verticalBias: isSmallStage ? 0.075 : 0.045,
      }),
    [clockEdgePadding, isSmallStage, nodeDiameter, stageSize.height, stageSize.width],
  )
  const center = {
    x: layoutMetrics.centerX,
    y: layoutMetrics.centerY,
  }
  const positions = useMemo(
    () =>
      computeClockLayout(segments, stageSize.width, stageSize.height, {
        estimatedNodeDiameter: nodeDiameter,
        edgePadding: clockEdgePadding,
        verticalBias: isSmallStage ? 0.075 : 0.045,
      }),
    [clockEdgePadding, isSmallStage, nodeDiameter, segments, stageSize.height, stageSize.width],
  )
  const nodeRadius = nodeDiameter / 2
  const hubRadius = hubDiameter / 2
  const orbitRadius = positions.length > 0
    ? Math.hypot(positions[0].x - center.x, positions[0].y - center.y)
    : layoutMetrics.maxSafeRadius
  const numeralInset = getTierValue(26, 34, 42)
  const numeralRadius = clampToRange(
    orbitRadius - nodeRadius - numeralInset,
    getTierValue(72, 86, 100),
    orbitRadius - 18,
  )

  return (
    <MapFrame
      surfaceRef={surfaceRef}
      kicker={variant === 'companion' ? 'Clock Companion View' : 'Clock View'}
      title={isCompact ? 'Clock Memory Map' : 'ClockRay Memory Map'}
      description=""
      isCompact={isCompact}
      isFullscreen={isFullscreen}
      isFullscreenSupported={isFullscreenSupported}
      onToggleFullscreen={onToggleFullscreen}
      className={variant === 'companion' ? 'view-surface--companion' : undefined}
      bodyClassName="view-body--clock"
    >
      <div
        ref={stageRef}
        className={`clock-stage ${isDense ? 'clock-stage--dense' : ''} ${variant === 'companion' ? 'clock-stage--companion' : ''} ${isCompact ? 'clock-stage--compact' : ''}`}
        role="list"
        aria-label="Allison's Memory ClockRay segment map"
        style={
          {
            '--clock-node-size': `${nodeDiameter}px`,
            '--clock-hub-size': `${hubDiameter}px`,
          } as CSSProperties
        }
      >
        <div className="clock-topic-banner">
          <span>{topic || 'Untitled Map'}</span>
        </div>

        <div className="clock-face-layer" aria-hidden="true"> 
          <span className="clock-face-ring clock-face-ring--mid" />
          <span className="clock-face-ring clock-face-ring--inner" />
        </div>

        <div className="clock-numeral-layer" aria-hidden="true">
          {CLOCK_NUMERALS.map((hour) => {
            const coords = getNumeralPosition(hour, center, numeralRadius)
            return (
              <span
                key={`hour-${hour}`}
                className="clock-hour-mark"
                style={{
                  left: `${coords.x}px`,
                  top: `${coords.y}px`,
                }}
              >
                {hour}
              </span>
            )
          })}
        </div>

        <div className="clock-connector-layer" aria-hidden="true">
          {positions.map((position) => {
            const dx = position.x - center.x
            const dy = position.y - center.y
            const connectorDistance = Math.max(0, Math.hypot(dx, dy) - nodeRadius - hubRadius - 4)
            const angle = (Math.atan2(dy, dx) * 180) / Math.PI
            const isActive = position.id === activeSegmentId

            return (
              <span
                key={`line-${position.id}`}
                className={`clock-connector ${isActive ? 'is-active' : ''}`}
                style={{
                  left: `${center.x}px`,
                  top: `${center.y}px`,
                  width: `${connectorDistance}px`,
                  transform: `translate(${Math.cos((angle * Math.PI) / 180) * (hubRadius + 2)}px, ${Math.sin((angle * Math.PI) / 180) * (hubRadius + 2)}px) rotate(${angle}deg)`,
                }}
              />
            )
          })}
        </div>

        <div className={`clock-hands-layer ${variant === 'companion' ? 'clock-hands-layer--companion' : ''}`} aria-hidden="true">
          <span
            className="clock-hand clock-hand--hour"
            style={{ '--clock-hand-angle': `${handAngles.hourDegrees}deg` } as CSSProperties}
          />
          <span
            className="clock-hand clock-hand--minute"
            style={{ '--clock-hand-angle': `${handAngles.minuteDegrees}deg` } as CSSProperties}
          />
        </div>

        <div className="clock-hub" aria-hidden="true">
          
        </div>
        <span className="clock-pivot" aria-hidden="true" />

        <div className="clock-node-layer">
          {positions.map((position, positionIndex) => {
            const segment = segments[positionIndex]
            if (!segment) {
              return null
            }

            const isActive = segment.id === activeSegmentId
            const hourSlot = getClockHourSlotForIndex(positionIndex, positions.length)
            const titleScaleClass = getTitleScaleClass(segment.keyword)

            return (
              <button
                key={segment.id}
                type="button"
                className={`clock-node tone-${segment.tone} ${isActive ? 'is-active' : ''}`}
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
                onClick={() => onSelectSegment(segment.id)}
                aria-current={isActive}
                aria-label={`Clock node ${hourSlot}: ${segment.keyword}`}
              >
                <span className="clock-node__index">{hourSlot}</span>
                <IconGlyph value={segment.icon} className="clock-node__icon" />
                <strong className={`clock-node__title ${titleScaleClass}`}>{segment.keyword}</strong>
              </button>
            )
          })}
        </div>
      </div>
    </MapFrame>
  )
}
