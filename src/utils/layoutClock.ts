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
  const densityLift = isDense ? 0.06 + (segmentCount - 10) * 0.015 : isMediumDense ? 0.02 : 0
  const targetRadius = minDimension * (0.38 + densityLift)
  const minRadius = Math.min(maxSafeRadius, Math.max(56, minDimension * 0.25))
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
  const verticalBias = options.verticalBias ?? 0
  const centerY = safeHeight / 2 + safeHeight * verticalBias
  const minDimension = Math.min(safeWidth, safeHeight)
  const estimatedNodeDiameter = options.estimatedNodeDiameter ?? clamp(minDimension * 0.19, 84, 136)
  const edgePadding = options.edgePadding ?? clamp(minDimension * 0.05, 12, 30)
  // Titles can wrap and push rendered content slightly taller than the circle diameter.
  // Pad the vertical envelope so top/bottom nodes don't clip the stage.
  const verticalNodeEnvelope = estimatedNodeDiameter * 1.18
  const maxRadiusX = Math.max(56, safeWidth / 2 - estimatedNodeDiameter / 2 - edgePadding)
  const maxRadiusTop = Math.max(56, centerY - verticalNodeEnvelope / 2 - edgePadding)
  const maxRadiusBottom = Math.max(56, safeHeight - centerY - verticalNodeEnvelope / 2 - edgePadding)
  const maxSafeRadius = Math.max(56, Math.min(maxRadiusX, maxRadiusTop, maxRadiusBottom))

  return {
    centerX,
    centerY,
    minDimension,
    maxSafeRadius,
  }
}
