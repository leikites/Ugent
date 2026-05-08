import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, BadgeCheck, Bot, Layers, Library, Plus, Shapes, Workflow } from 'lucide-react'
import SurfaceCard from '@/components/SurfaceCard'
import PageHeader from '@/components/PageHeader'
import MetricCard from '@/components/MetricCard'
import StatusBadge from '@/components/StatusBadge'
import { toneForRunStatus } from '@/lib/status'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useCatalogStore } from '@/stores/useCatalogStore'

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const token = useAuthStore((s) => s.session?.access_token ?? '')

  const wsStatus = useWorkspaceStore((s) => s.status)
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId)
  const loadDashboard = useWorkspaceStore((s) => s.loadDashboard)

  const catStatus = useCatalogStore((s) => s.status)
  const loadCatalog = useCatalogStore((s) => s.load)
  const workflows = useCatalogStore((s) => s.workflows)
  const runs = useCatalogStore((s) => s.runs)
  const reviews = useCatalogStore((s) => s.reviews)
  const agentInstances = useCatalogStore((s) => s.agentInstances)
  const skillsGlobal = useCatalogStore((s) => s.skillsGlobal)
  const skillsWorkspace = useCatalogStore((s) => s.skillsWorkspace)
  const skillsAgent = useCatalogStore((s) => s.skillsAgent)

  useEffect(() => {
    if (!token) return
    if (wsStatus === 'idle') void loadDashboard(token)
  }, [loadDashboard, token, wsStatus])

  useEffect(() => {
    if (!token || !selectedWorkspaceId) return
    if (catStatus === 'idle' || useCatalogStore.getState().workspaceId !== selectedWorkspaceId) {
      void loadCatalog(token, selectedWorkspaceId)
    }
  }, [catStatus, loadCatalog, selectedWorkspaceId, token])

  const selected = useMemo(() => {
    return workspaces.find((w) => w.id === selectedWorkspaceId) ?? null
  }, [selectedWorkspaceId, workspaces])

  const formatDateTime = useMemo(() => {
    const locale = i18n.resolvedLanguage ?? 'zh-CN'
    const dtf = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
    return (value: string) => dtf.format(new Date(value))
  }, [i18n.resolvedLanguage])

  const enabledAgents = useMemo(() => agentInstances.filter((a) => a.enabled).length, [agentInstances])
  const pendingReviews = useMemo(() => reviews.filter((r) => r.status === 'pending'), [reviews])
  const recentRuns = useMemo(() => runs.slice(0, 5), [runs])

  const agentStatusCounts = useMemo(() => {
    return agentInstances.reduce(
      (acc, a) => {
        acc.total += 1
        acc.enabled += a.enabled ? 1 : 0
        acc.byStatus[a.status] = (acc.byStatus[a.status] ?? 0) + 1
        return acc
      },
      {
        total: 0,
        enabled: 0,
        byStatus: {} as Record<string, number>,
      },
    )
  }, [agentInstances])

  const skillUsage = useMemo(() => {
    const allSkills = [...skillsGlobal, ...skillsWorkspace, ...skillsAgent]
    const byId = new Map(allSkills.map((s) => [s.id, s]))

    const usage = new Map<string, number>()
    let bindingCount = 0
    for (const a of agentInstances) {
      for (const b of a.skillBindings) {
        bindingCount += 1
        usage.set(b.skillId, (usage.get(b.skillId) ?? 0) + 1)
      }
    }

    const top = Array.from(usage.entries())
      .map(([skillId, count]) => ({ skillId, count, skill: byId.get(skillId) ?? null }))
      .filter((x) => x.skill)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      bindingCount,
      total: allSkills.length,
      global: skillsGlobal.length,
      workspace: skillsWorkspace.length,
      agent: skillsAgent.length,
      top: top as Array<{ skillId: string; count: number; skill: { id: string; name: string; scope: string } }>,
    }
  }, [agentInstances, skillsAgent, skillsGlobal, skillsWorkspace])

  const workflowNameById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const w of workflows) map[w.id] = w.name
    return map
  }, [workflows])

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t('dashboard.title')}
        subtitle={selected ? `${t('dashboard.currentWorkspace')}: ${selected.name}` : t('dashboard.subtitle')}
        actions={
          <Link
            to="/app/workspaces"
            className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            {t('dashboard.manageWorkspaces')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <SurfaceCard className="mt-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <MetricCard label={t('dashboard.metrics.workspaces')} value={workspaces.length} icon={<Layers className="h-4 w-4" />} />
          <MetricCard label={t('dashboard.metrics.agents')} value={enabledAgents} icon={<Bot className="h-4 w-4" />} />
          <MetricCard label={t('dashboard.metrics.workflows')} value={workflows.length} icon={<Workflow className="h-4 w-4" />} />
          <MetricCard label={t('dashboard.metrics.pendingReviews')} value={pendingReviews.length} icon={<BadgeCheck className="h-4 w-4" />} />
        </div>
      </SurfaceCard>

      <SurfaceCard className="mt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.quickActions')}</div>
          <StatusBadge label={t('dashboard.quickActionsHint')} tone="info" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Link
            to="/app/workspaces?new=1"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            <Plus className="h-4 w-4" />
            {t('dashboard.actions.createWorkspace')}
          </Link>
          <Link
            to="/app/agents?create=template"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            <Bot className="h-4 w-4" />
            {t('dashboard.actions.createAgent')}
          </Link>
          <Link
            to="/app/workflows?create=workflow"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            <Shapes className="h-4 w-4" />
            {t('dashboard.actions.createWorkflow')}
          </Link>
          <Link
            to="/app/reviews?status=pending"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            <BadgeCheck className="h-4 w-4" />
            {t('dashboard.actions.viewPendingReviews')}
          </Link>
          <Link
            to="/app/skills"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            <Library className="h-4 w-4" />
            {t('dashboard.actions.openSkillLibrary')}
          </Link>
        </div>
      </SurfaceCard>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SurfaceCard className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.workspaceOverview')}</div>
            <StatusBadge label={wsStatus === 'loading' ? t('common.loading') : t('common.ready')} tone={wsStatus === 'loading' ? 'neutral' : 'info'} />
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
            <div className="grid grid-cols-[1fr_120px_120px_140px] gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
              <div>{t('workspaces.columns.name')}</div>
              <div>{t('dashboard.columns.agents')}</div>
              <div>{t('dashboard.columns.workflows')}</div>
              <div>{t('common.updatedAt')}</div>
            </div>
            <div className="divide-y divide-black/5 bg-white/40 dark:divide-white/10 dark:bg-white/5">
              {workspaces.slice(0, 6).map((w) => (
                <Link
                  key={w.id}
                  to={`/app/workspaces/${w.id}`}
                  className="grid grid-cols-[1fr_120px_120px_140px] items-center gap-2 px-4 py-3 text-sm transition hover:bg-slate-50 dark:hover:bg-white/10"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900 dark:text-slate-100">{w.name}</div>
                    <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{w.id}</div>
                  </div>
                  <div className="text-slate-700 dark:text-slate-200">{w.metrics.agents}</div>
                  <div className="text-slate-700 dark:text-slate-200">{w.metrics.workflows}</div>
                  <div className="text-slate-700 dark:text-slate-200">{formatDateTime(w.updatedAt)}</div>
                </Link>
              ))}
            </div>
          </div>
          {workspaces.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-black/5 bg-white/60 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              <div className="font-medium text-slate-900 dark:text-slate-100">{t('dashboard.empty.noWorkspacesTitle')}</div>
              <div className="mt-1 text-xs">{t('dashboard.empty.noWorkspacesBody')}</div>
              <div className="mt-3">
                <Link
                  to="/app/workspaces?new=1"
                  className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                >
                  <Plus className="h-4 w-4" />
                  {t('dashboard.empty.noWorkspacesCta')}
                </Link>
              </div>
            </div>
          ) : null}
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.pendingReviews')}</div>
            <StatusBadge label={String(pendingReviews.length)} tone={pendingReviews.length ? 'warning' : 'neutral'} />
          </div>
          <div className="mt-4 grid gap-2">
            {pendingReviews.slice(0, 5).map((r) => (
              <Link
                key={r.id}
                to={`/app/reviews/${r.id}`}
                className="rounded-2xl border border-black/5 bg-white/60 p-3 text-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 truncate font-medium text-slate-900 dark:text-slate-100">{r.title}</div>
                  <StatusBadge label={t('review.status.pending')} tone="warning" />
                </div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{r.summary}</div>
              </Link>
            ))}
            {pendingReviews.length === 0 ? (
              <div className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                {t('dashboard.noPendingReviews')}
              </div>
            ) : null}
          </div>
          <div className="mt-3">
            <Link
              to="/app/reviews?status=pending"
              className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            >
              {t('dashboard.openReviewCenter')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </SurfaceCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.agentStatus')}</div>
            <StatusBadge label={`${agentStatusCounts.enabled}/${agentStatusCounts.total}`} tone={agentStatusCounts.enabled ? 'info' : 'neutral'} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(['active', 'inactive', 'draft', 'archived'] as const).map((k) => (
              <div key={k} className="rounded-2xl border border-black/5 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t(`agent.status.${k}`)}</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">{agentStatusCounts.byStatus[k] ?? 0}</div>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Link
              to="/app/agents"
              className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            >
              {t('dashboard.openAgents')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </SurfaceCard>

        <SurfaceCard className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.skillOverview')}</div>
            <StatusBadge label={t('dashboard.skillPriority')} tone="info" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <MetricCard label={t('dashboard.skills.total')} value={skillUsage.total} />
            <MetricCard label={t('dashboard.skills.global')} value={skillUsage.global} />
            <MetricCard label={t('dashboard.skills.workspace')} value={skillUsage.workspace} />
            <MetricCard label={t('dashboard.skills.agent')} value={skillUsage.agent} />
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
            <div className="grid grid-cols-[1fr_120px_140px] gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
              <div>{t('dashboard.columns.skill')}</div>
              <div>{t('common.scope')}</div>
              <div>{t('dashboard.columns.usedByAgents')}</div>
            </div>
            <div className="divide-y divide-black/5 bg-white/40 dark:divide-white/10 dark:bg-white/5">
              {skillUsage.top.map((x) => (
                <Link
                  key={x.skillId}
                  to={`/app/skills/${x.skillId}`}
                  className="grid grid-cols-[1fr_120px_140px] items-center gap-2 px-4 py-3 text-sm transition hover:bg-slate-50 dark:hover:bg-white/10"
                >
                  <div className="min-w-0 truncate font-medium text-slate-900 dark:text-slate-100">{x.skill.name}</div>
                  <div>
                    <StatusBadge label={t(`skills.scope.${x.skill.scope}`, { defaultValue: x.skill.scope })} tone="neutral" />
                  </div>
                  <div className="text-slate-700 dark:text-slate-200">{x.count}</div>
                </Link>
              ))}
              {skillUsage.top.length === 0 ? (
                <div className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{t('dashboard.noSkillUsage')}</div>
              ) : null}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-slate-600 dark:text-slate-300">{t('dashboard.skillBindingsTotal', { count: skillUsage.bindingCount })}</div>
            <Link
              to="/app/skills"
              className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            >
              {t('dashboard.openSkillLibrary')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="mt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('dashboard.recentRuns')}</div>
          <Link
            to="/app/execution"
            className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            {t('dashboard.openExecution')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
          <div className="grid grid-cols-[1fr_140px_160px] gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
            <div>{t('dashboard.columns.run')}</div>
            <div>{t('common.status')}</div>
            <div>{t('dashboard.columns.time')}</div>
          </div>
          <div className="divide-y divide-black/5 bg-white/40 dark:divide-white/10 dark:bg-white/5">
            {recentRuns.map((r) => (
              <Link
                key={r.id}
                to={`/app/execution/runs/${r.id}`}
                className="grid grid-cols-[1fr_140px_160px] items-center gap-2 px-4 py-3 text-sm transition hover:bg-slate-50 dark:hover:bg-white/10"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-900 dark:text-slate-100">
                    {workflowNameById[r.workflowId] ?? r.workflowId}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{r.id}</div>
                </div>
                <div>
                  <StatusBadge label={t(`run.status.${r.status}`, { defaultValue: r.status })} tone={toneForRunStatus(r.status)} />
                </div>
                <div className="text-slate-700 dark:text-slate-200">{formatDateTime(r.createdAt)}</div>
              </Link>
            ))}
            {recentRuns.length === 0 ? (
              <div className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{t('dashboard.noRecentRuns')}</div>
            ) : null}
          </div>
        </div>
      </SurfaceCard>
    </div>
  )
}
