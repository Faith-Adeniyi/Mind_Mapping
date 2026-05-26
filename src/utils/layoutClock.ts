import type { Segment } from '../types'

export type ClockNodePosition = {
  id: string
  angle: number
  x: number
  y: number
}

export type ClockLayoutOptions = {
  estimatedNodeDiameter?: number
  edgePadding?: number
  verticalBias?: number
}

export type ClockLayoutMetrics = {
  centerX: number
  centerY: number
  minDimension: number
  maxSafeRadius: number
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

export function computeClockLayout(
  segments: Segment[],
  width: number,
  height: number,
  options: ClockLayoutOptions = {},
): ClockNodePosition[] {
  if (segments.length === 0) {
    return []
  }

  const segmentCount = segments.length
  const { centerX, centerY, minDimension, maxSafeRadius } = getClockLayoutMetrics(width, height, options)

  const isDense = segmentCount >= 10
  const isMediumDense = segmentCount >= 8 && segmentCount <= 9
  const densityLift = isDense ? 0.08 + (segmentCount - 10) * 0.02 : isMediumDense ? 0.03 : 0
  const targetRadius = minDimension * (0.31 + densityLift)
  const minRadius = Math.min(maxSafeRadius, Math.max(56, minDimension * 0.2))
  const radius = clamp(targetRadius, minRadius, maxSafeRadius)

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

export function getClockLayoutMetrics(
  width: number,
  height: number,
  options: ClockLayoutOptions = {},
): ClockLayoutMetrics {
  const safeWidth = Math.max(320, width)
  const safeHeight = Math.max(320, height)
  const centerX = safeWidth / 2
  const verticalBias = options.verticalBias ?? 0.04
  const centerY = safeHeight / 2 + safeHeight * verticalBias
  const minDimension = Math.min(safeWidth, safeHeight)
  const estimatedNodeDiameter = options.estimatedNodeDiameter ?? clamp(minDimension * 0.19, 84, 136)
  const edgePadding = options.edgePadding ?? clamp(minDimension * 0.05, 12, 30)
  const maxRadiusX = Math.max(56, safeWidth / 2 - estimatedNodeDiameter / 2 - edgePadding)
  const maxRadiusTop = Math.max(56, centerY - estimatedNodeDiameter / 2 - edgePadding - safeHeight * 0.1)
  const maxRadiusBottom = Math.max(56, safeHeight - centerY - estimatedNodeDiameter / 2 - edgePadding)
  const maxSafeRadius = Math.max(56, Math.min(maxRadiusX, maxRadiusTop, maxRadiusBottom))

  return {
    centerX,
    centerY,
    minDimension,
    maxSafeRadius,
  }
}
