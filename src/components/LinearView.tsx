import type { Ref } from 'react'
import type { Segment } from '../types'
import { IconGlyph } from './IconGlyph'
import { MapFrame } from './MapFrame'

type LinearViewProps = {
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

export function LinearView({
  topic,
  segments,
  activeSegmentId,
  onSelectSegment,
  surfaceRef,
  isCompact,
  isFullscreen,
  isFullscreenSupported,
  onToggleFullscreen,
}: LinearViewProps) {
  return (
    <MapFrame
      surfaceRef={surfaceRef}
      kicker="Linear View"
      title={topic || 'Untitled Map'}
      description="Narrative timeline from opening to close."
      isCompact={isCompact}
      isFullscreen={isFullscreen}
      isFullscreenSupported={isFullscreenSupported}
      onToggleFullscreen={onToggleFullscreen}
      bodyClassName="view-body--linear"
    >
      <div className="linear-map" role="list" aria-label="Linear segment timeline">
        <span className="linear-axis" aria-hidden="true" />
        {segments.map((segment, index) => {
          const isActive = segment.id === activeSegmentId
          const isRight = index % 2 === 1

          return (
            <article
              key={segment.id}
              className={`linear-step ${isRight ? 'is-right' : ''} ${isActive ? 'is-active' : ''}`}
            >
              <button
                type="button"
                className="linear-marker"
                onClick={() => onSelectSegment(segment.id)}
                aria-current={isActive}
              >
                {String(segment.order).padStart(2, '0')}
              </button>

              <button
                type="button"
                className={`linear-card tone-${segment.tone}`}
                onClick={() => onSelectSegment(segment.id)}
                aria-current={isActive}
              >
                <IconGlyph value={segment.icon} className="linear-card__icon" />
                <strong>{segment.keyword}</strong>
                <p>{segment.preview}</p>
              </button>
            </article>
          )
        })}
      </div>
    </MapFrame>
  )
}
