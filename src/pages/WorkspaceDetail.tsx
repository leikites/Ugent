import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, BadgeCheck, Bot, PencilLine, Plus, Puzzle, Trash2, Workflow } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SurfaceCard from '@/components/SurfaceCard'
import MetricCard from '@/components/MetricCard'
import StatusBadge from '@/components/StatusBadge'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useCatalogStore } from '@/stores/useCatalogStore'

export default function WorkspaceDetail() {
  const { t, i18n } = useTranslation()
  const token = useAuthStore((s) => s.session?.access_token ?? '')
  const { workspaceId = '' } = useParams()
  const navigate = useNavigate()

  const wsStatus = useWorkspaceStore((s) => s.status)
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const loadDashboard = useWorkspaceStore((s) => s.loadDashboard)
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace)
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace)
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace)

  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editArchived, setEditArchived] = useState(false)

  const [deleteOpen, setDeleteOpen] = useState(false)

  const catStatus = useCatalogStore((s) => s.status)
  const loadCatalog = useCatalogStore((s) => s.load)
  const systemTemplates = useCatalogStore((s) => s.systemTemplates)
  const customTemplates = useCatalogStore((s) => s.customTemplates)
  const agentInstances = useCatalogStore((s) => s.agentInstances)
  const workflows = useCatalogStore((s) => s.workflows)
  const runs = useCatalogStore((s) => s.runs)
  const reviews = useCatalogStore((s) => s.reviews)
  const skillsGlobal = useCatalogStore((s) => s.skillsGlobal)
  const skillsWorkspace = useCatalogStore((s) => s.skillsWorkspace)
  const skillsAgent = useCatalogStore((s) => s.skillsAgent)

  useEffect(() => {
    if (!token) return
    if (wsStatus === 'idle') void loadDashboard(token)
  }, [loadDashboard, token, wsStatus])

  useEffect(() => {
    if (!token || !workspaceId) return
    if (catStatus === 'idle' || useCatalogStore.getState().workspaceId !== workspaceId) {
      void loadCatalog(token, workspaceId)
    }
  }, [catStatus, loadCatalog, token, workspaceId])

  const workspace = useMemo(() => workspaces.find((w) => w.id === workspaceId) ?? null, [workspaceId, workspaces])

  const formatDateTime = useMemo(() => {
    const locale = i18n.resolvedLanguage ?? 'zh-CN'
    const dtf = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
    return (value: string) => dtf.format(new Date(value))
  }, [i18n.resolvedLanguage])

  const pending = useMemo(() => reviews.filter((r) => r.status === 'pending').length, [reviews])
  const enabledAgents = useMemo(() => agentInstances.filter((a) => a.enabled).length, [agentInstances])

  const pendingReviews = useMemo(() => reviews.filter((r) => r.status === 'pending').slice(0, 5), [reviews])

  const topSkills = useMemo(() => {
    const all = [...skillsGlobal, ...skillsWorkspace, ...skillsAgent]
    return all.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6)
  }, [skillsAgent, skillsGlobal, skillsWorkspace])

  const recentRuns = useMemo(() => {
    return runs.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)
  }, [runs])

  const workflowName = useMemo(() => {
    const map = new Map(workflows.map((w) => [w.id, w.name]))
    return (id: string) => map.get(id) ?? id
  }, [workflows])

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={workspace ? workspace.name : t('workspaces.detailTitle')}
        subtitle={workspace ? `${t('workspaces.detailSubtitle')} · ${t('common.updatedAt')}: ${formatDateTime(workspace.updatedAt)}` : t('common.loading')}
        actions={
          <div className="flex items-center gap-2">
            {workspace ? (
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                onClick={() => {
                  setEditName(workspace.name)
                  setEditDesc(workspace.description)
                  setEditArchived(Boolean(workspace.archivedAt))
                  setEditOpen(true)
                }}
              >
                <PencilLine className="h-4 w-4" />
                {t('common.edit')}
              </button>
            ) : null}
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
              onClick={() => {
                if (!workspaceId) return
                selectWorkspace(workspaceId)
              }}
            >
              {t('workspaces.setCurrent')}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        }
      />

      <SurfaceCard className="mt-4">
        {workspace?.archivedAt ? (
          <div className="mb-3 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
            {t('workspaces.archivedHint')}
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <MetricCard label={t('workspace.metrics.enabledAgents')} value={enabledAgents} icon={<Bot className="h-4 w-4" />} />
          <MetricCard label={t('workspace.metrics.workflows')} value={workflows.length} icon={<Workflow className="h-4 w-4" />} />
          <MetricCard label={t('workspace.metrics.pendingReviews')} value={pending} />
          <MetricCard label={t('workspace.metrics.recentRuns')} value={runs.length} />
        </div>
      </SurfaceCard>

      {workspace ? (
        <SurfaceCard className="mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workspaces.overview')}</div>
            <StatusBadge label={workspace.archivedAt ? t('workspaces.archived') : t('workspaces.active')} tone={workspace.archivedAt ? 'neutral' : 'info'} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-black/5 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('workspaces.fields.description')}</div>
              <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">{workspace.description || t('workspaces.noDescription')}</div>
            </div>
            <div className="rounded-3xl border border-black/5 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('common.updatedAt')}</div>
              <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">{formatDateTime(workspace.updatedAt)}</div>
            </div>
            <div className="rounded-3xl border border-black/5 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('workspaces.quickActions')}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={`/app/agents?workspaceId=${workspace.id}&create=instance`}
                  className={
                    workspace.archivedAt
                      ? 'pointer-events-none inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500'
                      : 'inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10'
                  }
                >
                  <Plus className="h-4 w-4" />
                  {t('workspace.createAgent')}
                </Link>
                <Link
                  to={`/app/workflows?workspaceId=${workspace.id}&create=workflow`}
                  className={
                    workspace.archivedAt
                      ? 'pointer-events-none inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500'
                      : 'inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                  }
                >
                  <Plus className="h-4 w-4" />
                  {t('workspace.createWorkflow')}
                </Link>
              </div>
            </div>
          </div>
        </SurfaceCard>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workspace.section.agents')}</div>
            <Link
              to="/app/agents"
              className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            >
              {t('workspace.openAgents')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
            <div className="grid grid-cols-[1fr_120px_120px] gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
              <div>{t('agents.columns.name')}</div>
              <div>{t('agents.columns.type')}</div>
              <div>{t('agents.columns.status')}</div>
            </div>
            <div className="divide-y divide-black/5 bg-white/40 dark:divide-white/10 dark:bg-white/5">
              {agentInstances.slice(0, 6).map((a) => (
                <Link
                  key={a.id}
                  to={`/app/agents/instances/${a.id}`}
                  className="grid grid-cols-[1fr_120px_120px] items-center gap-2 px-4 py-3 text-sm transition hover:bg-slate-50 dark:hover:bg-white/10"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900 dark:text-slate-100">{a.name}</div>
                    <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{a.summary}</div>
                  </div>
                  <div className="text-slate-700 dark:text-slate-200">{a.templateId ? t('agents.type.fromTemplate') : t('agents.type.custom')}</div>
                  <div>
                    <StatusBadge label={a.enabled ? t('agents.enabled') : t('agents.disabled')} tone={a.enabled ? 'success' : 'neutral'} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workspace.section.workflows')}</div>
            <Link
              to="/app/workflows"
              className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            >
              {t('workspace.openWorkflows')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
            <div className="grid grid-cols-[1fr_160px_120px] gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
              <div>{t('workflows.columns.name')}</div>
              <div>{t('workflows.columns.updated')}</div>
              <div>{t('workflows.columns.nodes')}</div>
            </div>
            <div className="divide-y divide-black/5 bg-white/40 dark:divide-white/10 dark:bg-white/5">
              {workflows.slice(0, 6).map((wf) => (
                <Link
                  key={wf.id}
                  to={`/app/workflows/${wf.id}`}
                  className="grid grid-cols-[1fr_160px_120px] items-center gap-2 px-4 py-3 text-sm transition hover:bg-slate-50 dark:hover:bg-white/10"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900 dark:text-slate-100">{wf.name}</div>
                    <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{wf.description}</div>
                  </div>
                  <div className="text-slate-700 dark:text-slate-200">{formatDateTime(wf.updatedAt)}</div>
                  <div className="text-slate-700 dark:text-slate-200">{wf.nodes.length}</div>
                </Link>
              ))}
            </div>
          </div>
        </SurfaceCard>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workspace.section.skills')}</div>
            <Link
              to="/app/skills"
              className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            >
              {t('workspace.openSkills')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MetricCard label={t('workspace.metrics.globalSkills')} value={skillsGlobal.length} icon={<Puzzle className="h-4 w-4" />} />
            <MetricCard label={t('workspace.metrics.workspaceSkills')} value={skillsWorkspace.length} icon={<Puzzle className="h-4 w-4" />} />
            <MetricCard label={t('workspace.metrics.agentSkills')} value={skillsAgent.length} icon={<Puzzle className="h-4 w-4" />} />
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
            <div className="grid grid-cols-[1fr_120px_160px] gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
              <div>{t('skills.columns.name')}</div>
              <div>{t('skills.columns.scope')}</div>
              <div>{t('common.updatedAt')}</div>
            </div>
            <div className="divide-y divide-black/5 bg-white/40 dark:divide-white/10 dark:bg-white/5">
              {topSkills.map((s) => (
                <Link
                  key={s.id}
                  to={`/app/skills/${s.id}`}
                  className="grid grid-cols-[1fr_120px_160px] items-center gap-2 px-4 py-3 text-sm transition hover:bg-slate-50 dark:hover:bg-white/10"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900 dark:text-slate-100">{s.name}</div>
                    <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{s.description}</div>
                  </div>
                  <div>
                    <StatusBadge label={t(`skills.scope.${s.scope}`)} tone={s.scope === 'agent' ? 'info' : 'neutral'} />
                  </div>
                  <div className="text-slate-700 dark:text-slate-200">{formatDateTime(s.updatedAt)}</div>
                </Link>
              ))}
              {topSkills.length === 0 ? (
                <div className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{t('skills.empty')}</div>
              ) : null}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workspace.section.pendingReviews')}</div>
            <Link
              to="/app/reviews"
              className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            >
              {t('workspace.openReviews')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('workspace.pendingReviewsHint')}</div>
          <div className="mt-4 grid gap-2">
            {pendingReviews.map((r) => (
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
                <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                  <BadgeCheck className="h-4 w-4" />
                  {t('workspace.noPendingReviews')}
                </div>
                <div className="mt-2">{t('workspace.noPendingReviewsHint')}</div>
              </div>
            ) : null}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="mt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workspace.section.recentRuns')}</div>
          <Link
            to="/app/execution"
            className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            {t('workspace.openExecution')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
          <div className="grid grid-cols-[1fr_200px_140px_120px] gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
            <div>{t('execution.columns.workflow')}</div>
            <div>{t('execution.columns.created')}</div>
            <div>{t('execution.columns.status')}</div>
            <div className="text-right"> </div>
          </div>
          <div className="divide-y divide-black/5 bg-white/40 dark:divide-white/10 dark:bg-white/5">
            {recentRuns.map((r) => (
              <Link
                key={r.id}
                to={`/app/execution/runs/${r.id}`}
                className="grid grid-cols-[1fr_200px_140px_120px] items-center gap-2 px-4 py-3 text-sm transition hover:bg-slate-50 dark:hover:bg-white/10"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-900 dark:text-slate-100">{workflowName(r.workflowId)}</div>
                  <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{r.id}</div>
                </div>
                <div className="text-slate-700 dark:text-slate-200">{formatDateTime(r.createdAt)}</div>
                <div>
                  <StatusBadge
                    label={t(`run.status.${r.status}`, { defaultValue: r.status })}
                    tone={r.status === 'succeeded' ? 'success' : r.status === 'failed' ? 'danger' : r.status === 'waiting_review' ? 'warning' : 'neutral'}
                  />
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

      <SurfaceCard className="mt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workspace.section.templates')}</div>
          <StatusBadge label={`${t('agents.templates.system')}: ${systemTemplates.length} · ${t('agents.templates.custom')}: ${customTemplates.length}`} tone="neutral" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-3xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('agents.templates.system')}</div>
            <div className="mt-2 grid gap-2">
              {systemTemplates.slice(0, 3).map((tpl) => (
                <Link
                  key={tpl.id}
                  to={`/app/agents/templates/${tpl.id}`}
                  className="rounded-2xl border border-black/5 bg-white/60 p-3 text-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <div className="font-medium text-slate-900 dark:text-slate-100">{tpl.name}</div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{tpl.summary}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('agents.templates.custom')}</div>
            <div className="mt-2 grid gap-2">
              {customTemplates.slice(0, 3).map((tpl) => (
                <Link
                  key={tpl.id}
                  to={`/app/agents/templates/${tpl.id}`}
                  className="rounded-2xl border border-black/5 bg-white/60 p-3 text-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <div className="font-medium text-slate-900 dark:text-slate-100">{tpl.name}</div>
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{tpl.summary}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </SurfaceCard>

      {editOpen && workspace ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-slate-950">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workspaces.editTitle')}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('workspaces.editHint')}</div>

            <div className="mt-4 grid gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('workspaces.fields.name')}</div>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                  placeholder={t('workspace.namePlaceholder')}
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('workspaces.fields.description')}</div>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                  placeholder={t('workspaces.descriptionPlaceholder')}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={editArchived}
                  onChange={(e) => setEditArchived(e.target.checked)}
                  className="h-4 w-4 rounded border border-black/20"
                />
                {t('workspaces.fields.archived')}
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/15 disabled:opacity-50 dark:text-rose-200"
                disabled={!token || workspaces.length <= 1}
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                {t('workspaces.delete')}
              </button>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                  onClick={() => setEditOpen(false)}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  disabled={!token || !editName.trim()}
                  onClick={async () => {
                    if (!token) return
                    const ok = await updateWorkspace(token, workspace.id, {
                      name: editName,
                      description: editDesc,
                      archived: editArchived,
                    })
                    if (ok) setEditOpen(false)
                  }}
                >
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteOpen && workspace ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-slate-950">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workspaces.deleteTitle')}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('workspaces.deleteHint')}</div>

            <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-800 dark:text-rose-200">
              {t('workspaces.deleteWarning', { name: workspace.name })}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                onClick={() => setDeleteOpen(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-2xl bg-rose-600 px-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
                disabled={!token || workspaces.length <= 1}
                onClick={async () => {
                  if (!token) return
                  const ok = await deleteWorkspace(token, workspace.id)
                  if (ok) {
                    setDeleteOpen(false)
                    setEditOpen(false)
                    navigate('/app/workspaces')
                  }
                }}
              >
                {t('workspaces.deleteConfirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
