export type MembershipRole = 'owner' | 'admin' | 'member' | 'viewer'
export type MembershipStatus = 'active' | 'invited' | 'suspended'

export type AgentStatus = 'active' | 'inactive' | 'draft' | 'archived'
export type AgentTemplateKind = 'system' | 'custom'

export type SkillScope = 'global' | 'workspace' | 'agent'
export type SkillKind = 'prompt' | 'checklist' | 'format' | 'tool'
export type SkillSourceType = 'system' | 'user' | 'github' | 'local'

export type WorkflowNodeType = 'start' | 'agent' | 'review' | 'condition' | 'end'

export type WorkflowStatus = 'active' | 'archived'

export type WorkflowRunStatus =
  | 'queued'
  | 'running'
  | 'waiting_review'
  | 'succeeded'
  | 'failed'
  | 'paused'
  | 'canceled'

export type WorkflowNodeRunStatus =
  | 'pending'
  | 'running'
  | 'waiting_review'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'failed'
  | 'skipped'

export type WorkflowNodeStatus = WorkflowNodeRunStatus

export type ReviewDecision = 'approve' | 'reject' | 'comment'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
