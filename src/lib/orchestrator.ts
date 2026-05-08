import type { AgentInstance, Id, Workflow, WorkflowNode } from '@/types/domain'

export type CommandStepKind = 'route' | 'plan' | 'agent' | 'workflow' | 'review' | 'execute' | 'summarize'

export type CommandProposal = {
  title: string
  summary: string
  workspace: { id: Id; name: string }
  mayRequireReview: boolean
  taskInput: Record<string, unknown>
  route:
    | { type: 'workflow'; workflowId: Id; workflowName: string }
    | { type: 'agent'; agentId: Id; agentName: string; workflowNodes: WorkflowNode[] }
  steps: Array<{ kind: CommandStepKind; title: string; description: string }>
}

type WorkspaceContext = {
  id: Id
  name: string
  agents: AgentInstance[]
  workflows: Workflow[]
}

const normalize = (s: string) => s.trim().toLowerCase()

function scoreWorkspace(name: string, input: string) {
  const n = normalize(name)
  const x = normalize(input)

  let score = 0
  if (n.includes('infra') && (x.includes('infra') || x.includes('mcp') || x.includes('导入') || x.includes('skillpack'))) score += 5
  if (n.includes('product') && (x.includes('prd') || x.includes('需求') || x.includes('竞品') || x.includes('调研'))) score += 5
  if (n.includes('default') && score === 0) score += 1

  return score
}

function pickWorkspace(workspaces: Array<{ id: Id; name: string }>, input: string, preferredWorkspaceId: Id | null) {
  const preferred = preferredWorkspaceId ? workspaces.find((w) => w.id === preferredWorkspaceId) ?? null : null
  if (preferred) return preferred

  const ranked = workspaces
    .map((w) => ({ w, s: scoreWorkspace(w.name, input) }))
    .sort((a, b) => b.s - a.s)
  return ranked[0]?.w ?? null
}

function looksLikeWorkflowTask(input: string) {
  const x = normalize(input)
  return (
    x.includes('workflow') ||
    x.includes('工作流') ||
    x.includes('流程') ||
    x.includes('编排') ||
    x.includes('审核') ||
    x.includes('review') ||
    x.includes('门禁')
  )
}

function extractRiskLevel(input: string): 'high' | 'low' | null {
  const x = normalize(input)
  if (x.includes('高风险') || x.includes('high risk') || x.includes('risk=high') || x.includes('risk_level=high')) return 'high'
  if (x.includes('低风险') || x.includes('low risk') || x.includes('risk=low') || x.includes('risk_level=low')) return 'low'
  return null
}

function findWorkflowByName(workflows: Workflow[], input: string): Workflow | null {
  const x = normalize(input)
  const ranked = workflows
    .map((wf) => {
      const n = normalize(wf.name)
      let s = 0
      if (x.includes('prd') && n.includes('prd')) s += 4
      if ((x.includes('jira') || x.includes('任务')) && n.includes('jira')) s += 4
      if ((x.includes('导入') || x.includes('skillpack') || x.includes('mcp')) && (n.includes('导入') || n.includes('skillpack'))) s += 4
      if (looksLikeWorkflowTask(input) && wf.nodes.some((n2) => n2.type === 'review')) s += 2
      if (n.includes('plan') && (x.includes('plan') || x.includes('计划'))) s += 2
      return { wf, s }
    })
    .sort((a, b) => b.s - a.s)
  return ranked[0]?.wf ?? workflows[0] ?? null
}

function findAgentByHint(agents: AgentInstance[], input: string): AgentInstance | null {
  const x = normalize(input)
  const ranked = agents
    .map((a) => {
      const n = normalize(a.name)
      let s = 0
      if (x.includes('review') || x.includes('审核')) {
        if (n.includes('review') || n.includes('审核')) s += 4
      }
      if (x.includes('research') || x.includes('调研') || x.includes('竞品')) {
        if (n.includes('research') || n.includes('调研')) s += 4
      }
      if (x.includes('plan') || x.includes('规划') || x.includes('拆解')) {
        if (n.includes('plan') || n.includes('planner') || n.includes('规划')) s += 4
      }
      if (x.includes('infra') || x.includes('mcp') || x.includes('导入')) {
        if (n.includes('infra') || n.includes('ops')) s += 4
      }
      if (a.enabled) s += 1
      return { a, s }
    })
    .sort((a, b) => b.s - a.s)
  return ranked[0]?.a ?? agents.find((a) => a.enabled) ?? agents[0] ?? null
}

