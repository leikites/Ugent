import { useTranslation } from 'react-i18next'
import { Activity } from 'lucide-react'
import SurfaceCard from '@/components/SurfaceCard'

export default function ProjectRuns() {
  const { t } = useTranslation()
  return (
    <SurfaceCard>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{t('nav.runs')}</div>
        <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-3 py-1.5 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <Activity className="h-4 w-4" />
          <span>{t('common.comingSoon')}</span>
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
        <div className="grid grid-cols-[1fr_160px_120px] gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
          <div>{t('runs.columns.run')}</div>
          <div>{t('common.status')}</div>
          <div>{t('runs.columns.time')}</div>
        </div>
        <div className="divide-y divide-black/5 bg-white/40 dark:divide-white/10 dark:bg-white/5">
          {[
            { name: 'Daily Sync', status: 'running', time: '2m' },
            { name: 'Import Skills', status: 'failed', time: '8s' },
            { name: 'Generate Workflow', status: 'succeeded', time: '1m' },
          ].map((r) => (
            <div key={r.name} className="grid grid-cols-[1fr_160px_120px] items-center gap-2 px-4 py-3 text-sm">
              <div className="font-medium text-slate-900 dark:text-slate-100">{r.name}</div>
              <div className="text-slate-700 dark:text-slate-200">{t(`runs.status.${r.status}`, { defaultValue: r.status })}</div>
              <div className="text-slate-700 dark:text-slate-200">{r.time}</div>
            </div>
          ))}
        </div>
      </div>
    </SurfaceCard>
  )
}
