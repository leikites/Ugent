import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, PencilLine, Power, Puzzle } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SurfaceCard from '@/components/SurfaceCard'
import StatusBadge from '@/components/StatusBadge'
import AgentSkillBindingsModal from '@/components/skills/AgentSkillBindingsModal'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useCatalogStore } from '@/stores/useCatalogStore'

export default function WorkspaceAgentDetail() {
  const { t } = useTranslation()
  const token = useAuthStore((s) => s.session?.access_token ?? '')
  const { agentId = '' } = useParams()
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId)
  const workspaces = useWorkspaceStore((s) => s.workspaces)

  const status = useCatalogStore((s) => s.status)
  const load = useCatalogStore((s) => s.load)
  const agentInstances = useCatalogStore((s) => s.agentInstances)
  const toggle = useCatalogStore((s) => s.toggleAgentEnabled)
  const updateAgentInstance = useCatalogStore((s) => s.updateAgentInstance)
  const setAgentSkillBindings = useCatalogStore((s) => s.setAgentSkillBindings)
  const workflows = useCatalogStore((s) => s.workflows)
  const skillsGlobal = useCatalogStore((s) => s.skillsGlobal)
  const skillsWorkspace = useCatalogStore((s) => s.skillsWorkspace)
  const skillsAgent = useCatalogStore((s) => s.skillsAgent)
  const systemTemplates = useCatalogStore((s) => s.systemTemplates)
  const customTemplates = useCatalogStore((s) => s.customTemplates)

  const [editOpen, setEditOpen] = useState(false)
  const [bindingsOpen, setBindingsOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'draft' | 'archived'>('active')
  const [editWorkspaceId, setEditWorkspaceId] = useState('')

  useEffect(() => {
    if (!token || !selectedWorkspaceId) return
    if (status === 'idle' || useCatalogStore.getState().workspaceId !== selectedWorkspaceId) {
      void load(token, selectedWorkspaceId)
    }
  }, [load, selectedWorkspaceId, status, token])

  const agent = useMemo(() => agentInstances.find((a) => a.id === agentId) ?? null, [agentId, agentInstances])
  const template = useMemo(() => {
    const all = [...systemTemplates, ...customTemplates]
    return agent?.templateId ? all.find((t) => t.id === agent.templateId) ?? null : null
  }, [agent?.templateId, customTemplates, systemTemplates])
  const workspaceName = useMemo(() => {
    return workspaces.find((w) => w.id === (agent?.workspaceId ?? selectedWorkspaceId))?.name ?? ''
  }, [agent?.workspaceId, selectedWorkspaceId, workspaces])

  const skillMap = useMemo(() => {
    const m = new Map([...skillsGlobal, ...skillsWorkspace, ...skillsAgent].map((s) => [s.id, s]))
    return m
  }, [skillsAgent, skillsGlobal, skillsWorkspace])

  const boundSkills = useMemo(() => {
    return (agent?.skillBindings ?? [])
      .map((b) => ({ binding: b, skill: skillMap.get(b.skillId) }))
      .filter((x) => Boolean(x.skill))
  }, [agent?.skillBindings, skillMap])

  const agentWorkflows = useMemo(() => {
    if (!agent) return []
    return workflows.filter((wf) => agent.workflowIds.includes(wf.id))
  }, [agent, workflows])

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={agent ? agent.name : t('agents.instanceDetailTitle')}
        subtitle={agent ? `${t('agents.instanceDetailSubtitle')} · ${t('agents.currentWorkspace')}: ${workspaceName}` : t('common.loading')}
        actions={
          agent ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                onClick={() => setBindingsOpen(true)}
              >
                <Puzzle className="h-4 w-4" />
                {t('skills.manageBindings')}
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                onClick={() => {
                  setEditName(agent.name)
                  setEditSummary(agent.summary)
                  setEditStatus(agent.status)
                  setEditWorkspaceId(agent.workspaceId)
                  setEditOpen(true)
                }}
              >
                <PencilLine className="h-4 w-4" />
                {t('common.edit')}
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                onClick={() => {
                  if (!token) return
                  void toggle(token, agent.id)
                }}
              >
                <Power className="h-4 w-4" />
                {agent.enabled ? t('agents.disable') : t('agents.enable')}
              </button>
            </div>
          ) : null
        }
      />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('agents.instanceMeta')}</div>
            {agent ? <StatusBadge label={agent.enabled ? t('agents.enabled') : t('agents.disabled')} tone={agent.enabled ? 'success' : 'neutral'} /> : null}
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              {agent?.summary ?? ''}
            </div>
            {template ? (
              <div className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('agents.templateSource')}</div>
                  <StatusBadge label={template.scope === 'system' ? t('agents.badge.system') : t('agents.badge.custom')} tone={template.scope === 'system' ? 'info' : 'neutral'} />
                </div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{template.name}</div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{template.responsibilities}</div>
              </div>
            ) : null}
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('agents.instanceIsolation')}</div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('agents.instanceIsolationHint')}</div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('skills.boundSkills')}</div>
            <StatusBadge label={`${boundSkills.length}`} tone="neutral" />
          </div>
          <div className="mt-4 grid gap-2">
            {boundSkills.map(({ binding, skill }) => (
              <div
                key={binding.bindingId}
                className="rounded-2xl border border-black/5 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-center justify-between gap-2">
                  <Link to={`/app/skills/${binding.skillId}`} className="min-w-0 truncate font-medium text-slate-900 hover:underline dark:text-slate-100">
                    {skill?.name}
                  </Link>
                  <StatusBadge label={t(`skills.scope.${binding.scope}`)} tone={binding.scope === 'agent' ? 'info' : 'neutral'} />
                </div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{skill?.description}</div>
              </div>
            ))}
            {boundSkills.length === 0 ? (
              <div className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                {t('skills.boundEmpty')}
              </div>
            ) : null}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="mt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workflows.relatedWorkflows')}</div>
          <Link
            to="/app/workflows"
            className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            {t('workflows.openBuilder')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
          <div className="grid grid-cols-[1fr_180px_120px] gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
            <div>{t('workflows.columns.name')}</div>
            <div>{t('workflows.columns.updated')}</div>
            <div>{t('workflows.columns.nodes')}</div>
          </div>
          <div className="divide-y divide-black/5 bg-white/40 dark:divide-white/10 dark:bg-white/5">
            {agentWorkflows.map((wf) => (
              <Link
                key={wf.id}
                to={`/app/workflows/${wf.id}`}
                className="grid grid-cols-[1fr_180px_120px] items-center gap-2 px-4 py-3 text-sm transition hover:bg-slate-50 dark:hover:bg-white/10"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-900 dark:text-slate-100">{wf.name}</div>
                  <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{wf.description}</div>
                </div>
                <div className="text-slate-700 dark:text-slate-200">{wf.updatedAt}</div>
                <div className="text-slate-700 dark:text-slate-200">{wf.nodes.length}</div>
              </Link>
            ))}
            {agentWorkflows.length === 0 ? (
              <div className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{t('workflows.none')}</div>
            ) : null}
          </div>
        </div>
      </SurfaceCard>

      {editOpen && agent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-slate-950">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('agents.editInstanceTitle')}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('agents.editInstanceHint')}</div>

            <div className="mt-4 grid gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('agents.fields.workspace')}</div>
                <select
                  value={editWorkspaceId}
                  onChange={(e) => setEditWorkspaceId(e.target.value)}
                  className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                >
                  {workspaces.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('agents.fields.name')}</div>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('agents.fields.summary')}</div>
                <textarea
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('common.status')}</div>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as typeof editStatus)}
                  className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                >
                  <option value="active">{t('agents.enabled')}</option>
                  <option value="inactive">{t('agents.disabled')}</option>
                  <option value="draft">{t('agents.draft')}</option>
                  <option value="archived">{t('agents.archived')}</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
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
                disabled={!token || !editName.trim() || !editSummary.trim()}
                onClick={async () => {
                  if (!token) return
                  const ok = await updateAgentInstance(token, agent.id, {
                    workspaceId: editWorkspaceId,
                    name: editName,
                    summary: editSummary,
                    status: editStatus,
                  })
                  if (ok) setEditOpen(false)
                }}
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {bindingsOpen && agent ? (
        <AgentSkillBindingsModal
          open={bindingsOpen}
          agent={agent}
          skills={[...skillsGlobal, ...skillsWorkspace, ...skillsAgent]}
          onClose={() => setBindingsOpen(false)}
          onSubmit={async (skillIds) => {
            if (!token) return false
            return setAgentSkillBindings(token, agent.id, skillIds)
          }}
        />
      ) : null}
    </div>
  )
}
