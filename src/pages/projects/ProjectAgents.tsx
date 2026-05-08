import { useTranslation } from 'react-i18next'
import { Bot, Sparkles } from 'lucide-react'
import SurfaceCard from '@/components/SurfaceCard'

export default function ProjectAgents() {
  const { t } = useTranslation()
  const agents = ['planner', 'coder', 'reviewer', 'runner'] as const
  return (
    <SurfaceCard>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{t('nav.agents')}</div>
        <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-1.5 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <Bot className="h-4 w-4" />
          <span>{t('common.comingSoon')}</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {agents.map((key) => (
          <div
            key={key}
            className="rounded-3xl border border-black/5 bg-white/60 p-4 shadow-sm transition hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t(`agents.cards.${key}`)}</div>
              <Sparkles className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              {t('agents.skillHint')}
            </div>
          </div>
        ))}
      </div>
    </SurfaceCard>
  )
}
