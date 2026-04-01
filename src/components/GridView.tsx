import type { Segment } from '../types'
import { IconGlyph } from './IconGlyph'

type GridViewProps = {
  topic: string
  segments: Segment[]
  activeSegmentId: string | null
  onSelectSegment: (segmentId: string) => void
}

export function GridView({ topic, segments, activeSegmentId, onSelectSegment }: GridViewProps) {
  return (
    <section className="view-surface glass-panel">
      <div className="view-head">
        <div>
          <p className="panel-kicker">Grid View</p>
          <h2>{topic || 'Untitled Map'}</h2>
        </div>
        <p className="meta-text">Scan all memory anchors at once.</p>
      </div>

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
    </section>
  )
}
