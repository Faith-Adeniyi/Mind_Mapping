import type { ReactNode } from 'react'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="app-shell__nebula app-shell__nebula--one" />
      <div className="app-shell__nebula app-shell__nebula--two" />
      <div className="app-shell__nebula app-shell__nebula--three" />
      <div className="app-shell__grain" />
      <div className="app-shell__content">{children}</div>
    </div>
  )
}
