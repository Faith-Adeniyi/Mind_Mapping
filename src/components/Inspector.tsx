import { Icon } from '@iconify/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { loadIconSourceData, searchIconOptions, type IconSource, type IconSourceData } from '../data/iconLibrary'
import type { Segment } from '../types'
import { IconGlyph } from './IconGlyph'

type Direction = 'up' | 'down'

type InspectorProps = {
  segments: Segment[]
  activeSegmentId: string | null
  onSelect: (id: string) => void
  onClose: () => void
  onKeywordChange: (id: string, keyword: string) => void
  onTextChange: (id: string, text: string) => void
  onIconChange: (id: string, icon: string) => void
  onMove: (id: string, direction: Direction) => void
}

const ICON_SOURCE_LABELS: Record<IconSource, string> = {
  emoji: 'Emoji',
  symbol: 'Symbols',
}

const FALLBACK_CATEGORY = 'General'

export function Inspector({
  segments,
  activeSegmentId,
  onSelect,
  onClose,
  onKeywordChange,
  onTextChange,
  onIconChange,
  onMove,
}: InspectorProps) {
  const idx = segments.findIndex((s) => s.id === activeSegmentId)
  const seg = idx >= 0 ? segments[idx] : null

  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [activeSource, setActiveSource] = useState<IconSource>('emoji')
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>(FALLBACK_CATEGORY)
  const [iconDataBySource, setIconDataBySource] = useState<Partial<Record<IconSource, IconSourceData>>>({})
  const [pickerLoadError, setPickerLoadError] = useState<string | null>(null)
  const [pickerReloadKey, setPickerReloadKey] = useState(0)
  const pickerRef = useRef<HTMLDivElement | null>(null)
  const activeSourceData = iconDataBySource[activeSource]

  useEffect(() => {
    if (!isPickerOpen || activeSourceData) return
    let cancelled = false
    loadIconSourceData(activeSource)
      .then((data) => {
        if (cancelled) return
        setIconDataBySource((current) => (current[activeSource] ? current : { ...current, [activeSource]: data }))
      })
      .catch(() => {
        if (!cancelled) setPickerLoadError(`Could not load ${ICON_SOURCE_LABELS[activeSource].toLowerCase()} icons.`)
      })
    return () => {
      cancelled = true
    }
  }, [activeSource, activeSourceData, isPickerOpen, pickerReloadKey])

  const filteredOptions = useMemo(
    () => searchIconOptions(activeSourceData?.options ?? [], query),
    [activeSourceData, query],
  )

  const categories = useMemo(() => {
    const all = activeSourceData?.categories ?? []
    if (!query.trim()) return all
    return all.filter((c) => filteredOptions.some((o) => o.category === c))
  }, [activeSourceData, filteredOptions, query])

  const selectedCategory = categories.includes(activeCategory) ? activeCategory : categories[0] ?? FALLBACK_CATEGORY
  const visibleOptions = useMemo(() => {
    if (query.trim()) return filteredOptions
    return filteredOptions.filter((o) => o.category === selectedCategory)
  }, [filteredOptions, query, selectedCategory])

  const isPickerLoading = isPickerOpen && !activeSourceData && !pickerLoadError
  const shouldShowLoadError = !isPickerLoading && !activeSourceData && Boolean(pickerLoadError)

  if (!seg) {
    return (
      <aside className="insp">
        <div className="insp__head">
          <h3>Anchors</h3>
          <button type="button" className="btn btn--icon btn--ghost" onClick={onClose} aria-label="Close inspector">
            <Icon icon="tabler:x" width={16} height={16} />
          </button>
        </div>
        <div className="insp__body">
          <p className="meta-text">Select an anchor to edit it.</p>
          <div className="fld">
            <label className="fld__lab">All anchors</label>
            <div className="seglist">
              {segments.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="segrow"
                  onClick={() => onSelect(s.id)}
                >
                  <span className="segrow__n">{String(s.order).padStart(2, '0')}</span>
                  <IconGlyph value={s.icon} className="segrow__icon" />
                  <span className="segrow__kw">{s.keyword}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="insp">
      <div className="insp__head">
        <h3>Edit anchor</h3>
        <button type="button" className="btn btn--icon btn--ghost" onClick={onClose} aria-label="Close inspector">
          <Icon icon="tabler:x" width={16} height={16} />
        </button>
      </div>

      <div className="insp__body">
        <div className="insp__nav">
          <button
            type="button"
            className="btn btn--ghost"
            disabled={idx <= 0}
            onClick={() => segments[idx - 1] && onSelect(segments[idx - 1].id)}
          >
            <Icon icon="tabler:chevron-left" width={16} height={16} />
            Prev
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={idx >= segments.length - 1}
            onClick={() => segments[idx + 1] && onSelect(segments[idx + 1].id)}
          >
            Next
            <Icon icon="tabler:chevron-right" width={16} height={16} />
          </button>
        </div>

        <p className="insp__order">
          Anchor {idx + 1} of {segments.length}
        </p>

        <div className="fld">
          <label className="fld__lab" htmlFor="insp-keyword">Keyword</label>
          <input
            id="insp-keyword"
            value={seg.keyword}
            onChange={(e) => onKeywordChange(seg.id, e.target.value)}
          />
        </div>

        <div className="fld">
          <label className="fld__lab">Icon</label>
          <div className="icrow">
            <span className="icbtn"><IconGlyph value={seg.icon} /></span>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                setIsPickerOpen((open) => {
                  const next = !open
                  if (next) {
                    setPickerLoadError(null)
                    setPickerReloadKey((k) => k + 1)
                  }
                  return next
                })
              }}
              aria-expanded={isPickerOpen}
            >
              <Icon icon="tabler:wand" width={16} height={16} />
              {isPickerOpen ? 'Close picker' : 'Pick icon'}
            </button>
          </div>

          {isPickerOpen ? (
            <div ref={pickerRef} className="icon-picker-panel" role="dialog" aria-label="Icon picker">
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
              </div>

              <label className="icon-picker-search">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={`Search ${ICON_SOURCE_LABELS[activeSource].toLowerCase()}…`}
                  disabled={!activeSourceData}
                />
              </label>

              {isPickerLoading ? <p className="empty-text">Loading icons…</p> : null}

              {shouldShowLoadError ? (
                <div className="icon-picker-error">
                  <p className="empty-text">{pickerLoadError}</p>
                  <button
                    type="button"
                    className="icon-picker-retry"
                    onClick={() => {
                      setPickerLoadError(null)
                      setPickerReloadKey((k) => k + 1)
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
                        className={`icon-grid__item ${seg.icon === option.glyph ? 'is-active' : ''}`}
                        onClick={() => {
                          onIconChange(seg.id, option.glyph)
                          setIsPickerOpen(false)
                        }}
                        title={`${option.label} (${option.category})`}
                      >
                        <IconGlyph value={option.glyph} className="icon-grid__glyph" />
                      </button>
                    ))}
                  </div>

                  {visibleOptions.length === 0 ? <p className="empty-text">No icons matched.</p> : null}
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="fld">
          <label className="fld__lab" htmlFor="insp-text">Source text</label>
          <textarea
            id="insp-text"
            value={seg.text}
            onChange={(e) => onTextChange(seg.id, e.target.value)}
          />
        </div>

        <div className="insp__nav">
          <button
            type="button"
            className="btn btn--ghost"
            disabled={idx <= 0}
            onClick={() => onMove(seg.id, 'up')}
          >
            <Icon icon="tabler:arrow-up" width={16} height={16} />
            Move up
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={idx >= segments.length - 1}
            onClick={() => onMove(seg.id, 'down')}
          >
            <Icon icon="tabler:arrow-down" width={16} height={16} />
            Move down
          </button>
        </div>

        <div className="fld">
          <label className="fld__lab">All anchors</label>
          <div className="seglist">
            {segments.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`segrow ${s.id === activeSegmentId ? 'on' : ''}`}
                onClick={() => onSelect(s.id)}
              >
                <span className="segrow__n">{String(s.order).padStart(2, '0')}</span>
                <IconGlyph value={s.icon} className="segrow__icon" />
                <span className="segrow__kw">{s.keyword}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
