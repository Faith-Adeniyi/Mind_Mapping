import { useEffect, useRef, useState } from 'react'
import './App.css'
import { AppShell } from './components/AppShell'
import { ClockRay } from './components/ClockRay'
import { EditorPanel } from './components/EditorPanel'
import { GridView } from './components/GridView'
import { InputPanel } from './components/InputPanel'
import { LinearView } from './components/LinearView'
import { PresentationMode } from './components/PresentationMode'
import { TopBar } from './components/TopBar'
import { TONE_SEQUENCE } from './data/iconDefaults'
import type { GeneratedSegmentDraft, MapDraft, PresentationState, Segment } from './types'
import { analyzeMapText } from './utils/analyzeMap'
import { assignIcon } from './utils/assignIcon'
import { DEFAULT_UI_SEGMENT_COUNT, normalizeUiSegmentCount, sanitizeTopicInput, validateGenerationInput } from './utils/inputValidation'
import { downloadMapCardPdf, type PdfPaperSize } from './utils/exportMapPdf'
import { createPreview } from './utils/segmentPreview'
import { clearDraft, loadDraft, saveDraft } from './utils/storage'

const DEFAULT_TOPIC = 'Project Presentation'
const DEFAULT_SEGMENT_COUNT = DEFAULT_UI_SEGMENT_COUNT

function createDefaultDraft(): MapDraft {
  return {
    topic: DEFAULT_TOPIC,
    rawText: '',
    desiredSegmentCount: DEFAULT_SEGMENT_COUNT,
    segments: [],
    activeSegmentId: null,
    layoutMode: 'clock',
  }
}

function normalizeDraft(draft: MapDraft): MapDraft {
  const normalizedCount = normalizeUiSegmentCount(
    Number.isFinite(draft.desiredSegmentCount) ? draft.desiredSegmentCount : DEFAULT_SEGMENT_COUNT,
    DEFAULT_SEGMENT_COUNT,
  )
  const baseDraft: MapDraft = {
    ...draft,
    desiredSegmentCount: normalizedCount,
  }

  if (draft.segments.length === 0) {
    return {
      ...baseDraft,
      activeSegmentId: null,
    }
  }

  if (draft.activeSegmentId && draft.segments.some((segment) => segment.id === draft.activeSegmentId)) {
    return baseDraft
  }

  return {
    ...baseDraft,
    activeSegmentId: draft.segments[0]?.id ?? null,
  }
}

function createSegments(drafts: GeneratedSegmentDraft[]) {
  return drafts.map((draft, index): Segment => ({
    id: `segment-${index + 1}`,
    order: index + 1,
    text: draft.text,
    keyword: draft.keyword,
    icon: assignIcon({
      text: draft.text,
      keyword: draft.keyword,
      iconTokens: draft.iconTokens,
    }),
    preview: createPreview(draft.text),
    tone: TONE_SEQUENCE[index % TONE_SEQUENCE.length] ?? 'primary',
  }))
}

function getActiveIndex(segments: Segment[], activeSegmentId: string | null) {
  if (!activeSegmentId) {
    return 0
  }

  const index = segments.findIndex((segment) => segment.id === activeSegmentId)
  return index >= 0 ? index : 0
}

function reorderSegments(segments: Segment[], draggedSegmentId: string, targetSegmentId: string) {
  const fromIndex = segments.findIndex((segment) => segment.id === draggedSegmentId)
  const toIndex = segments.findIndex((segment) => segment.id === targetSegmentId)

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return segments
  }

  const next = [...segments]
  const [moved] = next.splice(fromIndex, 1)

  if (!moved) {
    return segments
  }

  next.splice(toIndex, 0, moved)

  return next.map((segment, index) => ({
    ...segment,
    order: index + 1,
  }))
}

function moveSegment(segments: Segment[], segmentId: string, direction: 'up' | 'down') {
  const index = segments.findIndex((segment) => segment.id === segmentId)

  if (index < 0) {
    return segments
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= segments.length) {
    return segments
  }

  return reorderSegments(segments, segmentId, segments[targetIndex]?.id ?? segmentId)
}

