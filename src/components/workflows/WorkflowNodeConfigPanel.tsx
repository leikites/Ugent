import { useTranslation } from 'react-i18next'
import { Settings2 } from 'lucide-react'
import SurfaceCard from '@/components/SurfaceCard'
import StatusBadge from '@/components/StatusBadge'
import type { AgentInstance, WorkflowNode } from '@/types/domain'

export default function WorkflowNodeConfigPanel(props: {
  node: WorkflowNode | null
  agentInstances: AgentInstance[]
  onChange: (patch: Partial<WorkflowNode>) => void
}) {
  const { t } = useTranslation()
  const { node, agentInstances, onChange } = props

  return (
    <SurfaceCard>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Settings2 className="h-4 w-4" />
          {t('workflows.nodeConfigTitle')}
        </div>
        <StatusBadge label={node ? t('workflows.nodeSelected') : t('workflows.nodeNotSelected')} tone={node ? 'info' : 'neutral'} />
      </div>

      {node ? (
        <div className="mt-4 grid gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('workflows.nodeTitle')}</div>
            <input
              value={node.title}
              onChange={(e) => onChange({ title: e.target.value })}
              className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('workflows.nodeDescription')}</div>
            <textarea
              value={node.description}
              onChange={(e) => onChange({ description: e.target.value })}
              rows={4}
              className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
            />
          </div>

          {node.type === 'agent' ? (
            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('workflow.assignedAgent')}</div>
              <select
                value={node.agentId ?? ''}
                onChange={(e) => onChange({ agentId: e.target.value })}
                className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
              >
                <option value="">{t('workflows.selectAgent')}</option>
                {agentInstances.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {node.type === 'review' ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
              {t('workflows.reviewNodeHint')}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 rounded-3xl border border-black/5 bg-white/60 p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          {t('workflows.nodeNotSelectedHint')}
        </div>
      )}
    </SurfaceCard>
  )
}

