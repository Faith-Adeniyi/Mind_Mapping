type FullscreenToggleButtonProps = {
  isFullscreen: boolean
  isSupported: boolean
  onToggle: () => void
  className?: string
}

function EnterFullscreenIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M3 8V3h5M12 3h5v5M17 12v5h-5M8 17H3v-5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

function ExitFullscreenIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M8 3H3v5M17 8V3h-5M12 17h5v-5M3 12v5h5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  )
}

export function FullscreenToggleButton({
  isFullscreen,
  isSupported,
  onToggle,
  className,
}: FullscreenToggleButtonProps) {
  const label = isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'

  return (
    <button
      type="button"
      className={`ghost-button ghost-button--icon ${className ?? ''}`.trim()}
      onClick={onToggle}
      disabled={!isSupported}
      aria-label={label}
      title={label}
    >
      {isFullscreen ? <ExitFullscreenIcon /> : <EnterFullscreenIcon />}
    </button>
  )
}
