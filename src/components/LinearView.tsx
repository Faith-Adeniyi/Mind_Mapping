import type { Segment } from '../types'
import { IconGlyph } from './IconGlyph'

type LinearViewProps = {
  topic: string
  segments: Segment[]
  activeSegmentId: string | null
  onSelectSegment: (segmentId: string) => void
}

export function LinearView({ topic, segments, activeSegmentId, onSelectSegment }: LinearViewProps) {
  return (
    <section className="view-surface glass-panel">
      <div className="view-head">
        <div>
          <p className="panel-kicker">Linear View</p>
          <h2>{topic || 'Untitled Map'}</h2>
        </div>
        <p className="meta-text">Narrative timeline from opening to close.</p>
      </div>

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
    </section>
  )
}
