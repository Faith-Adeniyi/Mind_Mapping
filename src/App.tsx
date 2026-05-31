import { Icon } from '@iconify/react'
import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import './App.css'
import { AppShell } from './components/AppShell'
import { AuthGate } from './components/AuthGate'
import { ClockRay } from './components/ClockRay'
import { Compose } from './components/Compose'
import { GridView } from './components/GridView'
import { HistoryDrawer } from './components/HistoryDrawer'
import { Inspector } from './components/Inspector'
import { LinearView } from './components/LinearView'
import { PresentationMode, type PresentationModeHandle } from './components/PresentationMode'
import { SourceDrawer } from './components/SourceDrawer'
import { TopBar } from './components/TopBar'
import { TONE_SEQUENCE } from './data/iconDefaults'
import { useAutoSaveMap } from './hooks/useAutoSaveMap'
import { useMindMaps } from './hooks/useMindMaps'
import { useTheme } from './hooks/useTheme'
import {
  createMap,
  deleteMap as deleteMapApi,
  duplicateMap as duplicateMapApi,
  renameMap as renameMapApi,
} from './lib/mindMapsApi'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import type { GeneratedSegmentDraft, MapDraft, PresentationState, SavedMindMap, Segment } from './types'
import { analyzeMapText } from './utils/analyzeMap'
import { assignIcon } from './utils/assignIcon'
import { downloadMapCardPdf, type PdfPaperSize } from './utils/exportMapPdf'
import {
  DEFAULT_UI_SEGMENT_COUNT,
  normalizeUiSegmentCount,
  sanitizeTopicInput,
  validateGenerationInput,
} from './utils/inputValidation'
import { createPreview } from './utils/segmentPreview'
import { clearDraft, loadDraft, saveDraft } from './utils/storage'

const DEFAULT_TOPIC = 'Untitled Map'
const DEFAULT_SEGMENT_COUNT = DEFAULT_UI_SEGMENT_COUNT

function createDefaultDraft(): MapDraft {
  return {
    topic: DEFAULT_TOPIC,
    rawText: '',
    desiredSegmentCount: DEFAULT_SEGMENT_COUNT,
    segments: [],
    activeSegmentId: null,
    layoutMode: 'clock',
    currentMapId: null,
  }
}

function savedMapToDraft(map: SavedMindMap): MapDraft {
  return {
    topic: sanitizeTopicInput(map.topic) || DEFAULT_TOPIC,
    rawText: map.rawText,
    desiredSegmentCount: normalizeUiSegmentCount(map.desiredSegmentCount, DEFAULT_SEGMENT_COUNT),
    segments: map.segments,
    activeSegmentId: map.segments[0]?.id ?? null,
    layoutMode: map.layoutMode,
    currentMapId: map.id,
  }
}

function normalizeDraft(draft: MapDraft): MapDraft {
  const normalizedCount = normalizeUiSegmentCount(
    Number.isFinite(draft.desiredSegmentCount) ? draft.desiredSegmentCount : DEFAULT_SEGMENT_COUNT,
    DEFAULT_SEGMENT_COUNT,
  )
  const base: MapDraft = { ...draft, desiredSegmentCount: normalizedCount }

  if (draft.segments.length === 0) {
    return { ...base, activeSegmentId: null }
  }
  if (draft.activeSegmentId && draft.segments.some((s) => s.id === draft.activeSegmentId)) {
    return base
  }
  return { ...base, activeSegmentId: draft.segments[0]?.id ?? null }
}

function createSegments(drafts: GeneratedSegmentDraft[]): Segment[] {
  return drafts.map((draft, index) => ({
    id: `segment-${index + 1}`,
    order: index + 1,
    text: draft.text,
    keyword: draft.keyword,
    icon: assignIcon({ text: draft.text, keyword: draft.keyword, iconTokens: draft.iconTokens }),
    preview: createPreview(draft.text),
    tone: TONE_SEQUENCE[index % TONE_SEQUENCE.length] ?? 'primary',
  }))
}

function getActiveIndex(segments: Segment[], activeSegmentId: string | null) {
  if (!activeSegmentId) return 0
  const index = segments.findIndex((s) => s.id === activeSegmentId)
  return index >= 0 ? index : 0
}

