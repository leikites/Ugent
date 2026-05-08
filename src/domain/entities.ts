import type {
  AgentStatus,
  LogLevel,
  MembershipRole,
  MembershipStatus,
  ReviewDecision,
  SkillKind,
  SkillScope,
  SkillSourceType,
  WorkflowNodeStatus,
  WorkflowNodeRunStatus,
  WorkflowNodeType,
  WorkflowRunStatus,
  WorkflowStatus,
} from './enums'
import type { Id, IsoTime } from './ids'

export type Tenant = {
  id: Id
  name: string
  createdAt: IsoTime
}

export type User = {
  id: Id
  username: string
  email: string
  createdAt: IsoTime
}

export type Membership = {
  id: Id
  tenantId: Id
  userId: Id
  role: MembershipRole
  status: MembershipStatus
  createdAt: IsoTime
}

export type Workspace = {
  id: Id
  tenantId: Id
  name: string
  description: string
  createdAt: IsoTime
  updatedAt: IsoTime
  archivedAt: IsoTime | null
}

export type AgentTemplate = {
  id: Id
  tenantId: Id
  scope: 'system' | 'custom'
  name: string
  summary: string
  responsibilities: string
  defaultPrompt: string
  defaultEnabled: boolean
  recommendedSkillIds: Id[]
  createdAt: IsoTime
  updatedAt: IsoTime
}

export type SkillOwner =
  | { type: 'tenant'; tenantId: Id }
  | { type: 'workspace'; tenantId: Id; workspaceId: Id }
  | { type: 'agent'; tenantId: Id; workspaceId: Id; agentId: Id }

export type Skill = {
  id: Id
  tenantId: Id
  scope: SkillScope
  owner: SkillOwner
  name: string
  kind: SkillKind
  description: string
  version: string
  enabled: boolean
  archivedAt: IsoTime | null
  source: { type: SkillSourceType; ref: string | null }
  content: { text: string }
  createdAt: IsoTime
  updatedAt: IsoTime
}

export type SkillBinding = {
  id: Id
  tenantId: Id
  workspaceId: Id
  target: { type: 'workspaceAgent'; agentId: Id }
  skillId: Id
  enabled: boolean
  priority: number
  createdAt: IsoTime
  updatedAt: IsoTime
}

export type WorkspaceAgent = {
  id: Id
  tenantId: Id
  workspaceId: Id
  templateId: Id | null
  name: string
  summary: string
  status: AgentStatus
  promptOverride: string | null
  skillBindingIds: Id[]
  workflowIds: Id[]
  createdAt: IsoTime
  updatedAt: IsoTime
}

export type Workflow = {
  id: Id
  tenantId: Id
  workspaceId: Id
  name: string
  description: string
  status: WorkflowStatus
  startNodeId: Id
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  createdAt: IsoTime
  updatedAt: IsoTime
}

export type WorkflowNodeConfig =
  | { type: 'start'; inputHint: string }
  | { type: 'agent'; agentId: Id; inputHint: string; outputHint: string }
  | { type: 'review'; policy: 'any_member' | 'role'; role: MembershipRole | null; onReject: 'pause' | 'back_to'; backToNodeId: Id | null }
  | { type: 'condition'; expression: string; trueToNodeId: Id; falseToNodeId: Id }
  | { type: 'end'; resultHint: string }

export type WorkflowNode = {
  id: Id
  tenantId: Id
  workflowId: Id
  type: WorkflowNodeType
  title: string
  description: string
  agentId: Id | null
  status: WorkflowNodeStatus
  config: WorkflowNodeConfig
}

export type WorkflowEdge = {
  id: Id
  tenantId: Id
  workflowId: Id
  fromNodeId: Id
  toNodeId: Id
  condition: string | null
}

export type Task = {
  id: Id
  tenantId: Id
  workspaceId: Id
  title: string
  description: string
  input: Record<string, unknown>
  createdByUserId: Id
  createdAt: IsoTime
  updatedAt: IsoTime
}

export type WorkflowRun = {
  id: Id
  tenantId: Id
  workspaceId: Id
  workflowId: Id
  taskId: Id
  status: WorkflowRunStatus
  triggeredByUserId: Id
  triggeredBy: string
  createdAt: IsoTime
  startedAt: IsoTime | null
  finishedAt: IsoTime | null
}

export type WorkflowNodeRun = {
  id: Id
  tenantId: Id
  workspaceId: Id
  runId: Id
  nodeId: Id
  status: WorkflowNodeRunStatus
  startedAt: IsoTime | null
  finishedAt: IsoTime | null
  output: { text: string; artifacts: Array<{ name: string; uri: string }> } | null
}

export type ReviewAction = {
  id: Id
  tenantId: Id
  workspaceId: Id
  runId: Id
  nodeRunId: Id
  decision: ReviewDecision
  comment: string
  createdByUserId: Id
  createdAt: IsoTime
}

export type ExecutionLog = {
  id: Id
  tenantId: Id
  workspaceId: Id
  runId: Id
  nodeRunId: Id | null
  agentId: Id | null
  level: LogLevel
  message: string
  data: Record<string, unknown> | null
  createdAt: IsoTime
}

export type AuditRecord = {
  id: Id
  tenantId: Id
  actorUserId: Id
  action: string
  entity: { type: string; id: Id }
  createdAt: IsoTime
  metadata: Record<string, unknown> | null
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

export type ReviewItem = {
  id: Id
  tenantId: Id
  workspaceId: Id
  runId: Id
  nodeId: Id
  title: string
  summary: string
  status: ReviewStatus
  createdAt: IsoTime
  updatedAt: IsoTime
}

export type AgentTemplateScope = 'system' | 'custom'

export type AgentInstance = WorkspaceAgent & {
  enabled: boolean
  skillBindings: Array<{ bindingId: Id; skillId: Id; scope: SkillScope; enabled: boolean; priority: number }>
}