function App() {
  const [draft, setDraft] = useState<MapDraft>(() => normalizeDraft(loadDraft() ?? createDefaultDraft()))
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<string | null>(null)
  const [generationNote, setGenerationNote] = useState<string | null>(null)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [exportPaperSize, setExportPaperSize] = useState<PdfPaperSize>('a4')
  const [isSourceSectionOpen, setIsSourceSectionOpen] = useState(true)
  const [isEditorSectionOpen, setIsEditorSectionOpen] = useState(true)
  const exportCaptureRef = useRef<HTMLDivElement | null>(null)
  const [presentation, setPresentation] = useState<PresentationState>({
    isOpen: false,
    index: 0,
    isPlaying: false,
    startedAt: null,
  })

  useEffect(() => {
    saveDraft(draft)
  }, [draft])

  const activeIndex = getActiveIndex(draft.segments, draft.activeSegmentId)
  const activeSegment = draft.segments[activeIndex] ?? null
  const hasSegments = draft.segments.length > 0
  const desiredSegmentCount = normalizeUiSegmentCount(draft.desiredSegmentCount, DEFAULT_SEGMENT_COUNT)
  const generationValidation = validateGenerationInput({
    text: draft.rawText,
    desiredSegmentCount,
  })
  const generationValidationMessage = draft.rawText.length > 0 && !generationValidation.ok
    ? generationValidation.message
    : null

  const handleSelectSegment = (segmentId: string) => {
    const selectedIndex = draft.segments.findIndex((segment) => segment.id === segmentId)
    if (selectedIndex < 0) {
      return
    }

    setDraft((current) => ({ ...current, activeSegmentId: segmentId }))

    if (presentation.isOpen) {
      setPresentation((current) => ({
        ...current,
        index: selectedIndex,
      }))
    }
  }

  let view = (
    <ClockRay
      topic={draft.topic}
      segments={draft.segments}
      activeSegmentId={draft.activeSegmentId}
      onSelectSegment={handleSelectSegment}
    />
  )

  if (draft.layoutMode === 'grid') {
    view = (
      <GridView
        topic={draft.topic}
        segments={draft.segments}
        activeSegmentId={draft.activeSegmentId}
        onSelectSegment={handleSelectSegment}
      />
    )
  } else if (draft.layoutMode === 'linear') {
    view = (
      <LinearView
        topic={draft.topic}
        segments={draft.segments}
        activeSegmentId={draft.activeSegmentId}
        onSelectSegment={handleSelectSegment}
      />
    )
  }

  const handleGenerate = () => {
    const preflight = validateGenerationInput({
      text: draft.rawText,
      desiredSegmentCount: normalizeUiSegmentCount(draft.desiredSegmentCount, DEFAULT_SEGMENT_COUNT),
    })

    if (!preflight.ok) {
      setGenerationNote(preflight.message)
      return
    }

    const source = preflight.value.text
    const targetCount = preflight.value.minSegments

    setIsGenerating(true)
    setGenerationStatus('Analyzing key points...')
    setGenerationNote(null)

    void (async () => {
      try {
        const analysis = await analyzeMapText(source, {
          minSegments: targetCount,
          maxSegments: targetCount,
          onStatusChange: setGenerationStatus,
        })

        const generated = createSegments(analysis.segments)

        setDraft((current) =>
          normalizeDraft({
            ...current,
            topic: sanitizeTopicInput(analysis.topic) || DEFAULT_TOPIC,
            segments: generated,
            activeSegmentId: generated[0]?.id ?? null,
          }),
        )

        setPresentation((current) => ({
          ...current,
          isOpen: false,
          index: 0,
          isPlaying: false,
          startedAt: null,
        }))

        setGenerationNote(analysis.note ?? 'Map generated')
      } catch {
        setGenerationNote('Generation failed. Please try again.')
      } finally {
        setIsGenerating(false)
        setGenerationStatus(null)
      }
    })()
  }

  const handleReset = () => {
    clearDraft()
    setDraft(createDefaultDraft())
    setPresentation({
      isOpen: false,
      index: 0,
      isPlaying: false,
      startedAt: null,
    })
    setIsGenerating(false)
    setGenerationStatus(null)
    setGenerationNote(null)
    setIsExportDialogOpen(false)
    setIsExportingPdf(false)
  }

  const handleOpenExportDialog = () => {
    if (!hasSegments || isExportingPdf) {
      return
    }

    setExportPaperSize('a4')
    setIsExportDialogOpen(true)
  }

  const handleConfirmExport = () => {
    if (!hasSegments || isExportingPdf) {
      return
    }

    setIsExportDialogOpen(false)

    const target = exportCaptureRef.current?.querySelector<HTMLElement>('.view-surface')
    if (!target) {
      setGenerationNote('PDF export failed. Map view not found.')
      return
    }

    setIsExportingPdf(true)
    setGenerationNote('Preparing PDF export...')

    void (async () => {
      try {
        await downloadMapCardPdf(target, exportPaperSize)
        setGenerationNote('PDF downloaded')
      } catch {
        setGenerationNote('PDF export failed. Please try again.')
      } finally {
        setIsExportingPdf(false)
      }
    })()
  }

  const handleOpenPresentation = () => {
    if (!hasSegments) {
      return
    }

    setPresentation({
      isOpen: true,
      index: activeIndex,
      isPlaying: false,
      startedAt: Date.now(),
    })
  }

  const handleClosePresentation = () => {
    setPresentation((current) => ({
      ...current,
      isOpen: false,
      isPlaying: false,
    }))
  }

  const handlePrevious = () => {
    setPresentation((current) => {
      const baseIndex = getActiveIndex(draft.segments, draft.activeSegmentId)
      const nextIndex = Math.max(0, baseIndex - 1)
      const nextSegment = draft.segments[nextIndex]

      if (nextSegment) {
        setDraft((draftState) => ({
          ...draftState,
          activeSegmentId: nextSegment.id,
        }))
      }

      return {
        ...current,
        index: nextIndex,
      }
    })
  }

  const handleNext = () => {
    setPresentation((current) => {
      const lastIndex = Math.max(0, draft.segments.length - 1)
      const baseIndex = getActiveIndex(draft.segments, draft.activeSegmentId)
      const nextIndex = Math.min(lastIndex, baseIndex + 1)
      const nextSegment = draft.segments[nextIndex]

      if (nextSegment) {
        setDraft((draftState) => ({
          ...draftState,
          activeSegmentId: nextSegment.id,
        }))
      }

      return {
        ...current,
        index: nextIndex,
      }
    })
  }

  return (
    <AppShell>
      <TopBar
        layoutMode={draft.layoutMode}
        canPresent={hasSegments}
        canExport={hasSegments}
        onLayoutChange={(layoutMode) => setDraft((current) => ({ ...current, layoutMode }))}
        onNewMap={handleReset}
        onPresent={handleOpenPresentation}
        onExportPdf={handleOpenExportDialog}
      />

      <main className="workspace">
        <aside className="workspace__sidebar">
          <section className={`sidebar-section ${isSourceSectionOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className="sidebar-section__toggle"
              onClick={() => setIsSourceSectionOpen((current) => !current)}
              aria-expanded={isSourceSectionOpen}
              aria-controls="sidebar-source-panel"
            >
              <span>Source Material</span>
              <span className="sidebar-section__chevron" aria-hidden="true">
                {isSourceSectionOpen ? '\u2212' : '+'}
              </span>
            </button>
            <div id="sidebar-source-panel" className="sidebar-section__content">
              <InputPanel
                rawText={draft.rawText}
                charCount={draft.rawText.length}
                desiredSegmentCount={draft.desiredSegmentCount}
                isGenerating={isGenerating}
                isGenerateBlocked={Boolean(generationValidationMessage)}
                hasSegments={hasSegments}
                statusNote={isGenerating ? generationStatus : (generationValidationMessage ?? generationNote)}
                onRawTextChange={(value) => setDraft((current) => ({ ...current, rawText: value }))}
                onDesiredSegmentCountChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    desiredSegmentCount: normalizeUiSegmentCount(value, DEFAULT_SEGMENT_COUNT),
                  }))
                }
                onGenerate={handleGenerate}
                onReset={handleReset}
              />
            </div>
          </section>

          <section className={`sidebar-section ${isEditorSectionOpen ? 'is-open' : ''}`}>
            <button
              type="button"
              className="sidebar-section__toggle"
              onClick={() => setIsEditorSectionOpen((current) => !current)}
              aria-expanded={isEditorSectionOpen}
              aria-controls="sidebar-editor-panel"
            >
              <span>Segment Editor</span>
              <span className="sidebar-section__chevron" aria-hidden="true">
                {isEditorSectionOpen ? '\u2212' : '+'}
              </span>
            </button>
            <div id="sidebar-editor-panel" className="sidebar-section__content">
              <EditorPanel
                topic={draft.topic}
                segments={draft.segments}
                activeSegmentId={draft.activeSegmentId}
                onTopicChange={(topic) =>
                  setDraft((current) => ({ ...current, topic: sanitizeTopicInput(topic) }))
                }
                onSelectSegment={handleSelectSegment}
                onSegmentIconSelect={(segmentId, icon) =>
                  setDraft((current) => ({
                    ...current,
                    segments: current.segments.map((segment) =>
                      segment.id === segmentId
                        ? {
                            ...segment,
                            icon,
                          }
                        : segment,
                    ),
                  }))
                }
                onReorderSegment={(draggedSegmentId, targetSegmentId) =>
                  setDraft((current) => ({
                    ...current,
                    segments: reorderSegments(current.segments, draggedSegmentId, targetSegmentId),
                  }))
                }
                onMoveSegment={(segmentId, direction) =>
                  setDraft((current) => ({
                    ...current,
                    segments: moveSegment(current.segments, segmentId, direction),
                  }))
                }
                onSegmentKeywordChange={(segmentId, keyword) =>
                  setDraft((current) => ({
                    ...current,
                    segments: current.segments.map((segment) =>
                      segment.id === segmentId ? { ...segment, keyword: keyword.trim() || segment.keyword } : segment,
                    ),
                  }))
                }
                onSegmentTextChange={(segmentId, text) =>
                  setDraft((current) => ({
                    ...current,
                    segments: current.segments.map((segment) =>
                      segment.id === segmentId
                        ? {
                            ...segment,
                            text,
                            preview: createPreview(text),
                          }
                        : segment,
                    ),
                  }))
                }
              />
            </div>
          </section>
        </aside>

        <section className="workspace__canvas">
          <div className="print-export-scope" ref={exportCaptureRef}>
            {hasSegments ? (
              view
            ) : (
              <div className="empty-canvas glass-panel">
                <p className="panel-kicker">Allison's Memory ClockRay</p>
                <h2>Generate your first Memory Clock</h2>
                <p>
                  Paste a speech, lecture, or project notes on the left. The app will segment it into 3, 4, 6, 8, or 12 nodes and
                  render Clock, Grid, and Linear views in sync.
                </p>
              </div>
            )}
          </div>

          <div className="status-rail glass-panel">
            <span>{hasSegments ? `Segments: ${draft.segments.length}` : 'No segments generated'}</span>
            <span>{activeSegment ? `Active: ${activeSegment.keyword}` : 'Select a segment to edit'}</span>
            <span>Layout: {draft.layoutMode}</span>
          </div>
        </section>
      </main>

      {isExportDialogOpen ? (
        <>
          <div className="export-dialog-backdrop" onClick={() => setIsExportDialogOpen(false)} aria-hidden="true" />
          <div className="export-dialog glass-panel" role="dialog" aria-modal="true" aria-label="Export PDF">
            <div className="export-dialog__head">
              <p className="panel-kicker">Export PDF</p>
              <h3>Choose paper size</h3>
            </div>

            <div className="export-size-options" role="radiogroup" aria-label="Paper size">
              <button
                type="button"
                role="radio"
                aria-checked={exportPaperSize === 'a4'}
                className={`export-size-option ${exportPaperSize === 'a4' ? 'is-active' : ''}`}
                onClick={() => setExportPaperSize('a4')}
              >
                <strong>A4</strong>
                <span>Portrait</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={exportPaperSize === 'a3'}
                className={`export-size-option ${exportPaperSize === 'a3' ? 'is-active' : ''}`}
                onClick={() => setExportPaperSize('a3')}
              >
                <strong>A3</strong>
                <span>Portrait</span>
              </button>
            </div>

            <p className="meta-text">Download a PDF of your current map card with the live visual style and node positions.</p>

            <div className="panel-actions export-dialog__actions">
              <button
                type="button"
                className="ghost-button"
                disabled={isExportingPdf}
                onClick={() => setIsExportDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                disabled={isExportingPdf}
                onClick={handleConfirmExport}
              >
                {isExportingPdf ? 'Downloading...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </>
      ) : null}

      <PresentationMode
        isOpen={presentation.isOpen}
        topic={draft.topic}
        layoutMode={draft.layoutMode}
        segments={draft.segments}
        activeSegmentId={draft.activeSegmentId}
        currentIndex={presentation.isOpen ? activeIndex : presentation.index}
        onClose={handleClosePresentation}
        onSelectSegment={handleSelectSegment}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    </AppShell>
  )
}

export default App
