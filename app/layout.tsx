import './globals.css'
import type { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-dvh bg-bg text-text font-body antialiased">
        <div className="u-noise" />
        <header className="sticky top-0 z-20 border-b border-border bg-bg/90">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
            <a className="no-underline" href="/">
              <div className="u-kicker">AMIGO</div>
              <div className="font-display text-[13px] leading-5 text-text">PM Control Plane</div>
            </a>
            <nav className="flex flex-wrap items-center gap-2">
              <a className="u-btn" href="/">
                Cockpit
              </a>
              <a className="u-btn" href="/dashboard">
                Dashboard
              </a>
              <a className="u-btn" href="/review-queue">
                Review Queue
              </a>
              <a className="u-btn" href="/activity">
                Activity
              </a>
              <a className="u-btn" href="/settings">
                Settings
              </a>
            </nav>
          </div>
        </header>
        <div className="u-shell">{children}</div>
      </body>
    </html>
  )
}
