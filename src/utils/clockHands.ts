const CLOCK_HOURS = 12
const DEGREES_PER_HOUR = 360 / CLOCK_HOURS

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max))
}

function normalizeSegmentCount(segmentCount: number) {
  if (!Number.isFinite(segmentCount) || segmentCount <= 0) {
    return 1
  }

  return Math.max(1, Math.round(segmentCount))
}

function normalizeIndex(index: number, segmentCount: number) {
  const safeCount = normalizeSegmentCount(segmentCount)
  if (!Number.isFinite(index)) {
    return 0
  }

  return clamp(Math.round(index), 0, safeCount - 1)
}

export function getClockHourSlotForIndex(index: number, segmentCount: number) {
  const safeCount = normalizeSegmentCount(segmentCount)
  const safeIndex = normalizeIndex(index, safeCount)
  const zeroBasedHour = Math.round((safeIndex * CLOCK_HOURS) / safeCount) % CLOCK_HOURS

  return zeroBasedHour === 0 ? CLOCK_HOURS : zeroBasedHour
}

export function getClockDegreesForHourSlot(hourSlot: number) {
  const normalized = ((Math.round(hourSlot) % CLOCK_HOURS) + CLOCK_HOURS) % CLOCK_HOURS
  return normalized * DEGREES_PER_HOUR
}

export type ClockHandAngles = {
  minuteDegrees: number
  hourDegrees: number
  hourSlot: number
  hourBucket: number
}

export function getClockHandAngles(activeIndex: number, segmentCount: number): ClockHandAngles {
  const safeCount = normalizeSegmentCount(segmentCount)
  const safeIndex = normalizeIndex(activeIndex, safeCount)
  const hourSlot = getClockHourSlotForIndex(safeIndex, safeCount)
  const minuteDegrees = getClockDegreesForHourSlot(hourSlot)
  const progress = safeCount === 1 ? 0 : safeIndex / (safeCount - 1)
  const hourBucket = clamp(Math.round(progress * (CLOCK_HOURS - 1)), 0, CLOCK_HOURS - 1)
  const hourDegrees = hourBucket * DEGREES_PER_HOUR

  return {
    minuteDegrees,
    hourDegrees,
    hourSlot,
    hourBucket,
  }
}