function buildAdHocWorkflowNodes(agent: AgentInstance, title: string): WorkflowNode[] {
  const tenantId = agent.tenantId
  const wfId = 'adhoc'

  const start: WorkflowNode = {
    id: `node_${crypto.randomUUID()}`,
    tenantId,
    workflowId: wfId,
    type: 'start',
    title: 'Start',
    description: title,
    agentId: null,
    status: 'pending',
    config: { type: 'start', inputHint: '' },
  }

  const act: WorkflowNode = {
    id: `node_${crypto.randomUUID()}`,
    tenantId,
    workflowId: wfId,
    type: 'agent',
    title: agent.name,
    description: agent.summary,
    agentId: agent.id,
    status: 'pending',
    config: { type: 'agent', agentId: agent.id, inputHint: '', outputHint: '' },
  }

  const end: WorkflowNode = {
    id: `node_${crypto.randomUUID()}`,
    tenantId,
    workflowId: wfId,
    type: 'end',
    title: 'End',
    description: 'Result summary',
    agentId: null,
    status: 'pending',
    config: { type: 'end', resultHint: '' },
  }

  return [start, act, end]
}

export function mockOrchestrate(args: {
  input: string
  workspaces: Array<{ id: Id; name: string }>
  byWorkspaceId: Record<Id, WorkspaceContext>
  preferredWorkspaceId: Id | null
}): CommandProposal | null {
  const text = args.input.trim()
  if (!text) return null

  const ws = pickWorkspace(args.workspaces, text, args.preferredWorkspaceId)
  if (!ws) return null
  const ctx = args.byWorkspaceId[ws.id]
  if (!ctx) return null

  const risk = extractRiskLevel(text)
  const taskInput: Record<string, unknown> = {
    goal: text,
    risk_level: risk ?? undefined,
  }

  const chooseWorkflow = looksLikeWorkflowTask(text)
  const title = text.length > 48 ? `${text.slice(0, 48)}…` : text

  if (chooseWorkflow) {
    const wf = findWorkflowByName(ctx.workflows, text)
    if (!wf) return null
    const mayReview = wf.nodes.some((n) => n.type === 'review')
    return {
      title,
      summary: 'Orchestrator 将任务路由到现有 Workflow，并生成可确认的执行计划。',
      workspace: { id: ws.id, name: ws.name },
      mayRequireReview: mayReview,
      taskInput,
      route: { type: 'workflow', workflowId: wf.id, workflowName: wf.name },
      steps: [
        { kind: 'route', title: '路由到 Workspace', description: `目标 Workspace：${ws.name}` },
        { kind: 'workflow', title: '选择 Workflow', description: `使用流程：${wf.name}` },
        { kind: 'plan', title: '生成执行计划', description: '把任务拆成可追踪的节点步骤，并声明可能的审核点。' },
        { kind: 'execute', title: '启动执行', description: '创建 Run 并推进至下一个节点（必要时进入审核等待）。' },
        { kind: 'summarize', title: '汇总结果', description: '在 Run 结束或通过审核后返回摘要。' },
      ],
    }
  }

  const agent = findAgentByHint(ctx.agents, text)
  if (!agent) return null
  return {
    title,
    summary: 'Orchestrator 将任务路由到单个 Agent（Direct Agent Run），并以“临时 Workflow”记录执行过程。',
    workspace: { id: ws.id, name: ws.name },
    mayRequireReview: false,
    taskInput,
    route: { type: 'agent', agentId: agent.id, agentName: agent.name, workflowNodes: buildAdHocWorkflowNodes(agent, title) },
    steps: [
      { kind: 'route', title: '路由到 Workspace', description: `目标 Workspace：${ws.name}` },
      { kind: 'agent', title: '选择 Agent', description: `Direct Agent Run：${agent.name}` },
      { kind: 'plan', title: '生成执行计划', description: '将任务转成最小可追踪的 Start → Agent → End。' },
      { kind: 'execute', title: '启动执行', description: '创建临时 Workflow 与 Run，并写入执行记录。' },
      { kind: 'summarize', title: '汇总结果', description: '生成结果摘要并沉淀到 Execution Center。' },
    ],
  }
}

