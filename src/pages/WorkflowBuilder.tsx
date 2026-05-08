import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Save } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SurfaceCard from '@/components/SurfaceCard'
import StatusBadge from '@/components/StatusBadge'
import CreateWorkflowModal from '@/components/workflows/CreateWorkflowModal'
import WorkflowListPanel from '@/components/workflows/WorkflowListPanel'
import WorkflowEditorPanel from '@/components/workflows/WorkflowEditorPanel'
import WorkflowNodeConfigPanel from '@/components/workflows/WorkflowNodeConfigPanel'
import { createDraftNode, ensureLinear, type WorkflowDraft } from '@/components/workflows/draft'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useCatalogStore } from '@/stores/useCatalogStore'
import type { WorkflowNode } from '@/types/domain'

export default function WorkflowBuilder() {
  const { t } = useTranslation()
  const token = useAuthStore((s) => s.session?.access_token ?? '')
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId)
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace)
  const workspaces = useWorkspaceStore((s) => s.workspaces)

  const status = useCatalogStore((s) => s.status)
  const load = useCatalogStore((s) => s.load)
  const workflows = useCatalogStore((s) => s.workflows)
  const runs = useCatalogStore((s) => s.runs)
  const agentInstances = useCatalogStore((s) => s.agentInstances)
  const createWorkflow = useCatalogStore((s) => s.createWorkflow)
  const updateWorkflow = useCatalogStore((s) => s.updateWorkflow)

  const [searchParams] = useSearchParams()
  const qsWorkspaceId = searchParams.get('workspaceId')
  const qsWorkflowId = searchParams.get('workflowId')
  const qsCreate = searchParams.get('create')

  const [workflowId, setWorkflowId] = useState('')
  const [draft, setDraft] = useState<WorkflowDraft | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState('')
  const [dirty, setDirty] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

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
    if (qsCreate === 'workflow') setCreateOpen(true)
  }, [qsCreate])

  useEffect(() => {
    if (qsWorkflowId) setWorkflowId(qsWorkflowId)
  }, [qsWorkflowId])

  useEffect(() => {
    if (!workflowId && workflows[0]?.id) setWorkflowId(workflows[0].id)
  }, [workflowId, workflows])

  const workflow = useMemo(() => {
    return workflows.find((w) => w.id === workflowId) ?? workflows[0] ?? null
  }, [workflowId, workflows])

  useEffect(() => {
    if (!workflow) return
    setDraft({ id: workflow.id, name: workflow.name, description: workflow.description, nodes: workflow.nodes })
    setSelectedNodeId(workflow.nodes[0]?.id ?? '')
    setDirty(false)
  }, [workflow])

  const workspace = useMemo(() => {
    if (!selectedWorkspaceId) return null
    return workspaces.find((w) => w.id === selectedWorkspaceId) ?? null
  }, [selectedWorkspaceId, workspaces])
  const workspaceArchived = Boolean(workspace?.archivedAt)

  const getLastRunStatus = useMemo(() => {
    const byWf = new Map<string, string>()
    runs
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .forEach((r) => {
        if (!byWf.has(r.workflowId)) byWf.set(r.workflowId, r.status)
      })
    return (id: string) => byWf.get(id) ?? '-'
  }, [runs])

  const selectedNode = useMemo(() => {
    return draft?.nodes.find((n) => n.id === selectedNodeId) ?? null
  }, [draft?.nodes, selectedNodeId])

  const canSave = Boolean(token && selectedWorkspaceId && draft?.name.trim() && draft?.description.trim() && dirty && !workspaceArchived)

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t('workflows.title')}
        subtitle={workspace ? `${t('workflows.subtitle')} · ${t('agents.currentWorkspace')}: ${workspace.name}` : t('workflows.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={
                canSave
                  ? 'inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                  : 'inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500'
              }
              disabled={!canSave}
              onClick={async () => {
                if (!token || !selectedWorkspaceId || !draft) return
                const nodes = ensureLinear(draft.nodes)
                if (draft.id) {
                  const ok = await updateWorkflow(token, draft.id, { name: draft.name, description: draft.description, nodes })
                  if (ok) setDirty(false)
                  return
                }
                const id = await createWorkflow(token, { workspaceId: selectedWorkspaceId, name: draft.name, description: draft.description, nodes })
                if (id) {
                  setWorkflowId(id)
                  setDirty(false)
                }
              }}
            >
              <Save className="h-4 w-4" />
              {t('workflows.save')}
            </button>
            <StatusBadge label={status === 'loading' ? t('common.loading') : t('common.ready')} tone={status === 'loading' ? 'neutral' : 'info'} />
          </div>
        }
      />

      {workspaceArchived ? (
        <SurfaceCard className="mt-4">
          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
            {t('workflows.workspaceArchivedHint')}
          </div>
        </SurfaceCard>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr_340px]">
        <WorkflowListPanel
          workflows={workflows}
          selectedId={workflow?.id ?? ''}
          workspaceArchived={workspaceArchived}
          getLastRunStatus={getLastRunStatus}
          onSelect={(id) => {
            setWorkflowId(id)
            setSelectedNodeId('')
          }}
          onCreate={() => setCreateOpen(true)}
        />
        <WorkflowEditorPanel
          draft={draft}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
          agentInstances={agentInstances}
          onDirty={() => setDirty(true)}
          onChange={(next) => setDraft(next)}
        />
        <WorkflowNodeConfigPanel
          node={selectedNode}
          agentInstances={agentInstances}
          onChange={(patch) => {
            if (!draft || !selectedNode) return
            const nextNodes = draft.nodes.map((n) => {
              if (n.id !== selectedNode.id) return n
              if (n.type === 'agent' && patch.agentId !== undefined) {
                const cfg = n.config.type === 'agent' ? { ...n.config, agentId: patch.agentId } : n.config
                return { ...n, ...patch, config: cfg }
              }
              return { ...n, ...patch }
            })
            setDirty(true)
            setDraft({ ...draft, nodes: nextNodes })
          }}
        />
      </div>

      <CreateWorkflowModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onStartBuild={({ name, description }) => {
          const tenantId = 'local'
          const wfId = 'draft'
          const nodes: WorkflowNode[] = [
            createDraftNode('start', tenantId, wfId, t('workflow.node.start')),
            createDraftNode('end', tenantId, wfId, t('workflow.node.end')),
          ]
          setDraft({ id: null, name, description, nodes })
          setWorkflowId('')
          setSelectedNodeId(nodes[0].id)
          setDirty(true)
          setCreateOpen(false)
        }}
      />
    </div>
  )
}
