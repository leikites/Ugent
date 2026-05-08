import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Power } from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import SurfaceCard from '@/components/SurfaceCard'
import EmptyState from '@/components/EmptyState'
import type { AgentInstance, Id, Workspace } from '@/types/domain'

export default function AgentInstancesPanel(props: {
  token: string
  workspaces: Workspace[]
  instances: AgentInstance[]
  onToggle: (token: string, agentId: Id) => void
  onCreate?: () => void
  createDisabled?: boolean
}) {
  const { t } = useTranslation()
  const { token, workspaces, instances, onToggle, onCreate, createDisabled } = props

  const workspaceMap = useMemo(() => new Map(workspaces.map((w) => [w.id, w])), [workspaces])
  const showWorkspaceColumn = workspaces.length > 1
  const enabledCount = useMemo(() => instances.filter((a) => a.enabled).length, [instances])
  const disabledCount = useMemo(() => instances.filter((a) => !a.enabled).length, [instances])

  return (
    <SurfaceCard>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('agents.instances.title')}</div>
        <StatusBadge
          label={`${t('agents.instances.count')}: ${instances.length} · ${t('agents.enabled')}: ${enabledCount} · ${t('agents.disabled')}: ${disabledCount}`}
          tone="neutral"
        />
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
        <div
          className={
            showWorkspaceColumn
              ? 'grid grid-cols-[minmax(0,1fr)_120px_96px_96px_156px] gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300'
              : 'grid grid-cols-[minmax(0,1fr)_96px_96px_156px] gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300'
          }
        >
          <div className="min-w-0">{t('agents.columns.name')}</div>
          {showWorkspaceColumn ? <div className="min-w-0">{t('workspaces.columns.name')}</div> : null}
          <div className="min-w-0">{t('agents.columns.skills')}</div>
          <div className="min-w-0">{t('workflows.columns.nodes')}</div>
          <div className="min-w-0 text-right"> </div>
        </div>
        <div className="divide-y divide-black/5 bg-white/40 dark:divide-white/10 dark:bg-white/5">
          {instances.map((a) => (
            <div
              key={a.id}
              className={
                showWorkspaceColumn
                  ? 'grid grid-cols-[minmax(0,1fr)_120px_96px_96px_156px] items-center gap-2 px-4 py-3 text-sm'
                  : 'grid grid-cols-[minmax(0,1fr)_96px_96px_156px] items-center gap-2 px-4 py-3 text-sm'
              }
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate font-medium text-slate-900 dark:text-slate-100">{a.name}</div>
                  <div className="hidden items-center gap-2 lg:flex">
                    <StatusBadge label={a.enabled ? t('agents.enabled') : t('agents.disabled')} tone={a.enabled ? 'success' : 'neutral'} />
                    <StatusBadge label={a.templateId ? t('agents.type.fromTemplate') : t('agents.type.custom')} tone="neutral" />
                  </div>
                </div>
                <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{a.summary}</div>
              </div>
              {showWorkspaceColumn ? (
                <div className="min-w-0 truncate text-slate-700 dark:text-slate-200">{workspaceMap.get(a.workspaceId)?.name ?? a.workspaceId}</div>
              ) : null}
              <div className="min-w-0 text-slate-700 dark:text-slate-200">{a.skillBindings.length}</div>
              <div className="min-w-0 text-slate-700 dark:text-slate-200">{a.workflowIds.length}</div>
              <div className="flex min-w-0 justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                  onClick={() => {
                    if (!token) return
                    onToggle(token, a.id)
                  }}
                >
                  <Power className="h-4 w-4" />
                  <span className="hidden sm:inline">{a.enabled ? t('agents.disable') : t('agents.enable')}</span>
                </button>
                <Link
                  to={`/app/agents/instances/${a.id}`}
                  className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {t('agents.open')}
                </Link>
              </div>
            </div>
          ))}
          {instances.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title={t('agents.instances.emptyTitle')}
                description={t('agents.instances.emptyHint')}
                actions={
                  onCreate ? (
                    <button
                      type="button"
                      className={
                        createDisabled
                          ? 'inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500'
                          : 'inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                      }
                      disabled={createDisabled}
                      onClick={onCreate}
                    >
                      <Plus className="h-4 w-4" />
                      {t('agents.createInstance')}
                    </button>
                  ) : null
                }
              />
            </div>
          ) : null}
        </div>
      </div>
    </SurfaceCard>
  )
}
