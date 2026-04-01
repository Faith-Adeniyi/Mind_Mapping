import type { Segment } from '../types'

export type ClockNodePosition = {
  id: string
  angle: number
  x: number
  y: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

export function computeClockLayout(segments: Segment[], width: number, height: number): ClockNodePosition[] {
  if (segments.length === 0) {
    return []
  }

  const segmentCount = segments.length
  const safeWidth = Math.max(320, width)
  const safeHeight = Math.max(320, height)
  const centerX = safeWidth / 2
  const centerY = safeHeight / 2
  const minDimension = Math.min(safeWidth, safeHeight)

  const isDense = segmentCount >= 10
  const isMediumDense = segmentCount >= 8 && segmentCount <= 9
  const densityLift = isDense ? 0.1 + (segmentCount - 10) * 0.03 : isMediumDense ? 0.04 : 0

  const estimatedNodeDiameter = isDense
    ? clamp(minDimension * 0.16, 108, 132)
    : clamp(minDimension * 0.2, 132, 162)
  const maxSafeRadius = Math.max(120, minDimension / 2 - estimatedNodeDiameter / 2 - 10)
  const targetRadius = minDimension * (0.36 + densityLift)
  const radius = clamp(targetRadius, 130, maxSafeRadius)

  const step = (Math.PI * 2) / segmentCount

  return segments.map((segment, index) => {
    const angle = -Math.PI / 2 + index * step
    return {
      id: segment.id,
      angle,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    }
  })
}
