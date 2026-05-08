import type { AgentInstance, AgentTemplate, Id, ReviewItem, Skill, User, Workflow, WorkflowRun, Workspace } from '@/types/domain'
import type { Result } from './result'

export type Session = {
  accessToken: string
  expiresAt: number
}

export type AuthRepository = {
  signIn: (username: string, password: string) => Promise<Result<{ user: User; session: Session }>>
  signUp: (username: string, password: string) => Promise<Result<{ user: User; session: Session }>>
  me: (token: string) => Promise<Result<{ user: User }>>
  signOut: (token: string) => Promise<Result<{ success: true }>>
}

export type WorkspaceRepository = {
  list: (token: string) => Promise<Result<Workspace[]>>
  getDashboard: (
    token: string,
  ) => Promise<
    Result<
      Array<
        Workspace & {
          metrics: { agents: number; workflows: number; pendingReviews: number; recentRuns: number }
        }
      >
    >
  >
  rename: (token: string, workspaceId: Id, name: string) => Promise<Result<Workspace>>
  create: (token: string, input: { name: string; description: string }) => Promise<Result<Workspace>>
  update: (
    token: string,
    workspaceId: Id,
    patch: { name?: string; description?: string; archived?: boolean },
  ) => Promise<Result<Workspace>>
  get: (token: string, workspaceId: Id) => Promise<Result<Workspace>>
  remove: (token: string, workspaceId: Id) => Promise<Result<{ success: true }>>
}

export type AgentRepository = {
  listTemplates: (token: string) => Promise<Result<{ system: AgentTemplate[]; custom: AgentTemplate[] }>>
  createTemplate: (
    token: string,
    input: {
      name: string
      summary: string
      responsibilities: string
      defaultPrompt: string
      defaultEnabled: boolean
      recommendedSkillIds: Id[]
    },
  ) => Promise<Result<AgentTemplate>>
  updateTemplate: (
    token: string,
    templateId: Id,
    patch: Partial<{
      name: string
      summary: string
      responsibilities: string
      defaultPrompt: string
      defaultEnabled: boolean
      recommendedSkillIds: Id[]
    }>,
  ) => Promise<Result<AgentTemplate>>
  listInstances: (token: string, workspaceId: Id) => Promise<Result<AgentInstance[]>>
  createInstance: (
    token: string,
    input: {
      workspaceId: Id
      templateId: Id | null
      name: string
      summary: string
      status: 'active' | 'inactive' | 'draft' | 'archived'
    },
  ) => Promise<Result<AgentInstance>>
  updateInstance: (
    token: string,
    agentId: Id,
    patch: Partial<{ name: string; summary: string; status: 'active' | 'inactive' | 'draft' | 'archived'; workspaceId: Id }>,
  ) => Promise<Result<AgentInstance>>
  toggleEnabled: (token: string, agentId: Id) => Promise<Result<AgentInstance>>
  getInstance: (token: string, agentId: Id) => Promise<Result<AgentInstance>>
  setSkillBindings: (token: string, agentId: Id, skillIds: Id[]) => Promise<Result<AgentInstance>>
}

export type SkillRepository = {
  list: (token: string, workspaceId: Id) => Promise<Result<{ global: Skill[]; workspace: Skill[]; agent: Skill[] }>>
  listAll: (token: string) => Promise<Result<Skill[]>>
  get: (token: string, skillId: Id) => Promise<Result<Skill>>
  create: (
    token: string,
    input: {
      scope: 'global' | 'workspace' | 'agent'
      workspaceId?: Id
      agentId?: Id
      name: string
      kind: Skill['kind']
      description: string
      version: string
      enabled: boolean
      contentText: string
      source: Skill['source']
    },
  ) => Promise<Result<Skill>>
  update: (
    token: string,
    skillId: Id,
    patch: Partial<{
      name: string
      kind: Skill['kind']
      description: string
      version: string
      enabled: boolean
      contentText: string
      source: Skill['source']
    }>,
  ) => Promise<Result<Skill>>
  remove: (token: string, skillId: Id) => Promise<Result<Skill>>
}

export type WorkflowRepository = {
  list: (token: string, workspaceId: Id) => Promise<Result<Workflow[]>>
  get: (token: string, workflowId: Id) => Promise<Result<Workflow>>
  create: (
    token: string,
    input: {
      workspaceId: Id
      name: string
      description: string
      nodes: Workflow['nodes']
    },
  ) => Promise<Result<Workflow>>
  update: (
    token: string,
    workflowId: Id,
    patch: Partial<{ name: string; description: string; nodes: Workflow['nodes'] }>,
  ) => Promise<Result<Workflow>>
}

export type ExecutionRepository = {
  listRuns: (token: string, workspaceId: Id) => Promise<Result<WorkflowRun[]>>
  getRun: (token: string, runId: Id) => Promise<Result<WorkflowRun>>
  startRun: (
    token: string,
    input: {
      workspaceId: Id
      workflowId: Id
      title: string
      description: string
      input: Record<string, unknown>
    },
  ) => Promise<Result<{ runId: Id; status: WorkflowRun['status']; pendingReviewId: Id | null }>>
  getRunDetail: (
    token: string,
    runId: Id,
  ) => Promise<
    Result<{
      run: WorkflowRun
      workflow: Workflow
      nodeRuns: Array<{
        id: Id
        nodeId: Id
        status: string
        startedAt: string | null
        finishedAt: string | null
        outputText?: string | null
        artifactCount?: number
      }>
      reviews: ReviewItem[]
    }>
  >
}

export type ReviewRepository = {
  list: (token: string, workspaceId: Id) => Promise<Result<ReviewItem[]>>
  get: (token: string, reviewId: Id) => Promise<Result<ReviewItem>>
  getDetail: (
    token: string,
    reviewId: Id,
  ) => Promise<
    Result<{
      review: ReviewItem
      run: WorkflowRun
      workflow: Workflow
      nodeId: Id
      nodeTitle: string
      nodeDescription: string
      nodeRunId: Id | null
      nodeRunStatus: string | null
      evidence: {
        previousNodeId: Id | null
        previousNodeTitle: string | null
        previousNodeOutputText: string | null
        previousNodeArtifacts: Array<{ name: string; uri: string }>
      }
      history: Array<{ id: Id; decision: string; comment: string; createdAt: string; createdByUserId: Id }>
    }>
  >
  act: (
    token: string,
    reviewId: Id,
    input: { decision: 'approve' | 'reject' | 'comment'; comment: string },
  ) => Promise<Result<{ review: ReviewItem }>>
}

export type Repositories = {
  auth: AuthRepository
  workspaces: WorkspaceRepository
  agents: AgentRepository
  skills: SkillRepository
  workflows: WorkflowRepository
  execution: ExecutionRepository
  reviews: ReviewRepository
}
