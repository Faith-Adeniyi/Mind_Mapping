import { Icon } from '@iconify/react'
import { ALLOWED_UI_SEGMENT_COUNTS } from '../utils/inputValidation'

type SourceDrawerProps = {
  open: boolean
  topic: string
  rawText: string
  desiredSegmentCount: number
  isGenerating: boolean
  isGenerateBlocked: boolean
  statusNote?: string | null
  onClose: () => void
  onTopicChange: (value: string) => void
  onRawTextChange: (value: string) => void
  onDesiredSegmentCountChange: (value: number) => void
  onGenerate: () => void
  onReset: () => void
}

export function SourceDrawer({
  open,
  topic,
  rawText,
  desiredSegmentCount,
  isGenerating,
  isGenerateBlocked,
  statusNote,
  onClose,
  onTopicChange,
  onRawTextChange,
  onDesiredSegmentCountChange,
  onGenerate,
  onReset,
}: SourceDrawerProps) {
  const generateDisabled = isGenerating || isGenerateBlocked || rawText.trim().length < 12

  return (
    <>
      <div className={`drawer-scrim ${open ? 'on' : ''}`} onClick={onClose} aria-hidden={!open} />
      <div className={`drawer ${open ? 'on' : ''}`} role="dialog" aria-label="Source material" aria-hidden={!open}>
        <div className="drawer__head">
          <h3>Source material</h3>
          <button type="button" className="btn btn--icon btn--ghost" onClick={onClose} aria-label="Close">
            <Icon icon="tabler:x" width={16} height={16} />
          </button>
        </div>

        <div className="drawer__body">
          <div className="fld">
            <label className="fld__lab" htmlFor="src-topic">Map title</label>
            <input id="src-topic" value={topic} onChange={(e) => onTopicChange(e.target.value)} placeholder="Untitled map" />
          </div>

          <div className="fld">
            <label className="fld__lab" htmlFor="src-text">Your text</label>
            <textarea
              id="src-text"
              style={{ minHeight: '220px' }}
              value={rawText}
              onChange={(e) => onRawTextChange(e.target.value)}
              placeholder="Paste a speech, lecture, or notes…"
              spellCheck={false}
            />
          </div>

          <div className="fld">
            <label className="fld__lab">Number of anchors</label>
            <div className="compose__counts">
              {ALLOWED_UI_SEGMENT_COUNTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`seg-pill ${c === desiredSegmentCount ? 'on' : ''}`}
                  onClick={() => onDesiredSegmentCountChange(c)}
                  disabled={isGenerating}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {statusNote ? <p className="meta-text">{statusNote}</p> : null}

          <button
            type="button"
            className="btn btn--accent"
            style={{ justifyContent: 'center' }}
            disabled={generateDisabled}
            onClick={onGenerate}
          >
            <Icon icon={isGenerating ? 'tabler:loader-2' : 'tabler:wand'} width={16} height={16} />
            {isGenerating ? 'Mapping…' : 'Regenerate map'}
          </button>

          <button
            type="button"
            className="btn btn--ghost"
            style={{ justifyContent: 'center' }}
            onClick={onReset}
          >
            <Icon icon="tabler:plus" width={16} height={16} />
            Start a new map
          </button>
        </div>
      </div>
    </>
  )
}
