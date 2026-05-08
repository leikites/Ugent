import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BadgeCheck } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SurfaceCard from '@/components/SurfaceCard'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { toneForReviewStatus } from '@/lib/status'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useCatalogStore } from '@/stores/useCatalogStore'

export default function ReviewCenter() {
  const { t, i18n } = useTranslation()
  const token = useAuthStore((s) => s.session?.access_token ?? '')
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId)
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace)

  const status = useCatalogStore((s) => s.status)
  const load = useCatalogStore((s) => s.load)
  const reviews = useCatalogStore((s) => s.reviews)
  const reviewAction = useCatalogStore((s) => s.reviewAction)
  const workflows = useCatalogStore((s) => s.workflows)
  const runs = useCatalogStore((s) => s.runs)

  const [searchParams] = useSearchParams()
  const qsStatus = searchParams.get('status')
  const qsWorkflowId = searchParams.get('workflowId')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [workflowFilter, setWorkflowFilter] = useState<string>('all')

  useEffect(() => {
    if (qsStatus === 'pending' || qsStatus === 'approved' || qsStatus === 'rejected' || qsStatus === 'all') {
      setStatusFilter(qsStatus)
    }
  }, [qsStatus])

  useEffect(() => {
    if (qsWorkflowId) setWorkflowFilter(qsWorkflowId)
  }, [qsWorkflowId])

  useEffect(() => {
    if (!token || !selectedWorkspaceId) return
    if (status === 'idle' || useCatalogStore.getState().workspaceId !== selectedWorkspaceId) {
      void load(token, selectedWorkspaceId)
    }
  }, [load, selectedWorkspaceId, status, token])

  const formatDateTime = useMemo(() => {
    const locale = i18n.resolvedLanguage ?? 'zh-CN'
    const dtf = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
    return (value: string) => dtf.format(new Date(value))
  }, [i18n.resolvedLanguage])

  const pendingCount = useMemo(() => reviews.filter((r) => r.status === 'pending').length, [reviews])

  const workflowNameById = useMemo(() => new Map(workflows.map((w) => [w.id, w.name])), [workflows])
  const runById = useMemo(() => new Map(runs.map((r) => [r.id, r])), [runs])

  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (workflowFilter !== 'all') {
        const run = runById.get(r.runId)
        if (!run || run.workflowId !== workflowFilter) return false
      }
      return true
    })
  }, [reviews, runById, statusFilter, workflowFilter])

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t('review.title')}
        subtitle={t('review.subtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedWorkspaceId ?? ''}
              onChange={(e) => selectWorkspace(e.target.value)}
              className="h-9 rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="h-9 rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
            >
              <option value="pending">{t('review.status.pending')}</option>
              <option value="approved">{t('review.status.approved')}</option>
              <option value="rejected">{t('review.status.rejected')}</option>
              <option value="all">{t('common.all')}</option>
            </select>
            <select
              value={workflowFilter}
              onChange={(e) => setWorkflowFilter(e.target.value)}
              className="h-9 rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
            >
              <option value="all">{t('review.filterAllWorkflows')}</option>
              {workflows.map((wf) => (
                <option key={wf.id} value={wf.id}>
                  {wf.name}
                </option>
              ))}
            </select>
          </div>
        }
      />
      <SurfaceCard className="mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <BadgeCheck className="h-4 w-4" />
            {t('review.listTitle')}
          </div>
          <StatusBadge label={`${t('review.pending')}: ${pendingCount}`} tone={pendingCount ? 'warning' : 'neutral'} />
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
          <div className="grid grid-cols-[1fr_160px_140px_180px_220px] gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
            <div>{t('review.columns.title')}</div>
            <div>{t('review.columns.workflow')}</div>
            <div>{t('common.status')}</div>
            <div>{t('review.columns.createdAt')}</div>
            <div className="text-right"> </div>
          </div>
          <div className="divide-y divide-black/5 bg-white/40 dark:divide-white/10 dark:bg-white/5">
            {filtered.map((r) => {
              const run = runById.get(r.runId)
              const wfName = run ? workflowNameById.get(run.workflowId) ?? run.workflowId : '-'
              return (
              <div key={r.id} className="grid grid-cols-[1fr_160px_140px_180px_220px] items-center gap-2 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-900 dark:text-slate-100">{r.title}</div>
                  <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{r.summary}</div>
                </div>
                <div className="min-w-0 truncate text-slate-700 dark:text-slate-200">{wfName}</div>
                <div>
                  <StatusBadge
                    label={t(`review.status.${r.status}`, { defaultValue: r.status })}
                    tone={toneForReviewStatus(r.status)}
                  />
                </div>
                <div className="text-slate-700 dark:text-slate-200">{formatDateTime(r.createdAt)}</div>
                <div className="flex justify-end gap-2">
                  {r.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/15 dark:text-emerald-300"
                        onClick={() => {
                          if (!token) return
                          void reviewAction(token, r.id, { decision: 'approve', comment: '' })
                        }}
                      >
                        {t('review.approve')}
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/15 dark:text-rose-300"
                        onClick={() => {
                          if (!token) return
                          void reviewAction(token, r.id, { decision: 'reject', comment: '' })
                        }}
                      >
                        {t('review.reject')}
                      </button>
                    </>
                  ) : null}
                  <Link
                    to={`/app/reviews/${r.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >
                    {t('review.open')}
                  </Link>
                </div>
              </div>
            )})}
            {filtered.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title={statusFilter === 'pending' ? t('review.emptyPendingTitle') : t('review.emptyTitle')}
                  description={statusFilter === 'pending' ? t('review.emptyPendingHint') : t('review.emptyHint')}
                  actions={
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to="/app/execution"
                        className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                      >
                        {t('review.emptyCtaExecution')}
                      </Link>
                      <Link
                        to="/app/workflows"
                        className="inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      >
                        {t('review.emptyCtaWorkflows')}
                      </Link>
                    </div>
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
