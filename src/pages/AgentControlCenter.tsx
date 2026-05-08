import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, Puzzle, Sparkles } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SurfaceCard from '@/components/SurfaceCard'
import StatusBadge from '@/components/StatusBadge'
import AgentTemplateFormModal, { type AgentTemplateFormValue } from '@/components/agents/AgentTemplateFormModal'
import AgentInstanceFormModal, { type AgentInstanceFormValue } from '@/components/agents/AgentInstanceFormModal'
import AgentInstancesPanel from '@/components/agents/AgentInstancesPanel'
import CustomTemplatesPanel from '@/components/agents/CustomTemplatesPanel'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useCatalogStore } from '@/stores/useCatalogStore'
import type { AgentTemplate, Id } from '@/types/domain'

type TabKey = 'system' | 'custom' | 'instances'

export default function AgentControlCenter() {
  const { t } = useTranslation()
  const token = useAuthStore((s) => s.session?.access_token ?? '')
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId)
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace)

  const status = useCatalogStore((s) => s.status)
  const load = useCatalogStore((s) => s.load)
  const systemTemplates = useCatalogStore((s) => s.systemTemplates)
  const customTemplates = useCatalogStore((s) => s.customTemplates)
  const agentInstances = useCatalogStore((s) => s.agentInstances)
  const toggleAgentEnabled = useCatalogStore((s) => s.toggleAgentEnabled)
  const skillsGlobal = useCatalogStore((s) => s.skillsGlobal)
  const skillsWorkspace = useCatalogStore((s) => s.skillsWorkspace)
  const createCustomTemplate = useCatalogStore((s) => s.createCustomTemplate)
  const updateCustomTemplate = useCatalogStore((s) => s.updateCustomTemplate)
  const createAgentInstance = useCatalogStore((s) => s.createAgentInstance)

  const [searchParams] = useSearchParams()
  const qsWorkspaceId = searchParams.get('workspaceId')
  const qsCreate = searchParams.get('create')

  const [tab, setTab] = useState<TabKey>('instances')
  const [templateModal, setTemplateModal] = useState<{ open: boolean; mode: 'create' | 'edit'; templateId?: Id }>({
    open: false,
    mode: 'create',
  })
  const [instanceModalOpen, setInstanceModalOpen] = useState(false)

  useEffect(() => {
    if (!qsWorkspaceId) return
    if (qsWorkspaceId !== selectedWorkspaceId) selectWorkspace(qsWorkspaceId)
  }, [qsWorkspaceId, selectWorkspace, selectedWorkspaceId])

  useEffect(() => {
    if (!token || !selectedWorkspaceId) return
    if (status === 'idle' || useCatalogStore.getState().workspaceId !== selectedWorkspaceId) {
      void load(token, selectedWorkspaceId)
    }
  }, [load, selectedWorkspaceId, status, token])

  useEffect(() => {
    if (qsCreate === 'instance') {
      setTab('instances')
      setInstanceModalOpen(true)
    }
    if (qsCreate === 'template') {
      setTab('custom')
      setTemplateModal({ open: true, mode: 'create' })
    }
  }, [qsCreate])

  const workspace = useMemo(() => {
    if (!selectedWorkspaceId) return null
    return workspaces.find((w) => w.id === selectedWorkspaceId) ?? null
  }, [selectedWorkspaceId, workspaces])

  const currentWorkspaceArchived = Boolean(workspace?.archivedAt)
  const workspaceName = workspace?.name ?? ''

  const tabs: Array<{ key: TabKey; label: string; hint: string }> = [
    { key: 'instances', label: t('agents.tabs.instances'), hint: t('agents.tabs.instancesHint') },
    { key: 'system', label: t('agents.tabs.systemTemplates'), hint: t('agents.tabs.systemHint') },
    { key: 'custom', label: t('agents.tabs.customTemplates'), hint: t('agents.tabs.customHint') },
  ]

  const templateForEdit: AgentTemplate | null = useMemo(() => {
    if (templateModal.mode !== 'edit' || !templateModal.templateId) return null
    return customTemplates.find((t) => t.id === templateModal.templateId) ?? null
  }, [customTemplates, templateModal.mode, templateModal.templateId])

  const allSkills = useMemo(() => [...skillsGlobal, ...skillsWorkspace], [skillsGlobal, skillsWorkspace])

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t('agents.title')}
        subtitle={workspaceName ? `${t('agents.subtitle')} · ${t('agents.currentWorkspace')}: ${workspaceName}` : t('agents.subtitle')}
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
            <button
              type="button"
              className={
                currentWorkspaceArchived
                  ? 'inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500'
                  : 'inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
              }
              disabled={currentWorkspaceArchived}
              onClick={() => {
                setInstanceModalOpen(true)
                setTab('instances')
              }}
            >
              <Plus className="h-4 w-4" />
              {t('agents.createInstance')}
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
              onClick={() => {
                setTemplateModal({ open: true, mode: 'create' })
                setTab('custom')
              }}
            >
              <Plus className="h-4 w-4" />
              {t('agents.createTemplate')}
            </button>
          </div>
        }
      />

      <SurfaceCard className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {tabs.map((it) => (
              <button
                key={it.key}
                type="button"
                onClick={() => setTab(it.key)}
                className={
                  tab === it.key
                    ? 'inline-flex h-9 items-center rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-900'
                    : 'inline-flex h-9 items-center rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10'
                }
              >
                {it.label}
              </button>
            ))}
          </div>
          <StatusBadge label={status === 'loading' ? t('common.loading') : t('common.ready')} tone={status === 'loading' ? 'neutral' : 'info'} />
        </div>
        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{tabs.find((x) => x.key === tab)?.hint}</div>
      </SurfaceCard>

      {tab === 'instances' ? (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AgentInstancesPanel
            token={token}
            workspaces={workspaces}
            instances={agentInstances}
            onToggle={toggleAgentEnabled}
            onCreate={() => {
              setInstanceModalOpen(true)
              setTab('instances')
            }}
            createDisabled={currentWorkspaceArchived}
          />
          <SurfaceCard>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Puzzle className="h-4 w-4" />
              {t('agents.instances.bindingModelTitle')}
            </div>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('agents.instances.bindingModelHint')}</div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{t('agents.instances.rulesTitle')}</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('agents.instances.rulesText')}</div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <StatusBadge label={t('skills.scope.agent')} tone="info" />
                  <StatusBadge label={t('skills.scope.workspace')} tone="neutral" />
                  <StatusBadge label={t('skills.scope.global')} tone="neutral" />
                </div>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-white/5">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{t('agents.instances.futureTitle')}</div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('agents.instances.futureText')}</div>
              </div>
            </div>
          </SurfaceCard>
        </div>
      ) : null}

      {tab === 'system' ? (
        <SurfaceCard className="mt-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('agents.templates.system')}</div>
            <StatusBadge label={`${systemTemplates.length}`} tone="neutral" />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {systemTemplates.map((tpl) => (
              <Link
                key={tpl.id}
                to={`/app/agents/templates/${tpl.id}`}
                className="rounded-3xl border border-black/5 bg-white/60 p-4 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{tpl.name}</div>
                  <StatusBadge label={t('agents.badge.system')} tone="info" />
                </div>
                <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{tpl.summary}</div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge label={`${t('agents.recommendedSkills')}: ${tpl.recommendedSkillIds.length}`} />
                </div>
              </Link>
            ))}
          </div>
        </SurfaceCard>
      ) : null}

      {tab === 'custom' ? (
        <CustomTemplatesPanel
          templates={customTemplates}
          onEdit={(templateId) => {
            setTemplateModal({ open: true, mode: 'edit', templateId })
          }}
        />
      ) : null}

      {customTemplates.length === 0 && tab === 'custom' ? (
        <SurfaceCard className="mt-4">
          <div className="rounded-3xl border border-black/5 bg-white/60 p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <div className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
              <Sparkles className="h-4 w-4" />
              {t('agents.customEmptyTitle')}
            </div>
            <div className="mt-2">{t('agents.customEmptyHint')}</div>
          </div>
        </SurfaceCard>
      ) : null}

      <AgentTemplateFormModal
        open={templateModal.open}
        mode={templateModal.mode}
        initial={templateForEdit}
        skills={allSkills}
        onClose={() => setTemplateModal({ open: false, mode: 'create' })}
        onSubmit={async (value: AgentTemplateFormValue) => {
          if (!token) return false
          if (templateModal.mode === 'edit' && templateModal.templateId) {
            return updateCustomTemplate(token, templateModal.templateId, value)
          }
          return createCustomTemplate(token, value)
        }}
      />

      <AgentInstanceFormModal
        open={instanceModalOpen}
        workspaces={workspaces}
        templates={[...systemTemplates, ...customTemplates]}
        defaultWorkspaceId={selectedWorkspaceId}
        disabled={currentWorkspaceArchived}
        onClose={() => setInstanceModalOpen(false)}
        onSubmit={async (value: AgentInstanceFormValue) => {
          if (!token) return false
          return createAgentInstance(token, {
            workspaceId: value.workspaceId,
            templateId: value.templateId,
            name: value.name,
            summary: value.summary,
            status: value.status,
          })
        }}
      />
    </div>
  )
}
