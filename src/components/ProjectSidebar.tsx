import { NavLink, useParams } from 'react-router-dom'
import { Bot, Blocks, Workflow, Activity, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

type NavItem = {
  key: string
  to: string
  label: string
  icon: import('react').ReactNode
}

export default function ProjectSidebar() {
  const { t } = useTranslation()
  const { projectId } = useParams()

  const base = `/projects/${projectId}`
  const items: NavItem[] = [
    { key: 'agents', to: `${base}/agents`, label: t('nav.agents'), icon: <Bot className="h-4 w-4" /> },
    { key: 'skills', to: `${base}/skills`, label: t('nav.skills'), icon: <Blocks className="h-4 w-4" /> },
    { key: 'workflows', to: `${base}/workflows`, label: t('nav.workflows'), icon: <Workflow className="h-4 w-4" /> },
    { key: 'runs', to: `${base}/runs`, label: t('nav.runs'), icon: <Activity className="h-4 w-4" /> },
    { key: 'settings', to: `${base}/settings`, label: t('nav.settings'), icon: <Settings className="h-4 w-4" /> },
  ]

  return (
    <aside className="sticky top-14 h-[calc(100dvh-3.5rem)] w-60 shrink-0 p-4">
      <div className="rounded-3xl border border-black/5 bg-white/80 p-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
        {items.map((it) => (
          <NavLink
            key={it.key}
            to={it.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition',
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white/15 dark:text-white'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10',
              )
            }
          >
            <span className="opacity-90">{it.icon}</span>
            <span className="font-medium">{it.label}</span>
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
