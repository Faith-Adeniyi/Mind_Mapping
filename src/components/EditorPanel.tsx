import { useEffect, useMemo, useRef, useState } from 'react'
import { loadIconSourceData, searchIconOptions, type IconSource, type IconSourceData } from '../data/iconLibrary'
import type { Segment } from '../types'
import { IconGlyph } from './IconGlyph'

type MoveDirection = 'up' | 'down'

type EditorPanelProps = {
  topic: string
  segments: Segment[]
  activeSegmentId: string | null
  onTopicChange: (value: string) => void
  onSelectSegment: (segmentId: string) => void
  onSegmentKeywordChange: (segmentId: string, keyword: string) => void
  onSegmentTextChange: (segmentId: string, text: string) => void
  onSegmentIconSelect: (segmentId: string, icon: string) => void
  onReorderSegment: (draggedSegmentId: string, targetSegmentId: string) => void
  onMoveSegment: (segmentId: string, direction: MoveDirection) => void
}

const ICON_SOURCE_LABELS: Record<IconSource, string> = {
  emoji: 'Emoji',
  symbol: 'Symbols',
}

const FALLBACK_CATEGORY = 'General'
const ICON_GRID_SKELETON_COUNT = 54
const MOVE_UP_GLYPH = '\u2191'
const MOVE_DOWN_GLYPH = '\u2193'
const DRAG_HANDLE_GLYPH = '\u22EE\u22EE'
const MOBILE_PICKER_BREAKPOINT = 1180
const DESKTOP_PICKER_WIDTH = 560
const DESKTOP_PICKER_MIN_WIDTH = 420
const DESKTOP_PICKER_MAX_WIDTH = 640
const DESKTOP_PICKER_MIN_HEIGHT = 300
const DESKTOP_PICKER_MAX_HEIGHT = 680
const PICKER_VIEWPORT_GUTTER = 12
const PICKER_VERTICAL_GAP = 10

type PickerDesktopLayout = {
  left: number
  top: number
  width: number
  maxHeight: number
}

