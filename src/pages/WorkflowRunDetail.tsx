import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Activity, Workflow as WorkflowIcon } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SurfaceCard from '@/components/SurfaceCard'
import StatusBadge from '@/components/StatusBadge'
import { useAuthStore } from '@/stores/useAuthStore'
import { appService } from '@/services'
import type { ReviewItem } from '@/types/domain'

type RunRow = { id: string; workflowId: string; status: string; createdAt: string; triggeredBy: string }
type NodeRunRow = {
  id: string
  nodeId: string
  status: string
  startedAt: string | null
  finishedAt: string | null
  outputText?: string | null
  artifactCount?: number
}

export default function WorkflowRunDetail() {
  const { t, i18n } = useTranslation()
  const { runId = '' } = useParams()
  const token = useAuthStore((s) => s.session?.access_token ?? '')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [run, setRun] = useState<RunRow | null>(null)
  const [workflowName, setWorkflowName] = useState<string>('')
  const [nodeRuns, setNodeRuns] = useState<NodeRunRow[]>([])
  const [nodeTitles, setNodeTitles] = useState<Map<string, string>>(new Map())
  const [reviews, setReviews] = useState<ReviewItem[]>([])

  useEffect(() => {
    let cancelled = false
    if (!token || !runId) return
    ;(async () => {
      const res = await appService.repos.execution.getRunDetail(token, runId)
      if (cancelled) return
      if (res.ok === false) {
        setStatus('error')
        setError(res.error)
        setRun(null)
        setNodeRuns([])
        return
      }
      setStatus('ready')
      setError(null)
      setRun(res.data.run)
      setWorkflowName(res.data.workflow.name)
      setNodeRuns(res.data.nodeRuns)
      setNodeTitles(new Map(res.data.workflow.nodes.map((n) => [n.id, n.title])))
      setReviews(res.data.reviews)
    })()
    return () => {
      cancelled = true
    }
  }, [runId, token])

  const formatDateTime = useMemo(() => {
    const locale = i18n.resolvedLanguage ?? 'zh-CN'
    const dtf = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
    return (value: string) => dtf.format(new Date(value))
  }, [i18n.resolvedLanguage])

  const statusLabel = run ? t(`run.status.${run.status}`, { defaultValue: run.status }) : '-'

  const nodeOrder = useMemo(() => {
    const m = new Map<string, number>()
    let idx = 0
    for (const [nodeId] of nodeTitles.entries()) {
      m.set(nodeId, idx++)
    }
    return m
  }, [nodeTitles])

  const orderedNodeRuns = useMemo(() => {
    return nodeRuns.slice().sort((a, b) => (nodeOrder.get(a.nodeId) ?? 0) - (nodeOrder.get(b.nodeId) ?? 0))
  }, [nodeOrder, nodeRuns])

  const pendingReviewId = useMemo(() => {
    const pending = reviews.find((r) => r.status === 'pending')
    return pending?.id ?? null
  }, [reviews])

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t('execution.runDetailTitle')}
        subtitle={run ? `${t('execution.runId')}: ${run.id}` : status === 'error' ? (error ?? 'error') : t('common.loading')}
        actions={
          <Link
            to="/app/execution"
            className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            {t('execution.backToList')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SurfaceCard>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <Activity className="h-4 w-4" />
            {t('execution.runMeta')}
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('common.status')}</div>
                <StatusBadge label={statusLabel} tone={run?.status === 'succeeded' ? 'success' : run?.status === 'failed' ? 'danger' : run?.status === 'waiting_review' ? 'warning' : 'neutral'} />
              </div>
              <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">{t('execution.triggeredBy')}: {run?.triggeredBy ?? '-'}</div>
              <div className="mt-1 text-sm text-slate-700 dark:text-slate-200">{t('execution.startedAt')}: {run ? formatDateTime(run.createdAt) : '-'}</div>
            </div>
            {run?.status === 'waiting_review' && pendingReviewId ? (
              <Link
                to={`/app/reviews/${pendingReviewId}`}
                className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm transition hover:bg-amber-500/15 dark:border-amber-500/20"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{t('execution.pendingReview')}</div>
                  <StatusBadge label={t('review.status.pending')} tone="warning" />
                </div>
                <div className="mt-1 text-xs text-slate-700 dark:text-slate-200">{t('execution.openReviewHint')}</div>
              </Link>
            ) : null}
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              {t('execution.runDetailHint')}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <WorkflowIcon className="h-4 w-4" />
            {t('execution.workflowMeta')}
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('execution.workflowId')}</div>
              <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{workflowName || run?.workflowId || '-'}</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('execution.workflowHint')}</div>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              {t('execution.futureLogsHint')}
            </div>
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="mt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('execution.nodeRunTitle')}</div>
          <StatusBadge label={`${orderedNodeRuns.length}`} tone="neutral" />
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
          <div className="grid grid-cols-[1fr_160px_200px] gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
            <div>{t('execution.node')}</div>
            <div>{t('execution.columns.status')}</div>
            <div>{t('execution.columns.output')}</div>
          </div>
          <div className="divide-y divide-black/5 bg-white/40 dark:divide-white/10 dark:bg-white/5">
            {orderedNodeRuns.map((nr) => (
              <div key={nr.id} className="grid grid-cols-[1fr_160px_200px] items-center gap-2 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-900 dark:text-slate-100">{nodeTitles.get(nr.nodeId) ?? nr.nodeId}</div>
                  <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{nr.nodeId}</div>
                </div>
                <div>
                  <StatusBadge
                    label={t(`workflow.nodeStatus.${nr.status}`, { defaultValue: nr.status })}
                    tone={nr.status === 'waiting_review' ? 'warning' : nr.status === 'failed' ? 'danger' : nr.status === 'completed' || nr.status === 'approved' ? 'success' : 'neutral'}
                  />
                </div>
                <div className="min-w-0 text-slate-700 dark:text-slate-200">
                  <div className="truncate">{nr.outputText ?? '-'}</div>
                  <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {nr.startedAt ? formatDateTime(nr.startedAt) : '-'} · {t('execution.artifacts')}: {nr.artifactCount ?? 0}
                  </div>
                </div>
              </div>
            ))}
            {orderedNodeRuns.length === 0 ? (
              <div className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{t('execution.nodeRunEmpty')}</div>
            ) : null}
          </div>
        </div>
      </SurfaceCard>
    </div>
  )
}
