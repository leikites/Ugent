import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Workflow as WorkflowIcon } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SurfaceCard from '@/components/SurfaceCard'
import StatusBadge from '@/components/StatusBadge'
import { appService } from '@/services'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useCatalogStore } from '@/stores/useCatalogStore'

export default function WorkflowDetail() {
  const { t, i18n } = useTranslation()
  const token = useAuthStore((s) => s.session?.access_token ?? '')
  const { workflowId = '' } = useParams()

  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId)
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace)

  const status = useCatalogStore((s) => s.status)
  const loadCatalog = useCatalogStore((s) => s.load)
  const workflows = useCatalogStore((s) => s.workflows)
  const runs = useCatalogStore((s) => s.runs)
  const agentInstances = useCatalogStore((s) => s.agentInstances)

  const [resolveError, setResolveError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!token || !workflowId) return

    const fromStore = workflows.find((w) => w.id === workflowId)
    if (fromStore) {
      setResolveError(null)
      if (status === 'idle' || useCatalogStore.getState().workspaceId !== fromStore.workspaceId) {
        selectWorkspace(fromStore.workspaceId)
        void loadCatalog(token, fromStore.workspaceId)
      }
      return
    }

    ;(async () => {
      const res = await appService.repos.workflows.get(token, workflowId)
      if (cancelled) return
      if (res.ok === false) {
        setResolveError(res.error)
        return
      }
      setResolveError(null)
      if (res.data.workspaceId !== selectedWorkspaceId) selectWorkspace(res.data.workspaceId)
      await loadCatalog(token, res.data.workspaceId)
    })()

    return () => {
      cancelled = true
    }
  }, [loadCatalog, selectWorkspace, selectedWorkspaceId, status, token, workflowId, workflows])

  const workflow = useMemo(() => workflows.find((w) => w.id === workflowId) ?? null, [workflowId, workflows])
  const workspaceName = useMemo(() => {
    if (!workflow) return ''
    return workspaces.find((w) => w.id === workflow.workspaceId)?.name ?? ''
  }, [workflow, workspaces])

  const agentName = useMemo(() => {
    const map = new Map(agentInstances.map((a) => [a.id, a.name]))
    return (id: string | null) => (id ? map.get(id) ?? id : '-')
  }, [agentInstances])

  const formatDateTime = useMemo(() => {
    const locale = i18n.resolvedLanguage ?? 'zh-CN'
    const dtf = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
    return (value: string) => dtf.format(new Date(value))
  }, [i18n.resolvedLanguage])

  const recentRuns = useMemo(() => {
    if (!workflow) return []
    return runs
      .filter((r) => r.workflowId === workflow.id)
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10)
  }, [runs, workflow])

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={workflow ? workflow.name : t('workflows.detailTitle')}
        subtitle={
          workflow
            ? `${workspaceName ? `${t('agents.currentWorkspace')}: ${workspaceName} · ` : ''}${workflow.description}`
            : resolveError
              ? resolveError
              : t('common.loading')
        }
        actions={
          workflow ? (
            <Link
              to={`/app/workflows?workspaceId=${workflow.workspaceId}&workflowId=${workflow.id}`}
              className="inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {t('workflows.editInBuilder')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null
        }
      />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SurfaceCard>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <WorkflowIcon className="h-4 w-4" />
            {t('workflows.detailMeta')}
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('workflows.columns.nodes')}</div>
                <StatusBadge label={`${workflow?.nodes.length ?? 0}`} tone="neutral" />
              </div>
              <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">{t('common.updatedAt')}: {workflow ? formatDateTime(workflow.updatedAt) : '-'}</div>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              {t('workflows.detailHint')}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workflows.nodesTitle')}</div>
            <StatusBadge label={workflow ? t('common.ready') : t('common.loading')} tone="neutral" />
          </div>
          <div className="mt-4 grid gap-2">
            {(workflow?.nodes ?? []).map((n) => (
              <div key={n.id} className="rounded-2xl border border-black/5 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900 dark:text-slate-100">{n.title}</div>
                    <div className="mt-1 truncate text-xs text-slate-600 dark:text-slate-300">{n.description || t('workflows.nodeNoDescription')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge label={t(`workflow.nodeType.${n.type}`, { defaultValue: n.type })} tone={n.type === 'review' ? 'warning' : 'neutral'} />
                    <StatusBadge label={t(`workflow.nodeStatus.${n.status}`, { defaultValue: n.status })} tone="neutral" />
                  </div>
                </div>
                {n.type === 'agent' ? (
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {t('workflow.assignedAgent')}: {agentName(n.agentId)}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="mt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workflows.runHistory')}</div>
          <Link
            to="/app/execution"
            className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            {t('execution.open')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
          <div className="grid grid-cols-[1fr_180px_140px_120px] gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
            <div>{t('execution.columns.run')}</div>
            <div>{t('execution.columns.created')}</div>
            <div>{t('execution.columns.status')}</div>
            <div className="text-right"> </div>
          </div>
          <div className="divide-y divide-black/5 bg-white/40 dark:divide-white/10 dark:bg-white/5">
            {recentRuns.map((r) => (
              <Link
                key={r.id}
                to={`/app/execution/runs/${r.id}`}
                className="grid grid-cols-[1fr_180px_140px_120px] items-center gap-2 px-4 py-3 text-sm transition hover:bg-slate-50 dark:hover:bg-white/10"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-900 dark:text-slate-100">{r.id}</div>
                  <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{r.triggeredBy}</div>
                </div>
                <div className="text-slate-700 dark:text-slate-200">{formatDateTime(r.createdAt)}</div>
                <div>
                  <StatusBadge label={t(`run.status.${r.status}`, { defaultValue: r.status })} tone={r.status === 'succeeded' ? 'success' : r.status === 'failed' ? 'danger' : r.status === 'waiting_review' ? 'warning' : 'neutral'} />
                </div>
                <div className="flex justify-end">
                  <span className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-900">
                    {t('execution.open')}
                  </span>
                </div>
              </Link>
            ))}
            {recentRuns.length === 0 ? (
              <div className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{t('execution.empty')}</div>
            ) : null}
          </div>
        </div>
      </SurfaceCard>
    </div>
  )
}

