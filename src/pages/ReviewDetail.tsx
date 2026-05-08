import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, BadgeCheck, MessageSquareText } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SurfaceCard from '@/components/SurfaceCard'
import StatusBadge from '@/components/StatusBadge'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useCatalogStore } from '@/stores/useCatalogStore'
import { appService } from '@/services'

export default function ReviewDetail() {
  const { t, i18n } = useTranslation()
  const token = useAuthStore((s) => s.session?.access_token ?? '')
  const me = useAuthStore((s) => s.user)
  const { reviewId = '' } = useParams()
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId)
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace)
  const reviewAction = useCatalogStore((s) => s.reviewAction)

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<null | {
    review: { id: string; title: string; summary: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string; updatedAt: string; runId: string; nodeId: string; workspaceId: string }
    run: { id: string; status: string; workflowId: string; createdAt: string; triggeredBy: string }
    workflow: { id: string; name: string; description: string }
    nodeTitle: string
    nodeDescription: string
    evidence: { previousNodeTitle: string | null; previousNodeOutputText: string | null; previousNodeArtifacts: Array<{ name: string; uri: string }> }
    history: Array<{ id: string; decision: string; comment: string; createdAt: string; createdByUserId: string }>
  }>(null)
  const [comment, setComment] = useState('')

  useEffect(() => {
    let cancelled = false
    if (!token || !reviewId) return
    ;(async () => {
      const res = await appService.repos.reviews.getDetail(token, reviewId)
      if (cancelled) return
      if (res.ok === false) {
        setStatus('error')
        setError(res.error)
        setDetail(null)
        return
      }
      setStatus('ready')
      setError(null)
      setDetail(res.data)
      if (res.data.review.workspaceId && res.data.review.workspaceId !== selectedWorkspaceId) {
        selectWorkspace(res.data.review.workspaceId)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reviewId, selectWorkspace, selectedWorkspaceId, token])

  const formatDateTime = useMemo(() => {
    const locale = i18n.resolvedLanguage ?? 'zh-CN'
    const dtf = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
    return (value: string) => dtf.format(new Date(value))
  }, [i18n.resolvedLanguage])

  const tone = (s: string) => {
    if (s === 'pending') return 'warning'
    if (s === 'approved') return 'success'
    if (s === 'rejected') return 'danger'
    return 'neutral'
  }

  const submit = async (decision: 'approve' | 'reject' | 'comment') => {
    if (!token || !detail) return
    await reviewAction(token, detail.review.id, { decision, comment })
    const res = await appService.repos.reviews.getDetail(token, detail.review.id)
    if (res.ok === true) setDetail(res.data)
    if (decision === 'comment') setComment('')
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t('review.detailTitle')}
        subtitle={
          detail
            ? `${t('review.detailSubtitle')}: ${detail.review.title}`
            : status === 'error'
              ? (error ?? 'error')
              : t('common.loading')
        }
        actions={
          <Link
            to="/app/reviews"
            className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            {t('review.backToList')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SurfaceCard>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <BadgeCheck className="h-4 w-4" />
            {t('review.detailCardTitle')}
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('common.status')}</div>
                <StatusBadge label={detail ? t(`review.status.${detail.review.status}`) : '-'} tone={tone(detail?.review.status ?? '')} />
              </div>
              <div className="mt-2 text-sm text-slate-900 dark:text-slate-100">{detail?.review.summary ?? '-'}</div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t('review.createdAt')}: {detail ? formatDateTime(detail.review.createdAt) : '-'}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t('review.updatedAt')}: {detail ? formatDateTime(detail.review.updatedAt) : '-'}
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <MessageSquareText className="h-4 w-4" />
                {t('review.actionTitle')}
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('review.actionHint')}</div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="mt-3 w-full resize-none rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                placeholder={t('review.commentPlaceholder')}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                  onClick={() => void submit('comment')}
                >
                  {t('review.comment')}
                </button>
                <button
                  type="button"
                  disabled={detail?.review.status !== 'pending'}
                  className="inline-flex h-9 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/15 disabled:opacity-60 dark:text-emerald-300"
                  onClick={() => void submit('approve')}
                >
                  {t('review.approve')}
                </button>
                <button
                  type="button"
                  disabled={detail?.review.status !== 'pending'}
                  className="inline-flex h-9 items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/15 disabled:opacity-60 dark:text-rose-300"
                  onClick={() => void submit('reject')}
                >
                  {t('review.reject')}
                </button>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('review.contextTitle')}</div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('review.contextHint')}</div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('review.runId')}</div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{detail?.review.runId ?? '-'}</div>
                {detail ? (
                  <Link
                    to={`/app/execution/runs/${detail.review.runId}`}
                    className="inline-flex h-8 items-center justify-center rounded-2xl border border-black/10 bg-white px-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                  >
                    {t('review.openRun')}
                  </Link>
                ) : null}
              </div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t('review.workflow')}: {detail ? detail.workflow.name : '-'}
              </div>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('review.currentNode')}</div>
              <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{detail?.nodeTitle ?? '-'}</div>
              <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{detail?.nodeDescription ?? '-'}</div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('review.evidenceTitle')}</div>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t('review.previousNode')}: {detail?.evidence.previousNodeTitle ?? '-'}
              </div>
              <div className="mt-2 rounded-2xl border border-black/5 bg-white/60 p-3 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                {detail?.evidence.previousNodeOutputText ?? t('review.noEvidence')}
              </div>
              {detail && detail.evidence.previousNodeArtifacts.length > 0 ? (
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                  {t('review.artifacts')}: {detail.evidence.previousNodeArtifacts.map((a) => a.name).join(', ')}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('review.historyTitle')}</div>
              <div className="mt-3 grid gap-2">
                {(detail?.history ?? []).map((h) => (
                  <div key={h.id} className="rounded-2xl border border-black/5 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge label={t(`review.decision.${h.decision}`, { defaultValue: h.decision })} tone={h.decision === 'approve' ? 'success' : h.decision === 'reject' ? 'danger' : 'neutral'} />
                      <div className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(h.createdAt)}</div>
                    </div>
                    <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                      {t('review.reviewer')}: {h.createdByUserId === me?.id ? (me?.username ?? '-') : h.createdByUserId}
                    </div>
                    {h.comment ? <div className="mt-1 text-sm text-slate-800 dark:text-slate-100">{h.comment}</div> : null}
                  </div>
                ))}
                {detail && detail.history.length === 0 ? (
                  <div className="text-sm text-slate-600 dark:text-slate-300">{t('review.noHistory')}</div>
                ) : null}
              </div>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}
