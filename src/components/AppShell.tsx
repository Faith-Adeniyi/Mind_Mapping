import type { ReactNode } from 'react'

type AppShellProps = {
  children: ReactNode
  inspectorOpen?: boolean
  density?: 'comfortable' | 'compact'
  numerals?: 'on' | 'off'
}

export function AppShell({
  children,
  inspectorOpen = true,
  density = 'compact',
  numerals = 'on',
}: AppShellProps) {
  return (
    <div
      className="app-shell"
      data-inspopen={inspectorOpen ? '1' : '0'}
      data-density={density}
      data-numerals={numerals}
    >
      <div className="app-shell__bg" />
      <div className="app-shell__dots" />
      <div className="app-shell__content">{children}</div>
    </div>
  )
}
