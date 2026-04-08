import { Suspense, lazy } from 'react'
import { splitIconTokens } from '../utils/assignIcon'

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
  const tokens = splitIconTokens(value)
  const normalizedTokens = tokens.length > 0 ? tokens : [value]

  const renderToken = (token: string) => {
    if (token.startsWith(ICONIFY_PREFIX)) {
      const iconName = token.slice(ICONIFY_PREFIX.length)

      return (
        <span className="icon-glyph__token" key={token} aria-hidden="true">
          <Suspense fallback={<IconifyFallback />}>
            <LazyIcon icon={iconName} />
          </Suspense>
        </span>
      )
    }

    return (
      <span className="icon-glyph__token" key={token} aria-hidden="true">
        {token}
      </span>
    )
  }

  if (normalizedTokens.length === 1) {
    const token = normalizedTokens[0]
    if (!token) {
      return null
    }

    if (token.startsWith(ICONIFY_PREFIX)) {
      const iconName = token.slice(ICONIFY_PREFIX.length)

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
        {token}
      </span>
    )
  }

  return (
    <span className={className} aria-hidden="true">
      <span className="icon-glyph__multi">
        {normalizedTokens.map((token) => renderToken(token))}
      </span>
    </span>
  )
}
