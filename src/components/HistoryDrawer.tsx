import { Icon } from '@iconify/react'
import { useState } from 'react'
import type { SavedMindMap } from '../types'
import { sanitizeTopicInput } from '../utils/inputValidation'

type Props = {
  open: boolean
  maps: SavedMindMap[]
  isLoading: boolean
  error: string | null
  currentMapId: string | null
  onClose: () => void
  onOpen: (id: string) => void
  onRename: (id: string, topic: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onNewMap: () => void
}

function formatRelative(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms) || ms < 0) return new Date(iso).toLocaleDateString()
  const s = Math.floor(ms / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

export function HistoryDrawer({
  open,
  maps,
  isLoading,
  error,
  currentMapId,
  onClose,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onNewMap,
}: Props) {
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const startRename = (map: SavedMindMap) => {
    setRenamingId(map.id)
    setRenameValue(map.topic)
    setConfirmDeleteId(null)
  }

  const commitRename = (id: string, original: string) => {
    const cleaned = sanitizeTopicInput(renameValue)
    if (cleaned && cleaned !== original) {
      onRename(id, cleaned)
    }
    setRenamingId(null)
  }

  return (
    <>
      <div
        className={`drawer-scrim ${open ? 'on' : ''}`}
        onClick={onClose}
        aria-hidden={!open}
      />
      <div
        className={`drawer drawer--right ${open ? 'on' : ''}`}
        role="dialog"
        aria-label="My maps"
        aria-hidden={!open}
      >
        <div className="drawer__head">
          <h3>My maps</h3>
          <button
            type="button"
            className="btn btn--icon btn--ghost"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon icon="tabler:x" width={16} height={16} />
          </button>
        </div>

        <div className="drawer__body">
          <button
            type="button"
            className="btn btn--accent"
            style={{ justifyContent: 'center' }}
            onClick={onNewMap}
          >
            <Icon icon="tabler:plus" width={16} height={16} />
            Start a new map
          </button>

          {error ? (
            <p className="meta-text" style={{ color: 'var(--error)' }}>
              {error}
            </p>
          ) : null}

          {isLoading && maps.length === 0 ? (
            <p className="meta-text">Loading…</p>
          ) : null}

          {!isLoading && maps.length === 0 && !error ? (
            <p className="meta-text">
              No saved maps yet. Generate one and it&apos;ll appear here.
            </p>
          ) : null}

          <div className="map-list">
            {maps.map((map) => {
              const isCurrent = map.id === currentMapId
              const isRenaming = renamingId === map.id
              const isConfirming = confirmDeleteId === map.id
              return (
                <article
                  key={map.id}
                  className={`map-card ${isCurrent ? 'is-current' : ''}`}
                >
                  <div className="map-card__main">
                    {isRenaming ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => commitRename(map.id, map.topic)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            commitRename(map.id, map.topic)
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault()
                            setRenamingId(null)
                          }
                        }}
                        maxLength={80}
                        className="map-card__rename"
                        aria-label="Rename map"
                      />
                    ) : (
                      <button
                        type="button"
                        className="map-card__title"
                        onClick={() => onOpen(map.id)}
                        title="Open this map"
                      >
                        {map.topic || 'Untitled map'}
                      </button>
                    )}
                    <p className="map-card__meta">
                      <span>{map.segments.length} anchors</span>
                      <span className="map-card__sep" />
                      <span>{formatRelative(map.updatedAt)}</span>
                      {isCurrent ? (
                        <>
                          <span className="map-card__sep" />
                          <span className="map-card__current-tag">Current</span>
                        </>
                      ) : null}
                    </p>
                  </div>

                  {isConfirming ? (
                    <div className="map-card__confirm">
                      <span className="meta-text">Delete this map?</span>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn map-card__danger"
                        onClick={() => {
                          onDelete(map.id)
                          setConfirmDeleteId(null)
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div className="map-card__actions">
                      <button
                        type="button"
                        className="btn btn--icon btn--ghost"
                        title="Rename"
                        aria-label="Rename map"
                        onClick={() => startRename(map)}
                      >
                        <Icon icon="tabler:edit" width={14} height={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn--icon btn--ghost"
                        title="Duplicate"
                        aria-label="Duplicate map"
                        onClick={() => onDuplicate(map.id)}
                      >
                        <Icon icon="tabler:copy" width={14} height={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn--icon btn--ghost"
                        title="Delete"
                        aria-label="Delete map"
                        onClick={() => setConfirmDeleteId(map.id)}
                      >
                        <Icon icon="tabler:trash" width={14} height={14} />
                      </button>
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
