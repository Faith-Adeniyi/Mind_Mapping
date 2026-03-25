import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { AppShell } from './components/AppShell'
import { ClockRail } from './components/ClockRail'
import { EditorPanel } from './components/EditorPanel'
import { InputPanel } from './components/InputPanel'
import { PresentationMode } from './components/PresentationMode'
import { TopBar } from './components/TopBar'
import { assignIcon } from './utils/assignIcon'
import { clearDraft, loadDraft, saveDraft } from './utils/storage'
import { createPreview } from './utils/segmentPreview'
import { extractKeyword } from './utils/extractKeyword'
import { combineSegments, parseTextIntoSegments, splitLongSegments } from './utils/segmentText'
import type { DraftState, Segment } from './types'

const DEFAULT_TITLE = 'ClockRail'
const DEFAULT_SUBTITLE = 'Visual memory mapping for presentations'
const MAX_SEGMENTS = 12
const MIN_SEGMENTS = 4
const INITIAL_WIDTH = 960
const SEGMENT_LIBRARY = [
  'Welcome to the map',
  'Key idea one',
  'Key idea two',
  'Key idea three',
  'Key idea four',
  'Key idea five',
  'Key idea six',
  'Key idea seven',
]
const ICONS = ['👋', '🎯', '🧭', '💡', '📌', '🚀', '📊', '⭐', '🗺️', '📚', '⚡', '🎉']

function buildSegments(text: string): Segment[] {
  const parsedSegments = parseTextIntoSegments(text)
  const limitedSegments = combineSegments(parsedSegments, MAX_SEGMENTS)
  const normalizedSegments = splitLongSegments(limitedSegments, MIN_SEGMENTS)

  return normalizedSegments.map((segmentText, index) => {
    const keyword = extractKeyword(segmentText)
    const icon = assignIcon(segmentText)
    const tones = ['indigo', 'pink', 'amber', 'emerald', 'cyan']

    return {
      id: index + 1,
      text: segmentText,
      keyword,
      icon,
      preview: createPreview(segmentText),
      tone: tones[index % tones.length],
    }
  })
}

function makeEmptySegment(nextId: number): Segment {
  const template = SEGMENT_LIBRARY[nextId % SEGMENT_LIBRARY.length] ?? 'New card'
  return {
    id: nextId,
    text: template,
    keyword: `Card ${nextId}`,
    icon: ICONS[nextId % ICONS.length] ?? '📌',
    preview: createPreview(template),
    tone: ['indigo', 'pink', 'amber', 'emerald', 'cyan'][nextId % 5],
  }
}

function createDefaultDraft(): DraftState {
  return {
    title: DEFAULT_TITLE,
    subtitle: DEFAULT_SUBTITLE,
    rawText: '',
    segments: [],
    activeIndex: 0,
    presentation: {
      isOpen: false,
      currentIndex: 0,
      isFullscreen: false,
    },
  }
}

