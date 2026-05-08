import { useTranslation } from 'react-i18next'
import { Blocks, Github } from 'lucide-react'
import SurfaceCard from '@/components/SurfaceCard'

export default function ProjectSkills() {
  const { t } = useTranslation()
  const cards = ['localMcp', 'githubSkillPack', 'promptTemplates', 'workflowMacros'] as const
  return (
    <SurfaceCard>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{t('nav.skills')}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/5 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            <Github className="h-4 w-4" />
            {t('skills.importGithub')}
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <Blocks className="h-4 w-4" />
            {t('common.create')}
          </button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {cards.map((key) => (
          <div
            key={key}
            className="rounded-3xl border border-black/5 bg-white/60 p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
          >
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t(`skills.cards.${key}`)}</div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">{t('common.comingSoon')}</div>
          </div>
        ))}
      </div>
    </SurfaceCard>
  )
}
