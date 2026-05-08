import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronsUpDown, Trash2, UserRoundCog, Workflow as WorkflowIcon } from 'lucide-react'
import SurfaceCard from '@/components/SurfaceCard'
import StatusBadge from '@/components/StatusBadge'
import type { AgentInstance, WorkflowNode } from '@/types/domain'
import { createDraftNode, ensureLinear, type WorkflowDraft } from './draft'

export default function WorkflowEditorPanel(props: {
  draft: WorkflowDraft | null
  selectedNodeId: string
  onSelectNode: (nodeId: string) => void
  agentInstances: AgentInstance[]
  onChange: (next: WorkflowDraft) => void
  onDirty: () => void
}) {
  const { t } = useTranslation()
  const { draft, selectedNodeId, onSelectNode, agentInstances, onChange, onDirty } = props

  const agentMap = new Map(agentInstances.map((a) => [a.id, a.name]))
  const agentName = (id: string | null) => (id ? agentMap.get(id) ?? id : '-')

  if (!draft) {
    return (
      <SurfaceCard>
        <div className="rounded-3xl border border-black/5 bg-white/60 p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          {t('workflows.selectHint')}
        </div>
      </SurfaceCard>
    )
  }

  const safeNodes = ensureLinear(draft.nodes)
  const head = safeNodes[0]
  const tail = safeNodes[safeNodes.length - 1]
  const mid = safeNodes.slice(1, -1)

  return (
    <SurfaceCard>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <WorkflowIcon className="h-4 w-4" />
            {t('workflows.builderTitle')}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('workflows.builderHint')}</div>
        </div>
        {draft.id ? (
          <Link
            to={`/app/workflows/${draft.id}`}
            className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
          >
            {t('workflows.openDetail')}
          </Link>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('workflows.fields.name')}</div>
            <input
              value={draft.name}
              onChange={(e) => {
                onDirty()
                onChange({ ...draft, name: e.target.value })
              }}
              className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
              placeholder={t('workflows.fields.namePlaceholder')}
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('workflows.fields.description')}</div>
            <input
              value={draft.description}
              onChange={(e) => {
                onDirty()
                onChange({ ...draft, description: e.target.value })
              }}
              className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
              placeholder={t('workflows.fields.descriptionPlaceholder')}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workflows.nodesTitle')}</div>
          <select
            className="h-9 rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
            defaultValue=""
            onChange={(e) => {
              const val = e.target.value as WorkflowNode['type']
              e.target.value = ''
              const node = createDraftNode(val, head.tenantId, head.workflowId, t(`workflow.nodeType.${val}`, { defaultValue: val }))
              onDirty()
              onChange({ ...draft, nodes: [head, ...mid, node, tail] })
              onSelectNode(node.id)
            }}
          >
            <option value="">{t('workflows.addNode')}</option>
            <option value="agent">{t('workflow.node.agent')}</option>
            <option value="review">{t('workflow.node.review')}</option>
            <option value="condition">{t('workflow.node.condition')}</option>
          </select>
        </div>

        <div className="grid gap-2">
          {safeNodes.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onSelectNode(n.id)}
              className={
                selectedNodeId === n.id
                  ? 'w-full rounded-3xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-left'
                  : 'w-full rounded-3xl border border-black/5 bg-white/60 p-4 text-left transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{n.title}</div>
                    <StatusBadge label={t(`workflow.nodeType.${n.type}`, { defaultValue: n.type })} tone={n.type === 'review' ? 'warning' : 'neutral'} />
                  </div>
                  <div className="mt-1 truncate text-xs text-slate-600 dark:text-slate-300">{n.description || t('workflows.nodeNoDescription')}</div>
                  {n.type === 'agent' ? (
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <UserRoundCog className="h-3.5 w-3.5" />
                      {agentName(n.agentId)}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-8 items-center gap-2 rounded-2xl border border-black/10 bg-white px-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                      disabled={n.type === 'start' || n.type === 'end'}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        onDirty()
                        const next = safeNodes.filter((x) => x.id !== n.id)
                        onChange({ ...draft, nodes: ensureLinear(next) })
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {n.type !== 'start' && n.type !== 'end' ? (
                      <button
                        type="button"
                        className="inline-flex h-8 items-center gap-2 rounded-2xl border border-black/10 bg-white px-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                        disabled={mid.findIndex((x) => x.id === n.id) <= 0}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const pos = mid.findIndex((x) => x.id === n.id)
                          if (pos <= 0) return
                          const nextMid = mid.slice()
                          ;[nextMid[pos - 1], nextMid[pos]] = [nextMid[pos], nextMid[pos - 1]]
                          onDirty()
                          onChange({ ...draft, nodes: [head, ...nextMid, tail] })
                        }}
                      >
                        <ChevronsUpDown className="h-4 w-4 rotate-180" />
                      </button>
                    ) : null}
                    {n.type !== 'start' && n.type !== 'end' ? (
                      <button
                        type="button"
                        className="inline-flex h-8 items-center gap-2 rounded-2xl border border-black/10 bg-white px-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                        disabled={mid.findIndex((x) => x.id === n.id) >= mid.length - 1}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const pos = mid.findIndex((x) => x.id === n.id)
                          if (pos < 0 || pos >= mid.length - 1) return
                          const nextMid = mid.slice()
                          ;[nextMid[pos], nextMid[pos + 1]] = [nextMid[pos + 1], nextMid[pos]]
                          onDirty()
                          onChange({ ...draft, nodes: [head, ...nextMid, tail] })
                        }}
                      >
                        <ChevronsUpDown className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                  <StatusBadge label={t(`workflow.nodeStatus.${n.status}`, { defaultValue: n.status })} tone="neutral" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </SurfaceCard>
  )
}

