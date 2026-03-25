import type { Segment } from '../types'

type EditorPanelProps = {
  title: string
  subtitle: string
  segments: Segment[]
  activeIndex: number
  onTitleChange: (value: string) => void
  onSubtitleChange: (value: string) => void
  onSegmentKeywordChange: (index: number, value: string) => void
  onSegmentTextChange: (index: number, value: string) => void
  onCycleIcon: (index: number) => void
}

export function EditorPanel({
  title,
  subtitle,
  segments,
  activeIndex,
  onTitleChange,
  onSubtitleChange,
  onSegmentKeywordChange,
  onSegmentTextChange,
  onCycleIcon,
}: EditorPanelProps) {
  const activeSegment = segments[activeIndex]

  return (
    <section className="panel panel--editor">
      <div className="panel__header">
        <div>
          <p className="panel__eyebrow">Edit segments</p>
          <h2>Fine-tune the recall cues</h2>
        </div>
      </div>

      <div className="editor-meta">
        <label>
          Topic title
          <input
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Main topic"
          />
        </label>

        <label>
          Topic subtitle
          <input
            type="text"
            value={subtitle}
            onChange={(event) => onSubtitleChange(event.target.value)}
            placeholder="Short supporting line"
          />
        </label>
      </div>

      {activeSegment ? (
        <div className="editor-card">
          <div className="editor-card__head">
            <span className="editor-card__index">{activeIndex + 1}</span>
            <button type="button" className="icon-btn" onClick={() => onCycleIcon(activeIndex)}>
              {activeSegment.icon}
            </button>
          </div>

          <label>
            Keyword
            <input
              type="text"
              value={activeSegment.keyword}
              onChange={(event) => onSegmentKeywordChange(activeIndex, event.target.value)}
              placeholder="Keyword"
            />
          </label>

          <label>
            Segment text
            <textarea
              value={activeSegment.text}
              onChange={(event) => onSegmentTextChange(activeIndex, event.target.value)}
              placeholder="Full segment text"
            />
          </label>
        </div>
      ) : (
        <div className="empty-state">
          <p>Generate a ClockRail map to begin editing segments.</p>
        </div>
      )}
    </section>
  )
}