function App() {
  const [draft, setDraft] = useState<DraftState>(() => {
    const storedDraft = loadDraft()
    return storedDraft ?? createDefaultDraft()
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [width, setWidth] = useState(() => Math.min(window.innerWidth - 48, INITIAL_WIDTH))
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)

  useEffect(() => {
    const nextWidth = Math.min(window.innerWidth - 48, INITIAL_WIDTH)
    setWidth(nextWidth)

    const handleResize = () => {
      setWidth(Math.min(window.innerWidth - 48, INITIAL_WIDTH))
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    saveDraft(draft)
  }, [draft])

  const hasSegments = draft.segments.length > 0
  const activeIndex = Math.min(draft.activeIndex, Math.max(draft.segments.length - 1, 0))
  const currentPresentationIndex = Math.min(
    draft.presentation.currentIndex,
    Math.max(draft.segments.length - 1, 0),
  )

  const characterCount = useMemo(() => draft.rawText.length, [draft.rawText])

  const handleGenerate = () => {
    if (!draft.rawText.trim()) {
      return
    }

    setIsGenerating(true)

    window.setTimeout(() => {
      const generatedSegments = buildSegments(draft.rawText)
      const nextTitle = draft.title || DEFAULT_TITLE
      const nextSubtitle = draft.subtitle || DEFAULT_SUBTITLE

      setDraft((current) => ({
        ...current,
        title: nextTitle,
        subtitle: nextSubtitle,
        segments: generatedSegments,
        activeIndex: 0,
        presentation: {
          ...current.presentation,
          isOpen: false,
          currentIndex: 0,
        },
      }))

      setIsGenerating(false)
    }, 250)
  }

  const handleReset = () => {
    clearDraft()
    setDraft(createDefaultDraft())
  }

  const handleOpenPresentation = () => {
    if (!hasSegments) {
      return
    }

    setDraft((current) => ({
      ...current,
      presentation: {
        ...current.presentation,
        isOpen: true,
        currentIndex: current.activeIndex,
      },
    }))
  }

  const handleClosePresentation = () => {
    setDraft((current) => ({
      ...current,
      presentation: {
        ...current.presentation,
        isOpen: false,
      },
    }))
  }

  const handlePrevious = () => {
    setDraft((current) => {
      const nextIndex = Math.max(current.presentation.currentIndex - 1, 0)
      return {
        ...current,
        presentation: {
          ...current.presentation,
          currentIndex: nextIndex,
        },
        activeIndex: nextIndex,
      }
    })
  }

  const handleNext = () => {
    setDraft((current) => {
      const nextIndex = Math.min(current.presentation.currentIndex + 1, current.segments.length - 1)
      return {
        ...current,
        presentation: {
          ...current.presentation,
          currentIndex: nextIndex,
        },
        activeIndex: nextIndex,
      }
    })
  }

  const handleSegmentSelect = (index: number) => {
    setDraft((current) => ({
      ...current,
      activeIndex: index,
      presentation: {
        ...current.presentation,
        currentIndex: index,
      },
    }))
  }

  const handleTitleChange = (value: string) => {
    setDraft((current) => ({ ...current, title: value }))
  }

  const handleSubtitleChange = (value: string) => {
    setDraft((current) => ({ ...current, subtitle: value }))
  }

  const handleSegmentKeywordChange = (index: number, value: string) => {
    setDraft((current) => ({
      ...current,
      segments: current.segments.map((segment, segmentIndex) =>
        segmentIndex === index ? { ...segment, keyword: value } : segment,
      ),
    }))
  }

  const handleSegmentTextChange = (index: number, value: string) => {
    setDraft((current) => ({
      ...current,
      segments: current.segments.map((segment, segmentIndex) =>
        segmentIndex === index
          ? {
              ...segment,
              text: value,
              preview: createPreview(value),
            }
          : segment,
      ),
    }))
  }

  const handleCycleIcon = (index: number) => {
    setDraft((current) => ({
      ...current,
      segments: current.segments.map((segment, segmentIndex) => {
        if (segmentIndex !== index) {
          return segment
        }

        const currentIconIndex = ICONS.indexOf(segment.icon)
        const nextIcon = ICONS[(currentIconIndex + 1) % ICONS.length] ?? ICONS[0]

        return {
          ...segment,
          icon: nextIcon,
        }
      }),
    }))
  }

  const reindexSegments = (segments: Segment[]) =>
    segments.map((segment, index) => ({
      ...segment,
      id: index + 1,
      keyword: segment.keyword || `Card ${index + 1}`,
    }))

  const handleAddSegment = () => {
    setDraft((current) => {
      const nextSegments = reindexSegments([...current.segments, makeEmptySegment(current.segments.length + 1)])
      return {
        ...current,
        segments: nextSegments,
        activeIndex: nextSegments.length - 1,
        presentation: {
          ...current.presentation,
          currentIndex: nextSegments.length - 1,
        },
      }
    })
  }

  const handleRemoveSegment = (index: number) => {
    setDraft((current) => {
      const nextSegments = current.segments.filter((_, segmentIndex) => segmentIndex !== index)
      const reindexed = reindexSegments(nextSegments)
      const nextActiveIndex = Math.max(0, Math.min(index, reindexed.length - 1))

      return {
        ...current,
        segments: reindexed,
        activeIndex: nextActiveIndex,
        presentation: {
          ...current.presentation,
          currentIndex: nextActiveIndex,
        },
      }
    })
  }

  const handleToggleFullscreen = () => {
    setIsMapFullscreen((current) => !current)
  }

  const handleExitMapFullscreen = () => {
    setIsMapFullscreen(false)
  }

  return (
    <AppShell>
      <TopBar onOpenPresentation={handleOpenPresentation} onReset={handleReset} canPresent={hasSegments} />

      <main className={`app-layout ${isMapFullscreen ? 'app-layout--map-fullscreen' : ''}`}>
        {!isMapFullscreen ? (
          <section className="app-layout__left">
            <InputPanel
              value={draft.rawText}
              onChange={(value) => setDraft((current) => ({ ...current, rawText: value }))}
              onGenerate={handleGenerate}
              onReset={handleReset}
              isGenerating={isGenerating}
              characterCount={characterCount}
            />

            <EditorPanel
              title={draft.title}
              subtitle={draft.subtitle}
              segments={draft.segments}
              activeIndex={activeIndex}
              onTitleChange={handleTitleChange}
              onSubtitleChange={handleSubtitleChange}
              onSegmentKeywordChange={handleSegmentKeywordChange}
              onSegmentTextChange={handleSegmentTextChange}
              onCycleIcon={handleCycleIcon}
            />
          </section>
        ) : null}

        <section className={`app-layout__right ${isMapFullscreen ? 'app-layout__right--fullscreen' : ''}`}>
          <ClockRail
            title={draft.title}
            subtitle={draft.subtitle}
            segments={draft.segments}
            activeIndex={activeIndex}
            onSegmentSelect={handleSegmentSelect}
            onSegmentRemove={handleRemoveSegment}
            onAddSegment={handleAddSegment}
            onToggleFullscreen={handleToggleFullscreen}
            onExitFullscreen={handleExitMapFullscreen}
            isFullscreen={isMapFullscreen}
            showRemoveControl={draft.presentation.isOpen}
            width={width}
          />
        </section>
      </main>

      <PresentationMode
        isOpen={draft.presentation.isOpen}
        title={draft.title}
        subtitle={draft.subtitle}
        segments={draft.segments}
        currentIndex={currentPresentationIndex}
        onClose={handleClosePresentation}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </AppShell>
  )
}

export default App
