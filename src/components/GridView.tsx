import type { Ref } from 'react'
import type { Segment } from '../types'
import { IconGlyph } from './IconGlyph'
import { MapFrame } from './MapFrame'

type GridViewProps = {
  topic: string
  segments: Segment[]
  activeSegmentId: string | null
  onSelectSegment: (segmentId: string) => void
  surfaceRef?: Ref<HTMLElement>
  isCompact?: boolean
  isFullscreen?: boolean
  isFullscreenSupported?: boolean
  onToggleFullscreen?: () => void
}

export function GridView({
  topic,
  segments,
  activeSegmentId,
  onSelectSegment,
  surfaceRef,
  isCompact,
  isFullscreen,
  isFullscreenSupported,
  onToggleFullscreen,
}: GridViewProps) {
  return (
    <MapFrame
      surfaceRef={surfaceRef}
      kicker="Grid View"
      title={topic || 'Untitled Map'}
      description="Scan all memory anchors at once."
      isCompact={isCompact}
      isFullscreen={isFullscreen}
      isFullscreenSupported={isFullscreenSupported}
      onToggleFullscreen={onToggleFullscreen}
      bodyClassName="view-body--grid"
    >
      <div className="grid-map" role="list" aria-label="Grid segment map">
        {segments.map((segment) => {
          const isActive = segment.id === activeSegmentId
          return (
            <button
              key={segment.id}
              type="button"
              className={`grid-node tone-${segment.tone} ${isActive ? 'is-active' : ''}`}
              onClick={() => onSelectSegment(segment.id)}
              aria-current={isActive}
            >
              <span className="grid-node__index">{String(segment.order).padStart(2, '0')}</span>
              <IconGlyph value={segment.icon} className="grid-node__icon" />
              <strong className="grid-node__title">{segment.keyword}</strong>
              <span className="grid-node__preview">{segment.preview}</span>
            </button>
          )
        })}
      </div>
    </MapFrame>
  )
}
