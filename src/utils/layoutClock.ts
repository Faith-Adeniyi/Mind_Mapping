export type ClockPosition = {
  id: number
  angle: number
  x: number
  y: number
}

function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360
}

export function getClockPositions(count: number, radius: number, centerX: number, centerY: number) {
  if (count <= 0) {
    return []
  }

  const angleStep = 360 / count
  const positionRadius = Math.max(0, radius)

  return Array.from({ length: count }, (_, index) => {
    const angle = index * angleStep - 90
    const radians = (angle * Math.PI) / 180
    const distanceScale = count > 6 ? 1 + Math.min(0.22, (count - 6) * 0.04) : 1
    const orbitRadius = positionRadius * distanceScale
    const stagger = count > 5 ? Math.sin((normalizeAngle(angle) * Math.PI) / 180) * Math.min(22, positionRadius * 0.08) : 0

    return {
      id: index,
      angle,
      x: centerX + Math.cos(radians) * orbitRadius,
      y: centerY + Math.sin(radians) * orbitRadius + stagger,
    }
  })
}

export function getResponsiveRadius(width: number) {
  if (width <= 640) {
    return 132
  }

  if (width <= 960) {
    return 172
  }

  if (width <= 1280) {
    return 220
  }

  return 262
}