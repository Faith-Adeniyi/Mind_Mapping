import { Icon } from '@iconify/react'
import { useState } from 'react'
import { ALLOWED_UI_SEGMENT_COUNTS, DEFAULT_UI_SEGMENT_COUNT } from '../utils/inputValidation'

const SAMPLE_TEXT =
  'Imagine the last meeting you sat through that could have been an email. Now imagine that was the rule, not the exception. ' +
  'For a century the office was where work happened. In the span of a few years that assumption collapsed. ' +
  'Output per hour rose where teams controlled their own schedules. Attrition fell where flexibility was real. ' +
  'Maya is a designer in a mid-sized city. Two years ago her Tuesday meant ninety minutes in traffic. Today it means a morning walk, deep focus before noon, and dinner with her kids. ' +
  'The honest objection is trust. Define outcomes, not hours, and the trust gap closes on its own. ' +
  'Pick one team, give them ownership of their outcomes for a single quarter, and measure honestly.'

type ComposeProps = {
  rawText: string
  desiredSegmentCount: number
  isGenerating: boolean
  isGenerateBlocked: boolean
  statusNote?: string | null
  onRawTextChange: (value: string) => void
  onDesiredSegmentCountChange: (value: number) => void
  onGenerate: () => void
}

export function Compose({
  rawText,
  desiredSegmentCount,
  isGenerating,
  isGenerateBlocked,
  statusNote,
  onRawTextChange,
  onDesiredSegmentCountChange,
  onGenerate,
}: ComposeProps) {
  const [localText, setLocalText] = useState(rawText)
  const text = rawText.length > 0 ? rawText : localText
  const generateDisabled = isGenerating || isGenerateBlocked || text.trim().length < 12

  const setText = (value: string) => {
    setLocalText(value)
    onRawTextChange(value)
  }

  return (
    <div className="empty">
      <div className="compose">
        <span className="compose__badge">
          <Icon icon="tabler:wand" width={28} height={28} />
        </span>
        <h2>Turn your words into a memory map</h2>
        <p>
          Paste a speech, a lecture, or a wall of project notes. ClockRay finds the anchors and lays them out around the clock.
        </p>

        <div className="compose__box">
          <textarea
            className="compose__ta"
            placeholder="Paste your speech, lecture, or notes here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
          />
          <div className="compose__bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
              <span className="compose__hint">Anchors</span>
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
            <button
              type="button"
              className="btn btn--accent"
              disabled={generateDisabled}
              onClick={onGenerate}
            >
              <Icon icon={isGenerating ? 'tabler:loader-2' : 'tabler:wand'} width={16} height={16} />
              {isGenerating ? 'Mapping…' : 'Generate map'}
            </button>
          </div>
        </div>

        <div className="compose__chips">
          <button type="button" className="chip" onClick={() => setText(SAMPLE_TEXT)}>
            Try a sample speech
          </button>
          <button
            type="button"
            className="chip"
            onClick={() => {
              setText(SAMPLE_TEXT)
              onDesiredSegmentCountChange(DEFAULT_UI_SEGMENT_COUNT)
              onGenerate()
            }}
          >
            Generate the sample now
          </button>
        </div>

        {statusNote ? <p className="meta-text">{statusNote}</p> : null}
      </div>
    </div>
  )
}
