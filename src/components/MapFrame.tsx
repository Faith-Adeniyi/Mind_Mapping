import type { ReactNode, Ref } from 'react'
import { FullscreenToggleButton } from './FullscreenToggleButton'

type MapFrameProps = {
  surfaceRef?: Ref<HTMLElement>
  kicker: string
  title: string
  description: string
  children: ReactNode
  isCompact?: boolean
  isFullscreen?: boolean
  isFullscreenSupported?: boolean
  onToggleFullscreen?: () => void
  className?: string
  bodyClassName?: string
}

export function MapFrame({
  surfaceRef,
  kicker,
  title,
  description,
  children,
  isCompact = false,
  isFullscreen = false,
  isFullscreenSupported = false,
  onToggleFullscreen,
  className,
  bodyClassName,
}: MapFrameProps) {
  return (
    <section
      ref={surfaceRef}
      className={`view-surface glass-panel ${isCompact ? 'view-surface--compact' : ''} ${className ?? ''}`.trim()}
    >
      <div className={`view-head ${isCompact ? 'view-head--compact' : ''}`}>
        <div className="view-head__copy">
          <p className="panel-kicker">{kicker}</p>
          <h2>{title}</h2>
        </div>
        <div className="view-head__actions">
          <p className="meta-text view-head__meta">{description}</p>
          {onToggleFullscreen ? (
            <FullscreenToggleButton
              isFullscreen={isFullscreen}
              isSupported={isFullscreenSupported}
              onToggle={onToggleFullscreen}
            />
          ) : null}
        </div>
      </div>

      <div className={`view-body ${bodyClassName ?? ''}`.trim()}>{children}</div>
    </section>
  )
}
