import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, BadgeCheck, Command, CornerDownLeft, Sparkles, Wand2 } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SurfaceCard from '@/components/SurfaceCard'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useCommandCenterStore } from '@/stores/useCommandCenterStore'

export default function CommandCenter() {
  const { t } = useTranslation()
  const token = useAuthStore((s) => s.session?.access_token ?? '')

  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId)
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace)

  const status = useCommandCenterStore((s) => s.status)
  const context = useCommandCenterStore((s) => s.context)
  const loadContext = useCommandCenterStore((s) => s.loadContext)

  const input = useCommandCenterStore((s) => s.input)
  const setInput = useCommandCenterStore((s) => s.setInput)
  const planner = useCommandCenterStore((s) => s.planner)
  const setPlanner = useCommandCenterStore((s) => s.setPlanner)
  const workspaceMode = useCommandCenterStore((s) => s.workspaceMode)
  const setWorkspaceMode = useCommandCenterStore((s) => s.setWorkspaceMode)
  const setPreferredWorkspaceId = useCommandCenterStore((s) => s.setPreferredWorkspaceId)

  const planStatus = useCommandCenterStore((s) => s.planStatus)
  const proposal = useCommandCenterStore((s) => s.proposal)
  const generatePlan = useCommandCenterStore((s) => s.generatePlan)
  const confirmAndRun = useCommandCenterStore((s) => s.confirmAndRun)
  const runStatus = useCommandCenterStore((s) => s.runStatus)
  const lastRun = useCommandCenterStore((s) => s.lastRun)
  const error = useCommandCenterStore((s) => s.error)

  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!token) return
    if (status === 'idle') void loadContext(token)
  }, [loadContext, status, token])

  useEffect(() => {
    if (!selectedWorkspaceId) return
    setPreferredWorkspaceId(selectedWorkspaceId)
  }, [selectedWorkspaceId, setPreferredWorkspaceId])

  const examples = useMemo(
    () => [
      { title: t('command.examples.prdTitle'), text: t('command.examples.prdText') },
      { title: t('command.examples.importTitle'), text: t('command.examples.importText') },
      { title: t('command.examples.qaTitle'), text: t('command.examples.qaText') },
    ],
    [t],
  )

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t('command.title')}
        subtitle={t('command.subtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={planner}
              onChange={(e) => setPlanner(e.target.value as typeof planner)}
              className="h-9 rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
            >
              <option value="mock">{t('command.planner.mock')}</option>
              <option value="codex">{t('command.planner.codex')}</option>
            </select>
            <select
              value={workspaceMode}
              onChange={(e) => setWorkspaceMode(e.target.value as typeof workspaceMode)}
              className="h-9 rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
            >
              <option value="auto">{t('command.workspace.auto')}</option>
              <option value="pinned">{t('command.workspace.pinned')}</option>
            </select>
            <select
              value={selectedWorkspaceId ?? ''}
              onChange={(e) => selectWorkspace(e.target.value)}
              className="h-9 rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 disabled:opacity-50 dark:border-white/10 dark:bg-white/5"
              disabled={workspaceMode === 'auto' || !context}
            >
              {(context?.workspaces ?? []).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <StatusBadge label={status === 'loading' ? t('common.loading') : t('common.ready')} tone={status === 'loading' ? 'neutral' : 'info'} />
          </div>
        }
      />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Command className="h-4 w-4" />
              {t('command.input.title')}
            </div>
            <StatusBadge label={t('command.mode.planThenConfirm')} tone="info" />
          </div>

          <div className="mt-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={6}
              className="w-full resize-none rounded-3xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
              placeholder={t('command.input.placeholder')}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                  disabled={!token || !input.trim() || busy}
                  onClick={async () => {
                    if (!token) return
                    setBusy(true)
                    await generatePlan(token)
                    setBusy(false)
                  }}
                >
                  <Wand2 className="h-4 w-4" />
                  {t('command.actions.analyze')}
                </button>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <CornerDownLeft className="inline h-3.5 w-3.5" /> {t('command.input.hint')}
                </div>
              </div>
              {error ? <div className="text-xs font-semibold text-rose-700 dark:text-rose-300">{t(`command.error.${error}`, { defaultValue: error })}</div> : null}
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('command.examples.title')}</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {examples.map((ex) => (
                <button
                  key={ex.title}
                  type="button"
                  className="rounded-3xl border border-black/5 bg-white/60 p-3 text-left text-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  onClick={() => setInput(ex.text)}
                >
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{ex.title}</div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{ex.text}</div>
                </button>
              ))}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Sparkles className="h-4 w-4" />
              {t('command.proposal.title')}
            </div>
            <StatusBadge
              label={planStatus === 'ready' ? t('command.proposal.ready') : planStatus === 'loading' ? t('common.loading') : t('command.proposal.idle')}
              tone={planStatus === 'ready' ? 'info' : 'neutral'}
            />
          </div>

          {proposal ? (
            <div className="mt-4 grid gap-3">
              <div className="rounded-3xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('command.proposal.orchestrator')}</div>
                  <StatusBadge label={t(`command.proposal.route.${proposal.route.type}`)} tone="neutral" />
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{proposal.title}</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{proposal.summary}</div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge label={`${t('command.proposal.workspace')}: ${proposal.workspace.name}`} tone="info" />
                  {proposal.route.type === 'workflow' ? (
                    <StatusBadge label={`${t('command.proposal.workflow')}: ${proposal.route.workflowName}`} />
                  ) : (
                    <StatusBadge label={`${t('command.proposal.agent')}: ${proposal.route.agentName}`} />
                  )}
                  {proposal.mayRequireReview ? <StatusBadge label={t('command.proposal.mayReview')} tone="warning" /> : <StatusBadge label={t('command.proposal.noReview')} tone="neutral" />}
                </div>
              </div>

              <div className="rounded-3xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('command.proposal.plan')}</div>
                <div className="mt-3 grid gap-2">
                  {proposal.steps.map((s, idx) => (
                    <div key={idx} className="rounded-2xl border border-black/5 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{s.title}</div>
                        <StatusBadge label={t(`command.step.${s.kind}`)} tone="neutral" />
                      </div>
                      <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{s.description}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  disabled={!token || busy}
                  onClick={async () => {
                    if (!token) return
                    setBusy(true)
                    await confirmAndRun(token)
                    setBusy(false)
                  }}
                >
                  {t('command.actions.confirmRun')}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('command.proposal.confirmHint')}</div>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title={t('command.proposal.emptyTitle')}
                description={t('command.proposal.emptyHint')}
                actions={
                  <button
                    type="button"
                    className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                    disabled={!token || !input.trim() || busy}
                    onClick={async () => {
                      if (!token) return
                      setBusy(true)
                      await generatePlan(token)
                      setBusy(false)
                    }}
                  >
                    <Wand2 className="h-4 w-4" />
                    {t('command.actions.analyze')}
                  </button>
                }
              />
            </div>
          )}

          {runStatus !== 'idle' ? (
            <div className="mt-4 rounded-3xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  <BadgeCheck className="h-4 w-4" />
                  {t('command.run.title')}
                </div>
                <StatusBadge
                  label={runStatus === 'running' ? t('command.run.running') : runStatus === 'waiting_review' ? t('command.run.waitingReview') : t('command.run.done')}
                  tone={runStatus === 'waiting_review' ? 'warning' : runStatus === 'done' ? 'success' : 'info'}
                />
              </div>
              {lastRun ? (
                <div className="mt-3 grid gap-2">
                  <div className="text-sm text-slate-700 dark:text-slate-200">
                    {t('command.run.resultHint')}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/app/execution/runs/${lastRun.runId}`}
                      className="inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                    >
                      {t('command.run.openRun')}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to="/app/execution"
                      className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                    >
                      {t('command.run.openExecution')}
                    </Link>
                    {lastRun.pendingReviewId ? (
                      <Link
                        to={`/app/reviews/${lastRun.pendingReviewId}`}
                        className="inline-flex h-9 items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-500/15 dark:text-amber-300"
                      >
                        {t('command.run.openReview')}
                      </Link>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </SurfaceCard>
      </div>
    </div>
  )
}
