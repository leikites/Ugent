import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Activity, ArrowRight } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SurfaceCard from '@/components/SurfaceCard'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { toneForRunStatus } from '@/lib/status'
import { useAuthStore } from '@/stores/useAuthStore'
import { useExecutionCenterStore } from '@/stores/useExecutionCenterStore'

export default function ExecutionCenter() {
  const { t, i18n } = useTranslation()
  const token = useAuthStore((s) => s.session?.access_token ?? '')

  const status = useExecutionCenterStore((s) => s.status)
  const load = useExecutionCenterStore((s) => s.load)
  const workspaces = useExecutionCenterStore((s) => s.workspaces)
  const workspaceFilterId = useExecutionCenterStore((s) => s.workspaceFilterId)
  const setWorkspaceFilter = useExecutionCenterStore((s) => s.setWorkspaceFilter)
  const rows = useExecutionCenterStore((s) => s.rows)

  useEffect(() => {
    if (!token) return
    if (status === 'idle') void load(token)
  }, [load, status, token])

  const formatDateTime = useMemo(() => {
    const locale = i18n.resolvedLanguage ?? 'zh-CN'
    const dtf = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
    return (value: string) => dtf.format(new Date(value))
  }, [i18n.resolvedLanguage])

  const filtered = useMemo(() => {
    if (workspaceFilterId === 'all') return rows
    return rows.filter((r) => r.workspaceId === workspaceFilterId)
  }, [rows, workspaceFilterId])

  const metrics = useMemo(() => {
    const counts = {
      total: filtered.length,
      waiting: 0,
      running: 0,
      failed: 0,
      succeeded: 0,
    }
    for (const r of filtered) {
      if (r.status === 'waiting_review') counts.waiting += 1
      else if (r.status === 'running') counts.running += 1
      else if (r.status === 'failed') counts.failed += 1
      else if (r.status === 'succeeded') counts.succeeded += 1
    }
    return counts
  }, [filtered])

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t('execution.title')}
        subtitle={t('execution.subtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
              disabled={!token}
              onClick={() => {
                if (!token) return
                void load(token)
              }}
            >
              {t('execution.refresh')}
            </button>
            <select
              value={workspaceFilterId}
              onChange={(e) => setWorkspaceFilter(e.target.value as typeof workspaceFilterId)}
              className="h-9 rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
            >
              <option value="all">{t('execution.filterAllWorkspaces')}</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <StatusBadge label={status === 'loading' ? t('common.loading') : t('common.ready')} tone={status === 'loading' ? 'neutral' : 'info'} />
          </div>
        }
      />
      <SurfaceCard className="mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Activity className="h-4 w-4" />
            {t('execution.runsTitle')}
          </div>
          <StatusBadge label={`${t('execution.metrics.total')}: ${metrics.total}`} tone="neutral" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-3xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('execution.metrics.waiting')}</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{metrics.waiting}</div>
              <StatusBadge label={t('run.status.waiting_review')} tone={metrics.waiting ? 'warning' : 'neutral'} />
            </div>
          </div>
          <div className="rounded-3xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('execution.metrics.running')}</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{metrics.running}</div>
              <StatusBadge label={t('run.status.running')} tone={metrics.running ? 'info' : 'neutral'} />
            </div>
          </div>
          <div className="rounded-3xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('execution.metrics.succeeded')}</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{metrics.succeeded}</div>
              <StatusBadge label={t('run.status.succeeded')} tone={metrics.succeeded ? 'success' : 'neutral'} />
            </div>
          </div>
          <div className="rounded-3xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('execution.metrics.failed')}</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{metrics.failed}</div>
              <StatusBadge label={t('run.status.failed')} tone={metrics.failed ? 'danger' : 'neutral'} />
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
          <div className="grid grid-cols-[1fr_140px_180px_160px_160px_120px] gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
            <div>{t('execution.columns.run')}</div>
            <div>{t('execution.columns.workspace')}</div>
            <div>{t('execution.columns.workflow')}</div>
            <div>{t('execution.columns.currentNode')}</div>
            <div>{t('common.updatedAt')}</div>
            <div className="text-right"> </div>
          </div>
          <div className="divide-y divide-black/5 bg-white/40 dark:divide-white/10 dark:bg-white/5">
            {filtered.map((r) => (
              <div key={r.runId} className="grid grid-cols-[1fr_140px_180px_160px_160px_120px] items-center gap-2 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate font-medium text-slate-900 dark:text-slate-100">{r.runId}</div>
                    <StatusBadge label={t(`run.status.${r.status}`, { defaultValue: r.status })} tone={toneForRunStatus(r.status)} />
                    {r.pendingReviewId ? <StatusBadge label={t('execution.badge.pendingReview')} tone="warning" /> : null}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    {t('execution.triggeredBy')}: {r.triggeredBy}
                  </div>
                </div>
                <div className="min-w-0 truncate text-slate-700 dark:text-slate-200">{r.workspaceName}</div>
                <div className="min-w-0 truncate text-slate-700 dark:text-slate-200">{r.workflowName}</div>
                <div className="min-w-0">
                  {r.currentNodeTitle ? (
                    <div className="flex items-center gap-2">
                      <div className="truncate text-slate-700 dark:text-slate-200">{r.currentNodeTitle}</div>
                      {r.currentNodeStatus ? (
                        <StatusBadge
                          label={t(`workflow.nodeStatus.${r.currentNodeStatus}`, { defaultValue: r.currentNodeStatus })}
                          tone="neutral"
                        />
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-slate-500 dark:text-slate-400">-</div>
                  )}
                </div>
                <div className="text-slate-700 dark:text-slate-200">{formatDateTime(r.finishedAt ?? r.startedAt ?? r.createdAt)}</div>
                <div className="flex justify-end">
                  <div className="flex items-center gap-2">
                    {r.pendingReviewId ? (
                      <Link
                        to={`/app/reviews/${r.pendingReviewId}`}
                        className="inline-flex h-9 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-500/15 dark:text-amber-300"
                      >
                        {t('execution.openReview')}
                      </Link>
                    ) : null}
                    <Link
                      to={`/app/execution/runs/${r.runId}`}
                      className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                    >
                      {t('execution.open')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title={t('execution.emptyTitle')}
                  description={t('execution.emptyHint')}
                  actions={
                    <Link
                      to="/app/workflows?create=workflow"
                      className="inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                    >
                      {t('execution.emptyCta')}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  }
                />
              </div>
            ) : null}
          </div>
        </div>
      </SurfaceCard>
    </div>
  )
}
