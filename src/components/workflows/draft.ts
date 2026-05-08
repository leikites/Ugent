import type { WorkflowNode, WorkflowNodeConfig } from '@/types/domain'

export type WorkflowDraft = {
  id: string | null
  name: string
  description: string
  nodes: WorkflowNode[]
}

export function createDraftNode(type: WorkflowNode['type'], tenantId: string, workflowId: string, title: string): WorkflowNode {
  const id = `node_${crypto.randomUUID()}`

  const base = {
    id,
    tenantId,
    workflowId,
    type,
    title,
    description: '',
    agentId: type === 'agent' ? '' : null,
    status: 'pending',
  } as const

  const config: WorkflowNodeConfig =
    type === 'start'
      ? { type: 'start', inputHint: '' }
      : type === 'agent'
        ? { type: 'agent', agentId: '', inputHint: '', outputHint: '' }
        : type === 'review'
          ? { type: 'review', policy: 'any_member', role: null, onReject: 'back_to', backToNodeId: null }
          : type === 'condition'
            ? { type: 'condition', expression: '', trueToNodeId: '', falseToNodeId: '' }
            : { type: 'end', resultHint: '' }

  return { ...base, config } as unknown as WorkflowNode
}

export function ensureLinear(nodes: WorkflowNode[]): WorkflowNode[] {
  if (nodes.length < 2) return nodes
  if (nodes[0].type !== 'start') return nodes
  if (nodes[nodes.length - 1].type !== 'end') return nodes
  return nodes
}

