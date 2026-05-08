import { useTranslation } from 'react-i18next'
import { Workflow } from 'lucide-react'
import SurfaceCard from '@/components/SurfaceCard'

export default function ProjectWorkflows() {
  const { t } = useTranslation()
  return (
    <SurfaceCard>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{t('nav.workflows')}</div>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <Workflow className="h-4 w-4" />
          {t('common.create')}
        </button>
      </div>
      <div className="mt-4 rounded-3xl border border-dashed border-black/10 bg-white/40 p-6 text-sm text-slate-700 dark:border-white/15 dark:bg-white/5 dark:text-slate-200">
        {t('workflows.canvasPrototype')}
      </div>
    </SurfaceCard>
  )
}