export function EditorPanel({
  topic,
  segments,
  activeSegmentId,
  onTopicChange,
  onSelectSegment,
  onSegmentKeywordChange,
  onSegmentTextChange,
  onSegmentIconSelect,
  onReorderSegment,
  onMoveSegment,
}: EditorPanelProps) {
  const activeSegment = segments.find((segment) => segment.id === activeSegmentId) ?? null
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [activeSource, setActiveSource] = useState<IconSource>('emoji')
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>(FALLBACK_CATEGORY)
  const [iconDataBySource, setIconDataBySource] = useState<Partial<Record<IconSource, IconSourceData>>>({})
  const [pickerLoadError, setPickerLoadError] = useState<string | null>(null)
  const [pickerLoadRequestKey, setPickerLoadRequestKey] = useState(0)
  const [draggedSegmentId, setDraggedSegmentId] = useState<string | null>(null)
  const [desktopPickerLayout, setDesktopPickerLayout] = useState<PickerDesktopLayout | null>(null)
  const pickerRef = useRef<HTMLDivElement | null>(null)
  const pickerTriggerRef = useRef<HTMLButtonElement | null>(null)
  const activeSourceData = iconDataBySource[activeSource]

  useEffect(() => {
    if (!isPickerOpen) {
      return undefined
    }

    const updateDesktopPickerLayout = () => {
      if (!pickerTriggerRef.current) {
        return
      }

      if (window.innerWidth <= MOBILE_PICKER_BREAKPOINT) {
        setDesktopPickerLayout(null)
        return
      }

      const triggerRect = pickerTriggerRef.current.getBoundingClientRect()
      const maxViewportWidth = Math.max(0, window.innerWidth - PICKER_VIEWPORT_GUTTER * 2)
      const width = Math.min(
        DESKTOP_PICKER_MAX_WIDTH,
        Math.max(Math.min(DESKTOP_PICKER_MIN_WIDTH, maxViewportWidth), Math.min(DESKTOP_PICKER_WIDTH, maxViewportWidth)),
      )

      const desiredMaxHeight = Math.min(DESKTOP_PICKER_MAX_HEIGHT, Math.floor(window.innerHeight * 0.78))
      const belowTop = triggerRect.bottom + PICKER_VERTICAL_GAP
      const availableBelow = window.innerHeight - belowTop - PICKER_VIEWPORT_GUTTER

      let top = belowTop
      let maxHeight = Math.min(desiredMaxHeight, availableBelow)

      if (maxHeight < DESKTOP_PICKER_MIN_HEIGHT) {
        const availableAbove = triggerRect.top - PICKER_VERTICAL_GAP - PICKER_VIEWPORT_GUTTER

        if (availableAbove > availableBelow) {
          maxHeight = Math.min(desiredMaxHeight, Math.max(DESKTOP_PICKER_MIN_HEIGHT, availableAbove))
          top = Math.max(PICKER_VIEWPORT_GUTTER, triggerRect.top - PICKER_VERTICAL_GAP - maxHeight)
        } else {
          maxHeight = Math.max(DESKTOP_PICKER_MIN_HEIGHT, Math.min(desiredMaxHeight, availableBelow))
          top = Math.min(Math.max(PICKER_VIEWPORT_GUTTER, belowTop), window.innerHeight - PICKER_VIEWPORT_GUTTER - maxHeight)
        }
      }

      let left = triggerRect.left
      left = Math.max(PICKER_VIEWPORT_GUTTER, left)
      left = Math.min(left, window.innerWidth - PICKER_VIEWPORT_GUTTER - width)

      setDesktopPickerLayout((current) => {
        if (
          current &&
          Math.abs(current.left - left) < 1 &&
          Math.abs(current.top - top) < 1 &&
          Math.abs(current.width - width) < 1 &&
          Math.abs(current.maxHeight - maxHeight) < 1
        ) {
          return current
        }

        return {
          left,
          top,
          width,
          maxHeight,
        }
      })
    }

    updateDesktopPickerLayout()
    window.addEventListener('resize', updateDesktopPickerLayout)
    window.addEventListener('scroll', updateDesktopPickerLayout, true)

    return () => {
      window.removeEventListener('resize', updateDesktopPickerLayout)
      window.removeEventListener('scroll', updateDesktopPickerLayout, true)
    }
  }, [isPickerOpen])

  useEffect(() => {
    if (!isPickerOpen) {
      return undefined
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!pickerRef.current) {
        return
      }

      const targetNode = event.target as Node
      const clickedInsidePicker = pickerRef.current.contains(targetNode)
      const clickedTrigger = pickerTriggerRef.current?.contains(targetNode) ?? false

      if (!clickedInsidePicker && !clickedTrigger) {
        setIsPickerOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPickerOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isPickerOpen])

  useEffect(() => {
    if (!isPickerOpen || activeSourceData) {
      return undefined
    }

    let cancelled = false

    loadIconSourceData(activeSource)
      .then((sourceData) => {
        if (cancelled) {
          return
        }

        setIconDataBySource((current) => {
          if (current[activeSource]) {
            return current
          }

          return {
            ...current,
            [activeSource]: sourceData,
          }
        })
      })
      .catch(() => {
        if (!cancelled) {
          setPickerLoadError(`Could not load ${ICON_SOURCE_LABELS[activeSource].toLowerCase()} icons.`)
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeSource, activeSourceData, isPickerOpen, pickerLoadRequestKey])
  const filteredOptions = useMemo(
    () => searchIconOptions(activeSourceData?.options ?? [], query),
    [activeSourceData, query],
  )

  const categories = useMemo(() => {
    const sourceCategories = activeSourceData?.categories ?? []

    if (!query.trim()) {
      return sourceCategories
    }

    return sourceCategories.filter((category) =>
      filteredOptions.some((option) => option.category === category),
    )
  }, [activeSourceData, filteredOptions, query])

  const selectedCategory = categories.includes(activeCategory) ? activeCategory : (categories[0] ?? FALLBACK_CATEGORY)

  const visibleOptions = useMemo(() => {
    if (query.trim()) {
      return filteredOptions
    }

    return filteredOptions.filter((option) => option.category === selectedCategory)
  }, [filteredOptions, query, selectedCategory])

  const isPickerLoading = isPickerOpen && !activeSourceData && !pickerLoadError
  const shouldShowLoadError = !isPickerLoading && !activeSourceData && Boolean(pickerLoadError)

  return (
    <section className="workspace-panel glass-panel">
      <div className="panel-head">
        <p className="panel-kicker">Refine</p>
        <h2>Segment Editor</h2>
      </div>

      <label className="field">
        <span className="field__label">Main topic</span>
        <input
          className="field__control"
          value={topic}
          onChange={(event) => onTopicChange(event.target.value)}
          placeholder="Project Presentation"
        />
      </label>

      <div className="segment-strip" role="tablist" aria-label="Segments">
        {segments.map((segment, index) => {
          const isActive = segment.id === activeSegmentId

          return (
            <div
              key={segment.id}
              className={`segment-chip ${isActive ? 'is-active' : ''} ${draggedSegmentId === segment.id ? 'is-dragging' : ''}`}
              role="tab"
              aria-selected={isActive}
              draggable
              onDragStart={(event) => {
                setDraggedSegmentId(segment.id)
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', segment.id)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
              }}
              onDrop={(event) => {
                event.preventDefault()
                const sourceId = event.dataTransfer.getData('text/plain') || draggedSegmentId
                if (sourceId && sourceId !== segment.id) {
                  onReorderSegment(sourceId, segment.id)
                }
                setDraggedSegmentId(null)
              }}
              onDragEnd={() => setDraggedSegmentId(null)}
            >
              <button type="button" className="segment-chip__main" onClick={() => onSelectSegment(segment.id)}>
                <span>{String(segment.order).padStart(2, '0')}</span>
                <IconGlyph value={segment.icon} className="segment-chip__icon" />
                <span>{segment.keyword}</span>
              </button>

              <div className="segment-chip__controls">
                <button
                  type="button"
                  className="segment-chip__ctrl"
                  onClick={() => onMoveSegment(segment.id, 'up')}
                  disabled={index === 0}
                  aria-label={`Move ${segment.keyword} up`}
                >
                  {MOVE_UP_GLYPH}
                </button>
                <button
                  type="button"
                  className="segment-chip__ctrl"
                  onClick={() => onMoveSegment(segment.id, 'down')}
                  disabled={index === segments.length - 1}
                  aria-label={`Move ${segment.keyword} down`}
                >
                  {MOVE_DOWN_GLYPH}
                </button>
                <span className="segment-chip__drag-handle" aria-hidden="true">
                  {DRAG_HANDLE_GLYPH}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {activeSegment ? (
        <div className="editor-card">
          <div className="editor-card__head">
            <p className="meta-text">Active Segment {String(activeSegment.order).padStart(2, '0')}</p>
            <button
              type="button"
              className="icon-picker-trigger"
              ref={pickerTriggerRef}
              onClick={() =>
                setIsPickerOpen((current) => {
                  const next = !current

                  if (next) {
                    setPickerLoadError(null)
                    setPickerLoadRequestKey((request) => request + 1)
                  }

                  return next
                })
              }
              aria-expanded={isPickerOpen}
            >
              <IconGlyph value={activeSegment.icon} className="icon-picker-trigger__icon" />
              <span>Pick Icon</span>
            </button>
          </div>

          {isPickerOpen ? <div className="icon-picker-backdrop" aria-hidden="true" /> : null}

          {isPickerOpen ? (
            <div
              ref={pickerRef}
              className={`icon-picker-panel ${desktopPickerLayout ? 'is-floating' : ''}`}
              role="dialog"
              aria-label="Icon Picker"
              style={
                desktopPickerLayout
                  ? {
                      left: `${desktopPickerLayout.left}px`,
                      top: `${desktopPickerLayout.top}px`,
                      width: `${desktopPickerLayout.width}px`,
                      maxHeight: `${desktopPickerLayout.maxHeight}px`,
                    }
                  : undefined
              }
            >
              <div className="icon-picker-panel__head">
                <div className="icon-source-tabs" role="tablist" aria-label="Icon sources">
                  {(Object.keys(ICON_SOURCE_LABELS) as IconSource[]).map((source) => (
                    <button
                      key={source}
                      type="button"
                      className={`icon-source-tab ${activeSource === source ? 'is-active' : ''}`}
                      role="tab"
                      aria-selected={activeSource === source}
                      onClick={() => {
                        setActiveSource(source)
                        setPickerLoadError(null)
                        setActiveCategory(iconDataBySource[source]?.categories[0] ?? FALLBACK_CATEGORY)
                      }}
                    >
                      {ICON_SOURCE_LABELS[source]}
                    </button>
                  ))}
                </div>
                <button type="button" className="icon-picker-close" onClick={() => setIsPickerOpen(false)}>
                  Close
                </button>
              </div>

              <label className="icon-picker-search">
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${ICON_SOURCE_LABELS[activeSource].toLowerCase()}...`}
                  disabled={!activeSourceData}
                />
              </label>

              {isPickerLoading ? (
                <div className="icon-picker-loading" role="status" aria-live="polite">
                  <div className="icon-category-strip">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <span key={`category-skeleton-${index}`} className="icon-category-pill icon-category-pill--skeleton" />
                    ))}
                  </div>
                  <div className="icon-grid icon-grid--skeleton" aria-hidden="true">
                    {Array.from({ length: ICON_GRID_SKELETON_COUNT }).map((_, index) => (
                      <span key={`icon-skeleton-${index}`} className="icon-grid__item icon-grid__item--skeleton" />
                    ))}
                  </div>
                  <p className="empty-text">Loading icons...</p>
                </div>
              ) : null}

              {shouldShowLoadError ? (
                <div className="icon-picker-error">
                  <p className="empty-text">{pickerLoadError}</p>
                  <button
                    type="button"
                    className="icon-picker-retry"
                    onClick={() => {
                      setPickerLoadError(null)
                      setPickerLoadRequestKey((current) => current + 1)
                    }}
                  >
                    Retry
                  </button>
                </div>
              ) : null}

              {activeSourceData ? (
                <>
                  <div className="icon-category-strip">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        className={`icon-category-pill ${selectedCategory === category ? 'is-active' : ''}`}
                        onClick={() => setActiveCategory(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>

                  <div className="icon-grid" role="list" aria-label="Icon options">
                    {visibleOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`icon-grid__item ${activeSegment.icon === option.glyph ? 'is-active' : ''}`}
                        onClick={() => {
                          onSegmentIconSelect(activeSegment.id, option.glyph)
                          setIsPickerOpen(false)
                        }}
                        title={`${option.label} (${option.category})`}
                      >
                        <IconGlyph value={option.glyph} className="icon-grid__glyph" />
                      </button>
                    ))}
                  </div>

                  {visibleOptions.length === 0 ? <p className="empty-text">No icons matched your search.</p> : null}
                </>
              ) : null}
            </div>
          ) : null}

          <label className="field">
            <span className="field__label">Keyword (1-3 words)</span>
            <input
              className="field__control"
              value={activeSegment.keyword}
              onChange={(event) => onSegmentKeywordChange(activeSegment.id, event.target.value)}
            />
          </label>

          <label className="field">
            <span className="field__label">Segment details</span>
            <textarea
              className="field__control field__control--textarea field__control--tight"
              value={activeSegment.text}
              onChange={(event) => onSegmentTextChange(activeSegment.id, event.target.value)}
            />
          </label>
        </div>
      ) : (
        <p className="empty-text">Generate a map to edit segments.</p>
      )}
    </section>
  )
}
