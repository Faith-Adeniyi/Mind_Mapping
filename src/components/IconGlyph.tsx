import { Suspense, lazy } from 'react'

type IconGlyphProps = {
  value: string
  className?: string
}

const ICONIFY_PREFIX = 'iconify:'
const LazyIcon = lazy(async () => {
  const module = await import('@iconify/react')
  return { default: module.Icon }
})

function IconifyFallback() {
  return (
    <span className="icon-glyph__fallback" aria-hidden="true">
      ...
    </span>
  )
}

export function IconGlyph({ value, className }: IconGlyphProps) {
  if (value.startsWith(ICONIFY_PREFIX)) {
    const iconName = value.slice(ICONIFY_PREFIX.length)

    return (
      <span className={className} aria-hidden="true">
        <Suspense fallback={<IconifyFallback />}>
          <LazyIcon icon={iconName} />
        </Suspense>
      </span>
    )
  }

  return (
    <span className={className} aria-hidden="true">
      {value}
    </span>
  )
}