function reorderSegments(segments: Segment[], draggedSegmentId: string, targetSegmentId: string) {
  const from = segments.findIndex((s) => s.id === draggedSegmentId)
  const to = segments.findIndex((s) => s.id === targetSegmentId)
  if (from < 0 || to < 0 || from === to) return segments
  const next = [...segments]
  const [moved] = next.splice(from, 1)
  if (!moved) return segments
  next.splice(to, 0, moved)
  return next.map((s, i) => ({ ...s, order: i + 1 }))
}

function moveSegment(segments: Segment[], id: string, direction: 'up' | 'down') {
  const index = segments.findIndex((s) => s.id === id)
  if (index < 0) return segments
  const target = direction === 'up' ? index - 1 : index + 1
  if (target < 0 || target >= segments.length) return segments
  return reorderSegments(segments, id, segments[target]?.id ?? id)
}

function App() {
  const { theme, toggleTheme } = useTheme()

  const [session, setSession] = useState<Session | null | undefined>(
    isSupabaseConfigured ? undefined : null,
  )

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession))
    return () => listener.subscription.unsubscribe()
  }, [])

  const [draft, setDraft] = useState<MapDraft>(() => normalizeDraft(loadDraft() ?? createDefaultDraft()))
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<string | null>(null)
  const [generationNote, setGenerationNote] = useState<string | null>(null)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [exportPaperSize, setExportPaperSize] = useState<PdfPaperSize>('a4')
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false)
  const [isInspectorOpen, setIsInspectorOpen] = useState(true)
  const [toast, setToast] = useState<string | null>(null)
  const [pendingReplace, setPendingReplace] = useState<
    | { kind: 'open'; mapId: string }
    | { kind: 'reset' }
    | null
  >(null)
  const [presentation, setPresentation] = useState<PresentationState>({
    isOpen: false,
    index: 0,
    isPlaying: false,
    startedAt: null,
    mode: 'standard',
  })

  const exportCaptureRef = useRef<HTMLDivElement | null>(null)
  const mapSurfaceRef = useRef<HTMLElement | null>(null)
  const presentationModeRef = useRef<PresentationModeHandle | null>(null)
  const lastUserIdRef = useRef<string | null>(null)

  const [isCompactViewport, setIsCompactViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 720 : false,
  )

  useEffect(() => {
    saveDraft(draft)
  }, [draft])

  const userId = session ? session.user.id : null

  useEffect(() => {
    // Reset draft when a different user signs in (prevents seeing the previous user's open map).
    // We don't clear on sign-out so the same user signing back in keeps their work.
    if (!userId) return
    if (lastUserIdRef.current !== null && lastUserIdRef.current !== userId) {
      clearDraft()
      setDraft(createDefaultDraft())
      setIsHistoryDrawerOpen(false)
      setIsDrawerOpen(false)
      setPendingReplace(null)
    }
    lastUserIdRef.current = userId
  }, [userId])

  const {
    maps: savedMaps,
    isLoading: isLoadingMaps,
    error: mapsError,
    refresh: refreshMaps,
    upsertLocal: upsertSavedMap,
    removeLocal: removeSavedMap,
  } = useMindMaps(userId)

  const handleAutoSaved = useCallback(
    (saved: SavedMindMap) => {
      upsertSavedMap(saved)
    },
    [upsertSavedMap],
  )

  const handleAutoSaveError = useCallback(() => {
    setToast('Save failed — will retry on next edit')
  }, [])

  const { state: saveState, lastSavedAt } = useAutoSaveMap({
    mapId: userId ? draft.currentMapId : null,
    draft,
    onSaved: handleAutoSaved,
    onError: handleAutoSaveError,
  })

  useEffect(() => {
    const onResize = () => setIsCompactViewport(window.innerWidth <= 720)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const id = setTimeout(() => setToast(null), 2200)
    return () => clearTimeout(id)
  }, [toast])

  const activeIndex = getActiveIndex(draft.segments, draft.activeSegmentId)
  const activeSegment = draft.segments[activeIndex] ?? null
  const hasSegments = draft.segments.length > 0
  const desiredSegmentCount = normalizeUiSegmentCount(draft.desiredSegmentCount, DEFAULT_SEGMENT_COUNT)
  const generationValidation = validateGenerationInput({
    text: draft.rawText,
    desiredSegmentCount,
  })
  const generationValidationMessage =
    draft.rawText.length > 0 && !generationValidation.ok ? generationValidation.message : null

  const handleSelectSegment = (id: string) => {
    if (!draft.segments.some((s) => s.id === id)) return
    setDraft((current) => ({ ...current, activeSegmentId: id }))
    if (window.innerWidth <= 1024) setIsInspectorOpen(true)
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
    setGenerationStatus('Analyzing key points…')
    setGenerationNote(null)

    void (async () => {
      try {
        const analysis = await analyzeMapText(source, {
          minSegments: targetCount,
          maxSegments: targetCount,
          onStatusChange: setGenerationStatus,
        })

        const generated = createSegments(analysis.segments)
        const nextTopic = sanitizeTopicInput(analysis.topic) || DEFAULT_TOPIC

        let nextMapId: string | null = draft.currentMapId
        if (userId) {
          try {
            if (nextMapId) {
              // Existing map → auto-save hook will write the new segments shortly.
            } else {
              const created = await createMap(
                {
                  topic: nextTopic,
                  rawText: source,
                  desiredSegmentCount: targetCount,
                  segments: generated,
                  layoutMode: draft.layoutMode,
                },
                userId,
              )
              nextMapId = created.id
              upsertSavedMap(created)
            }
          } catch {
            // Cloud save failed; keep the map locally. User sees toast.
            setToast('Could not save to cloud — kept locally')
          }
        }

        setDraft((current) =>
          normalizeDraft({
            ...current,
            topic: nextTopic,
            segments: generated,
            activeSegmentId: generated[0]?.id ?? null,
            currentMapId: nextMapId,
          }),
        )
        setPresentation((current) => ({
          ...current,
          isOpen: false,
          index: 0,
          isPlaying: false,
          startedAt: null,
          mode: 'standard',
        }))
        setGenerationNote(analysis.note ?? 'Map generated')
        setIsDrawerOpen(false)
        setIsInspectorOpen(true)
        setToast(`Mapped into ${generated.length} anchors`)
      } catch {
        setGenerationNote('Generation failed. Please try again.')
      } finally {
        setIsGenerating(false)
        setGenerationStatus(null)
      }
    })()
  }

  const performReset = () => {
    clearDraft()
    setDraft(createDefaultDraft())
    setPresentation({ isOpen: false, index: 0, isPlaying: false, startedAt: null, mode: 'standard' })
    setIsGenerating(false)
    setGenerationStatus(null)
    setGenerationNote(null)
    setIsExportDialogOpen(false)
    setIsExportingPdf(false)
    setIsDrawerOpen(false)
    setIsInspectorOpen(true)
  }

  const needsUnsavedGuard = () =>
    draft.segments.length > 0 && !draft.currentMapId

  const handleReset = () => {
    if (needsUnsavedGuard()) {
      setPendingReplace({ kind: 'reset' })
      return
    }
    performReset()
  }

  const performOpenMap = (mapId: string) => {
    const target = savedMaps.find((m) => m.id === mapId)
    if (!target) {
      setToast('Could not find that map')
      return
    }
    setDraft(normalizeDraft(savedMapToDraft(target)))
    setPresentation({ isOpen: false, index: 0, isPlaying: false, startedAt: null, mode: 'standard' })
    setIsGenerating(false)
    setGenerationStatus(null)
    setGenerationNote(null)
    setIsDrawerOpen(false)
    setIsHistoryDrawerOpen(false)
    setIsInspectorOpen(true)
    setToast(`Opened "${target.topic || 'Untitled map'}"`)
  }

  const handleOpenMap = (mapId: string) => {
    if (mapId === draft.currentMapId) {
      setIsHistoryDrawerOpen(false)
      return
    }
    if (needsUnsavedGuard()) {
      setPendingReplace({ kind: 'open', mapId })
      return
    }
    performOpenMap(mapId)
  }

  const handleConfirmReplace = () => {
    if (!pendingReplace) return
    const target = pendingReplace
    setPendingReplace(null)
    if (target.kind === 'open') performOpenMap(target.mapId)
    else performReset()
  }

  const handleCancelReplace = () => setPendingReplace(null)

  const handleRenameMap = (id: string, topic: string) => {
    const cleaned = sanitizeTopicInput(topic)
    if (!cleaned) return
    void (async () => {
      try {
        const updated = await renameMapApi(id, cleaned)
        upsertSavedMap(updated)
        if (draft.currentMapId === id) {
          setDraft((current) => ({ ...current, topic: cleaned }))
        }
        setToast('Renamed')
      } catch {
        setToast('Rename failed')
      }
    })()
  }

  const handleDuplicateMap = (id: string) => {
    if (!userId) return
    const target = savedMaps.find((m) => m.id === id)
    if (!target) return
    void (async () => {
      try {
        const dup = await duplicateMapApi(target, userId)
        upsertSavedMap(dup)
        setToast('Duplicated')
      } catch {
        setToast('Duplicate failed')
      }
    })()
  }

  const handleDeleteMap = (id: string) => {
    void (async () => {
      try {
        await deleteMapApi(id)
        removeSavedMap(id)
        if (draft.currentMapId === id) {
          performReset()
        }
        setToast('Deleted')
      } catch {
        setToast('Delete failed')
      }
    })()
  }

  const handleOpenHistory = () => {
    setIsHistoryDrawerOpen(true)
    if (userId) void refreshMaps()
  }

  const handleOpenExportDialog = () => {
    if (!hasSegments || isExportingPdf) return
    setExportPaperSize('a4')
    setIsExportDialogOpen(true)
  }

  const handleConfirmExport = () => {
    if (!hasSegments || isExportingPdf) return
    setIsExportDialogOpen(false)

    const target = exportCaptureRef.current?.querySelector<HTMLElement>('.view-surface')
    if (!target) {
      setGenerationNote('PDF export failed. Map view not found.')
      return
    }

    setIsExportingPdf(true)
    setGenerationNote('Preparing PDF export…')

    void (async () => {
      try {
        await downloadMapCardPdf(target, exportPaperSize)
        setToast('PDF downloaded')
      } catch {
        setGenerationNote('PDF export failed. Please try again.')
      } finally {
        setIsExportingPdf(false)
      }
    })()
  }

  const handleOpenPresentation = () => {
    if (!hasSegments) return
    flushSync(() => {
      setPresentation({
        isOpen: true,
        index: activeIndex,
        isPlaying: false,
        startedAt: Date.now(),
        mode: 'standard',
      })
    })
    void presentationModeRef.current?.enterFullscreen()
  }

  const handleClosePresentation = () => {
    setPresentation((current) => ({ ...current, isOpen: false, isPlaying: false }))
  }

  const handlePrevious = () => {
    const base = getActiveIndex(draft.segments, draft.activeSegmentId)
    const next = Math.max(0, base - 1)
    const target = draft.segments[next]
    if (target) setDraft((d) => ({ ...d, activeSegmentId: target.id }))
    setPresentation((current) => ({ ...current, index: next }))
  }

  const handleNext = () => {
    const last = Math.max(0, draft.segments.length - 1)
    const base = getActiveIndex(draft.segments, draft.activeSegmentId)
    const next = Math.min(last, base + 1)
    const target = draft.segments[next]
    if (target) setDraft((d) => ({ ...d, activeSegmentId: target.id }))
    setPresentation((current) => ({ ...current, index: next }))
  }

  // ── Render branches ───────────────────────────────
  if (!isSupabaseConfigured) {
    return (
      <AppShell inspectorOpen={false}>
        <div className="grid place-items-center min-h-full p-8">
          <div className="max-w-md text-center grid gap-3">
            <p className="panel-kicker">Configuration required</p>
            <h2 className="font-[Bricolage_Grotesque] text-2xl font-bold">Auth is not configured</h2>
            <p className="meta-text">
              Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in your <code>.env</code> file, then restart the dev server.
            </p>
          </div>
        </div>
      </AppShell>
    )
  }

  if (session === undefined) {
    return (
      <AppShell inspectorOpen={false}>
        <div className="grid place-items-center min-h-full">
          <p className="meta-text">Loading…</p>
        </div>
      </AppShell>
    )
  }

  if (session === null) {
    return <AuthGate />
  }

  let viewNode = (
    <ClockRay
      topic={draft.topic}
      segments={draft.segments}
      activeSegmentId={draft.activeSegmentId}
      onSelectSegment={handleSelectSegment}
      surfaceRef={mapSurfaceRef}
      isCompact={isCompactViewport}
    />
  )

  if (draft.layoutMode === 'grid') {
    viewNode = (
      <GridView
        topic={draft.topic}
        segments={draft.segments}
        activeSegmentId={draft.activeSegmentId}
        onSelectSegment={handleSelectSegment}
        surfaceRef={mapSurfaceRef}
        isCompact={isCompactViewport}
      />
    )
  } else if (draft.layoutMode === 'linear') {
    viewNode = (
      <LinearView
        topic={draft.topic}
        segments={draft.segments}
        activeSegmentId={draft.activeSegmentId}
        onSelectSegment={handleSelectSegment}
        surfaceRef={mapSurfaceRef}
        isCompact={isCompactViewport}
      />
    )
  }

  const viewLabel =
    draft.layoutMode === 'clock' ? 'Clock View' : draft.layoutMode === 'grid' ? 'Grid View' : 'Linear View'

  return (
    <AppShell inspectorOpen={hasSegments && isInspectorOpen}>
      <TopBar
        layoutMode={draft.layoutMode}
        canPresent={hasSegments}
        canExport={hasSegments}
        hasSegments={hasSegments}
        userEmail={session.user.email ?? ''}
        theme={theme}
        saveState={draft.currentMapId ? saveState : 'idle'}
        lastSavedAt={draft.currentMapId ? lastSavedAt : null}
        onLayoutChange={(mode) => setDraft((current) => ({ ...current, layoutMode: mode }))}
        onNewMap={handleReset}
        onPresent={handleOpenPresentation}
        onExportPdf={handleOpenExportDialog}
        onToggleTheme={toggleTheme}
        onOpenHistory={handleOpenHistory}
      />

      <div className="work">
        <div className="canvas">
          <div className="frame" ref={exportCaptureRef as never}>
            <div className="frame__head">
              <div>
                <p className="frame__kicker">{viewLabel}</p>
                <h2 className="frame__title">{hasSegments ? draft.topic : 'New memory map'}</h2>
              </div>
              <div className="frame__head-r">
                <span className="frame__meta">
                  {hasSegments ? `${draft.segments.length} anchors` : 'Awaiting text'}
                </span>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => setIsDrawerOpen(true)}
                  aria-label="Open source material"
                >
                  <Icon icon="tabler:file-text" width={16} height={16} />
                  <span className="max-md:hidden">Source</span>
                </button>
                {hasSegments ? (
                  <button
                    type="button"
                    className="btn btn--icon btn--ghost"
                    onClick={() => setIsInspectorOpen((o) => !o)}
                    aria-label="Toggle editor"
                  >
                    <Icon icon="tabler:edit" width={16} height={16} />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="frame__body">
              {hasSegments ? (
                <div className="view-surface" ref={mapSurfaceRef as never}>
                  <div className="view-body view-body--clock">{viewNode}</div>
                </div>
              ) : (
                <Compose
                  rawText={draft.rawText}
                  desiredSegmentCount={desiredSegmentCount}
                  isGenerating={isGenerating}
                  isGenerateBlocked={Boolean(generationValidationMessage)}
                  statusNote={
                    isGenerating
                      ? generationStatus
                      : generationValidationMessage ?? generationNote
                  }
                  onRawTextChange={(value) => setDraft((current) => ({ ...current, rawText: value }))}
                  onDesiredSegmentCountChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      desiredSegmentCount: normalizeUiSegmentCount(value, DEFAULT_SEGMENT_COUNT),
                    }))
                  }
                  onGenerate={handleGenerate}
                />
              )}
            </div>
          </div>

          {hasSegments ? (
            <div className="rail">
              <span>
                <b>{draft.segments.length}</b> anchors
              </span>
              <span className="dot" />
              <span>
                Active: <b>{activeSegment ? activeSegment.keyword : '—'}</b>
              </span>
              <span className="dot" />
              <span>
                View: <b>{draft.layoutMode}</b>
              </span>
              <span className="dot" />
              <span>
                <b>Synced</b> across all views
              </span>
            </div>
          ) : null}
        </div>

        {hasSegments ? (
          <Inspector
            segments={draft.segments}
            activeSegmentId={draft.activeSegmentId}
            onSelect={handleSelectSegment}
            onClose={() => setIsInspectorOpen(false)}
            onKeywordChange={(id, keyword) =>
              setDraft((current) => ({
                ...current,
                segments: current.segments.map((s) =>
                  s.id === id ? { ...s, keyword: keyword.trim() || s.keyword } : s,
                ),
              }))
            }
            onTextChange={(id, text) =>
              setDraft((current) => ({
                ...current,
                segments: current.segments.map((s) =>
                  s.id === id ? { ...s, text, preview: createPreview(text) } : s,
                ),
              }))
            }
            onIconChange={(id, icon) =>
              setDraft((current) => ({
                ...current,
                segments: current.segments.map((s) => (s.id === id ? { ...s, icon } : s)),
              }))
            }
            onMove={(id, direction) =>
              setDraft((current) => ({
                ...current,
                segments: moveSegment(current.segments, id, direction),
              }))
            }
          />
        ) : null}
      </div>

      <SourceDrawer
        open={isDrawerOpen}
        topic={draft.topic}
        rawText={draft.rawText}
        desiredSegmentCount={desiredSegmentCount}
        isGenerating={isGenerating}
        isGenerateBlocked={Boolean(generationValidationMessage)}
        statusNote={isGenerating ? generationStatus : generationValidationMessage ?? generationNote}
        onClose={() => setIsDrawerOpen(false)}
        onTopicChange={(value) => setDraft((current) => ({ ...current, topic: sanitizeTopicInput(value) }))}
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

      <HistoryDrawer
        open={isHistoryDrawerOpen}
        maps={savedMaps}
        isLoading={isLoadingMaps}
        error={mapsError}
        currentMapId={draft.currentMapId}
        onClose={() => setIsHistoryDrawerOpen(false)}
        onOpen={handleOpenMap}
        onRename={handleRenameMap}
        onDuplicate={handleDuplicateMap}
        onDelete={handleDeleteMap}
        onNewMap={() => {
          setIsHistoryDrawerOpen(false)
          handleReset()
        }}
      />

      {pendingReplace ? (
        <>
          <div
            className="export-dialog-backdrop"
            onClick={handleCancelReplace}
            aria-hidden="true"
          />
          <div
            className="export-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Unsaved map"
          >
            <div className="export-dialog__head">
              <p className="panel-kicker">Unsaved map</p>
              <h3>Replace current map?</h3>
            </div>
            <p className="meta-text">
              Your current map hasn&apos;t been saved to your history yet.
              {pendingReplace.kind === 'open'
                ? ' Opening a saved map will discard it.'
                : ' Starting a new map will discard it.'}
            </p>
            <div className="panel-actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleCancelReplace}
              >
                Keep editing
              </button>
              <button
                type="button"
                className="btn btn--accent"
                onClick={handleConfirmReplace}
              >
                Discard &amp; continue
              </button>
            </div>
          </div>
        </>
      ) : null}

      {isExportDialogOpen ? (
        <>
          <div
            className="export-dialog-backdrop"
            onClick={() => setIsExportDialogOpen(false)}
            aria-hidden="true"
          />
          <div className="export-dialog" role="dialog" aria-modal="true" aria-label="Export PDF">
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

            <p className="meta-text">
              Download a PDF of your current map card with the live visual style and node positions.
            </p>

            <div className="panel-actions">
              <button
                type="button"
                className="btn btn--ghost"
                disabled={isExportingPdf}
                onClick={() => setIsExportDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--accent"
                disabled={isExportingPdf}
                onClick={handleConfirmExport}
              >
                {isExportingPdf ? 'Downloading…' : 'Download PDF'}
              </button>
            </div>
          </div>
        </>
      ) : null}

      <PresentationMode
        ref={presentationModeRef}
        isOpen={presentation.isOpen}
        topic={draft.topic}
        segments={draft.segments}
        currentIndex={presentation.isOpen ? activeIndex : presentation.index}
        mode={presentation.mode}
        isCompact={isCompactViewport}
        onClose={handleClosePresentation}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />

      {toast ? (
        <div
          className="fixed left-1/2 bottom-6 z-90 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-[DM_Mono]"
          style={{
            background: 'var(--surface)',
            color: 'var(--text-main)',
            border: '1px solid var(--outline-mid)',
            boxShadow: 'var(--shadow-panel)',
          }}
        >
          {toast}
        </div>
      ) : null}
    </AppShell>
  )
}

export default App
