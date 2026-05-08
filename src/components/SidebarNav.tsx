import { NavLink } from 'react-router-dom'
import { Command, LayoutDashboard, Layers, Bot, Blocks, Workflow, Activity, BadgeCheck, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

type NavItem = {
  key: string
  to: string
  label: string
  icon: JSX.Element
}

export default function SidebarNav() {
  const { t } = useTranslation()

  const items: NavItem[] = [
    { key: 'dashboard', to: '/app/dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard className="h-4 w-4" /> },
    { key: 'command', to: '/app/command', label: t('nav.command'), icon: <Command className="h-4 w-4" /> },
    { key: 'workspaces', to: '/app/workspaces', label: t('nav.workspaces'), icon: <Layers className="h-4 w-4" /> },
    { key: 'agents', to: '/app/agents', label: t('nav.agents'), icon: <Bot className="h-4 w-4" /> },
    { key: 'skills', to: '/app/skills', label: t('nav.skills'), icon: <Blocks className="h-4 w-4" /> },
    { key: 'workflows', to: '/app/workflows', label: t('nav.workflows'), icon: <Workflow className="h-4 w-4" /> },
    { key: 'execution', to: '/app/execution', label: t('nav.execution'), icon: <Activity className="h-4 w-4" /> },
    { key: 'reviews', to: '/app/reviews', label: t('nav.reviews'), icon: <BadgeCheck className="h-4 w-4" /> },
    { key: 'settings', to: '/app/settings', label: t('nav.settings'), icon: <Settings className="h-4 w-4" /> },
  ]

  return (
    <aside className="sticky top-14 h-[calc(100dvh-3.5rem)] w-64 shrink-0 p-4">
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
