type InputPanelProps = {
  rawText: string
  charCount: number
  desiredSegmentCount: number
  isGenerating: boolean
  hasSegments: boolean
  statusNote?: string | null
  onRawTextChange: (value: string) => void
  onDesiredSegmentCountChange: (value: number) => void
  onGenerate: () => void
  onReset: () => void
}

export function InputPanel({
  rawText,
  charCount,
  desiredSegmentCount,
  isGenerating,
  hasSegments,
  statusNote,
  onRawTextChange,
  onDesiredSegmentCountChange,
  onGenerate,
  onReset,
}: InputPanelProps) {
  const activityLabel = isGenerating
    ? (statusNote ?? 'Analyzing key points...')
    : (statusNote ?? (hasSegments ? 'Map generated' : 'Awaiting generation'))

  return (
    <section className="workspace-panel glass-panel">
      <div className="panel-head">
        <p className="panel-kicker">Editor</p>
        <h2>Source Material</h2>
      </div>

      <label className="field">
        <span className="field__label">Paste speech, lecture, or project notes</span>
        <textarea
          className="field__control field__control--textarea"
          value={rawText}
          onChange={(event) => onRawTextChange(event.target.value)}
          placeholder="Paste long-form content. Generation will split it into 3-12 memory segments."
          spellCheck={false}
        />
      </label>

      <label className="field">
        <span className="field__label">Node Count (3-12)</span>
        <input
          type="number"
          className="field__control"
          min={3}
          max={12}
          step={1}
          value={desiredSegmentCount}
          disabled={isGenerating}
          onChange={(event) => onDesiredSegmentCountChange(Number(event.target.value))}
        />
      </label>

      <div className="panel-row">
        <span className="meta-text">{charCount.toLocaleString()} characters</span>
        <span className="meta-text">{activityLabel}</span>
      </div>

      <div className="panel-actions">
        <button type="button" className="ghost-button" onClick={onReset}>
          Reset
        </button>
        <button type="button" className="primary-button" onClick={onGenerate} disabled={isGenerating || !rawText.trim()}>
          {isGenerating ? 'Generating...' : 'Generate Mind Map'}
        </button>
      </div>
    </section>
  )
}
