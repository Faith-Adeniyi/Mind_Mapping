import type { Segment } from '../types'

type SegmentCardProps = {
  segment: Segment
  index: number
  isActive: boolean
  x: number
  y: number
  size: number
  showRemoveControl: boolean
  onClick: () => void
  onRemove: () => void
}

const toneClassMap: Record<string, string> = {
  indigo: 'tone-indigo',
  pink: 'tone-pink',
  amber: 'tone-amber',
  emerald: 'tone-emerald',
  cyan: 'tone-cyan',
}

export function SegmentCard({
  segment,
  index,
  isActive,
  x,
  y,
  size,
  showRemoveControl,
  onClick,
  onRemove,
}: SegmentCardProps) {
  const toneClass = toneClassMap[segment.tone] ?? 'tone-indigo'

  return (
    <button
      type="button"
      className={`segment-card ${toneClass} ${isActive ? 'active' : ''}`}
      onClick={onClick}
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${size}px`,
        minHeight: `${Math.max(124, size * 0.88)}px`,
        transform: 'translate(-50%, -50%)',
      }}
      aria-label={`Select segment ${index + 1}: ${segment.keyword}`}
    >
      <span className="segment-index">{index + 1}</span>
      {showRemoveControl ? (
        <button
          type="button"
          className="segment-remove"
          onClick={(event) => {
            event.stopPropagation()
            onRemove()
          }}
          aria-label={`Remove segment ${index + 1}`}
          title="Remove segment"
        >
          ×
        </button>
      ) : null}
      <span className="segment-icon">{segment.icon}</span>
      <span className="segment-title">{segment.keyword}</span>
      <span className="segment-preview">{segment.preview}</span>
    </button>
  )
}
