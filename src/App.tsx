import { useEffect, useState } from 'react'
import './App.css'
import { AppShell } from './components/AppShell'
import { ClockRail } from './components/ClockRail'
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
import { createPreview } from './utils/segmentPreview'
import { clearDraft, loadDraft, saveDraft } from './utils/storage'

const DEFAULT_TOPIC = 'Project Presentation'
const MIN_SEGMENTS = 3
const MAX_SEGMENTS = 12
const DEFAULT_SEGMENT_COUNT = 6

function clampSegmentCount(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_SEGMENT_COUNT
  }

  return Math.max(MIN_SEGMENTS, Math.min(MAX_SEGMENTS, Math.round(value)))
}

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
  const normalizedCount = clampSegmentCount(
    Number.isFinite(draft.desiredSegmentCount) ? draft.desiredSegmentCount : DEFAULT_SEGMENT_COUNT,
  )

  if (draft.segments.length === 0) {
    return {
      ...draft,
      desiredSegmentCount: normalizedCount,
      activeSegmentId: null,
    }
  }

  if (draft.activeSegmentId && draft.segments.some((segment) => segment.id === draft.activeSegmentId)) {
    return draft
  }

  return {
    ...draft,
    desiredSegmentCount: normalizedCount,
    activeSegmentId: draft.segments[0]?.id ?? null,
  }
}

function guessTopic(rawText: string, fallbackTopic: string) {
  const firstLine = rawText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length > 0)

  if (!firstLine) {
    return fallbackTopic || DEFAULT_TOPIC
  }

  return firstLine.length > 64 ? `${firstLine.slice(0, 61).trimEnd()}...` : firstLine
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
  const [isSourceSectionOpen, setIsSourceSectionOpen] = useState(true)
  const [isEditorSectionOpen, setIsEditorSectionOpen] = useState(true)
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
    <ClockRail
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
    const source = draft.rawText.trim()
    if (!source) {
      return
    }

    const targetCount = clampSegmentCount(draft.desiredSegmentCount)

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
            topic: current.topic.trim() ? current.topic : guessTopic(source, DEFAULT_TOPIC),
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
        onLayoutChange={(layoutMode) => setDraft((current) => ({ ...current, layoutMode }))}
        onNewMap={handleReset}
        onPresent={handleOpenPresentation}
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
                hasSegments={hasSegments}
                statusNote={isGenerating ? generationStatus : generationNote}
                onRawTextChange={(value) => setDraft((current) => ({ ...current, rawText: value }))}
                onDesiredSegmentCountChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    desiredSegmentCount: clampSegmentCount(value),
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
                onTopicChange={(topic) => setDraft((current) => ({ ...current, topic }))}
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
          {hasSegments ? (
            view
          ) : (
            <div className="empty-canvas glass-panel">
              <p className="panel-kicker">Allison Mind Mapping</p>
              <h2>Generate your first memory map</h2>
              <p>
                Paste a speech, lecture, or project notes on the left. The app will segment it into 3-12 nodes and
                render Clock, Grid, and Linear views in sync.
              </p>
            </div>
          )}

          <div className="status-rail glass-panel">
            <span>{hasSegments ? `Segments: ${draft.segments.length}` : 'No segments generated'}</span>
            <span>{activeSegment ? `Active: ${activeSegment.keyword}` : 'Select a segment to edit'}</span>
            <span>Layout: {draft.layoutMode}</span>
          </div>
        </section>
      </main>

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
