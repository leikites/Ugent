import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import SurfaceCard from '@/components/SurfaceCard'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { toneForRunStatus } from '@/lib/status'
import type { Workflow } from '@/types/domain'

export default function WorkflowListPanel(props: {
  workflows: Workflow[]
  selectedId: string
  workspaceArchived: boolean
  getLastRunStatus: (workflowId: string) => string
  onSelect: (workflowId: string) => void
  onCreate: () => void
}) {
  const { t } = useTranslation()
  const { workflows, selectedId, workspaceArchived, getLastRunStatus, onSelect, onCreate } = props

  const rows = useMemo(() => workflows.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [workflows])

  return (
    <SurfaceCard>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workflows.listTitle')}</div>
        <button
          type="button"
          className={
            workspaceArchived
              ? 'inline-flex h-8 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-xs font-semibold text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500'
              : 'inline-flex h-8 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10'
          }
          disabled={workspaceArchived}
          onClick={onCreate}
        >
          <Plus className="h-4 w-4" />
          {t('workflows.create')}
        </button>
      </div>

      <div className="mt-3 grid gap-2">
        {rows.map((wf) => (
          <button
            key={wf.id}
            type="button"
            onClick={() => onSelect(wf.id)}
            className={
              wf.id === selectedId
                ? 'w-full rounded-3xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-left'
                : 'w-full rounded-3xl border border-black/5 bg-white/60 p-3 text-left transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
            }
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{wf.name}</div>
                <div className="mt-1 truncate text-xs text-slate-600 dark:text-slate-300">{wf.description}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge label={`${wf.nodes.length}`} tone="neutral" />
                <StatusBadge
                  label={t(`run.status.${getLastRunStatus(wf.id)}`, { defaultValue: getLastRunStatus(wf.id) })}
                  tone={toneForRunStatus(getLastRunStatus(wf.id))}
                />
              </div>
            </div>
          </button>
        ))}
        {rows.length === 0 ? (
          <EmptyState
            title={t('workflows.emptyTitle')}
            description={t('workflows.emptyHint')}
            actions={
              <button
                type="button"
                className={
                  workspaceArchived
                    ? 'inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500'
                    : 'inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                }
                disabled={workspaceArchived}
                onClick={onCreate}
              >
                <Plus className="h-4 w-4" />
                {t('workflows.create')}
              </button>
            }
          />
        ) : null}
      </div>
    </SurfaceCard>
  )
}
