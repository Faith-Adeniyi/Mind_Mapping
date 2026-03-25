type InputPanelProps = {
  value: string
  onChange: (value: string) => void
  onGenerate: () => void
  onReset: () => void
  isGenerating: boolean
  characterCount: number
}

export function InputPanel({
  value,
  onChange,
  onGenerate,
  onReset,
  isGenerating,
  characterCount,
}: InputPanelProps) {
  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="panel__eyebrow">Content input</p>
          <h2>Paste your speech, lecture, or project notes</h2>
        </div>
        <p className="panel__meta">{characterCount} characters</p>
      </div>

      <textarea
        className="panel__textarea"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste your speech, presentation, or lecture notes here..."
        spellCheck="false"
      />

      <div className="panel__actions">
        <button type="button" className="ghost-btn" onClick={onReset}>
          Reset
        </button>
        <button type="button" className="primary-btn" onClick={onGenerate} disabled={isGenerating}>
          {isGenerating ? 'Generating…' : 'Generate ClockRail'}
        </button>
      </div>
    </section>
  )
}
