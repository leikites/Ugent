import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, MoonStar, Sun, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import LanguageToggle from '@/components/LanguageToggle'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'

type Props = {
  className?: string
}

export default function AppTopBar({ className }: Props) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { isDark, toggleTheme } = useTheme()
  const authStatus = useAuthStore((s) => s.status)
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.session?.access_token ?? '')
  const signOut = useAuthStore((s) => s.signOut)

  const wsStatus = useWorkspaceStore((s) => s.status)
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId)
  const loadDashboard = useWorkspaceStore((s) => s.loadDashboard)
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace)

  useEffect(() => {
    if (authStatus !== 'authenticated') return
    if (!token) return
    if (wsStatus === 'idle') void loadDashboard(token)
  }, [authStatus, loadDashboard, token, wsStatus])

  const section = (() => {
    if (pathname.startsWith('/app/workspaces')) return t('nav.workspaces')
    if (pathname.startsWith('/app/agents')) return t('nav.agents')
    if (pathname.startsWith('/app/skills')) return t('nav.skills')
    if (pathname.startsWith('/app/workflows')) return t('nav.workflows')
    if (pathname.startsWith('/app/execution')) return t('nav.execution')
    if (pathname.startsWith('/app/reviews')) return t('nav.reviews')
    if (pathname.startsWith('/app/settings')) return t('nav.settings')
    return t('nav.dashboard')
  })()

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-black/5 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/60',
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
            <LayoutGrid className="h-4.5 w-4.5 text-slate-700 dark:text-slate-100" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('app.name')}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {section}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-black/5 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
            <span>{isDark ? t('common.light') : t('common.dark')}</span>
          </button>
          {authStatus === 'authenticated' && workspaces.length > 0 ? (
            <select
              value={selectedWorkspaceId ?? ''}
              onChange={(e) => selectWorkspace(e.target.value)}
              className="hidden h-9 max-w-40 rounded-full border border-black/5 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm outline-none transition focus:border-slate-400 sm:inline-flex dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              aria-label="workspace"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          ) : null}
          <Link
            to="/app/dashboard"
            className="inline-flex h-9 items-center justify-center rounded-full border border-black/5 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            {t('nav.dashboard')}
          </Link>

          {authStatus === 'authenticated' ? (
            <button
              type="button"
              onClick={signOut}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-black/5 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
              title={user?.username || user?.email || undefined}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t('common.signOut')}</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-9 items-center justify-center rounded-full border border-black/5 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              {t('common.signIn')}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
