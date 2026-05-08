import { create } from 'zustand'
import type { AgentInstance, AgentTemplate, Id, ReviewItem, Skill, Workflow, WorkflowRun } from '@/types/domain'
import { appService } from '@/services'

type CatalogState = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  workspaceId: Id | null
  systemTemplates: AgentTemplate[]
  customTemplates: AgentTemplate[]
  agentInstances: AgentInstance[]
  skillsGlobal: Skill[]
  skillsWorkspace: Skill[]
  skillsAgent: Skill[]
  workflows: Workflow[]
  runs: WorkflowRun[]
  reviews: ReviewItem[]
  error: string | null
  load: (token: string, workspaceId: Id) => Promise<void>
  toggleAgentEnabled: (token: string, agentId: Id) => Promise<void>
  reviewAction: (token: string, reviewId: Id, input: { decision: 'approve' | 'reject' | 'comment'; comment: string }) => Promise<void>
  createCustomTemplate: (
    token: string,
    input: {
      name: string
      summary: string
      responsibilities: string
      defaultPrompt: string
      defaultEnabled: boolean
      recommendedSkillIds: Id[]
    },
  ) => Promise<boolean>
  updateCustomTemplate: (
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
  ) => Promise<boolean>
  createAgentInstance: (
    token: string,
    input: { workspaceId: Id; templateId: Id | null; name: string; summary: string; status: 'active' | 'inactive' | 'draft' | 'archived' },
  ) => Promise<boolean>
  updateAgentInstance: (
    token: string,
    agentId: Id,
    patch: Partial<{ workspaceId: Id; name: string; summary: string; status: 'active' | 'inactive' | 'draft' | 'archived' }>,
  ) => Promise<boolean>

  createWorkflow: (token: string, input: { workspaceId: Id; name: string; description: string; nodes: Workflow['nodes'] }) => Promise<Id | null>
  updateWorkflow: (
    token: string,
    workflowId: Id,
    patch: Partial<{ name: string; description: string; nodes: Workflow['nodes'] }>,
  ) => Promise<boolean>

  createSkill: (
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
  ) => Promise<boolean>
  updateSkill: (
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
  ) => Promise<boolean>
  removeSkill: (token: string, skillId: Id) => Promise<boolean>
  setAgentSkillBindings: (token: string, agentId: Id, skillIds: Id[]) => Promise<boolean>
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  status: 'idle',
  workspaceId: null,
  systemTemplates: [],
  customTemplates: [],
  agentInstances: [],
  skillsGlobal: [],
  skillsWorkspace: [],
  skillsAgent: [],
  workflows: [],
  runs: [],
  reviews: [],
  error: null,
  load: async (token, workspaceId) => {
    set({ status: 'loading', error: null, workspaceId })
    const res = await appService.loadWorkspaceCatalog(token, workspaceId)
    if (res.ok === false) {
      set({ status: 'error', error: res.error })
      return
    }

    set({
      status: 'ready',
      error: null,
      systemTemplates: res.data.templates.system,
      customTemplates: res.data.templates.custom,
      agentInstances: res.data.agentInstances,
      skillsGlobal: res.data.skills.global,
      skillsWorkspace: res.data.skills.workspace,
      skillsAgent: res.data.skills.agent,
      workflows: res.data.workflows,
      runs: res.data.runs,
      reviews: res.data.reviews,
    })
  },
  toggleAgentEnabled: async (token, agentId) => {
    const res = await appService.repos.agents.toggleEnabled(token, agentId)
    if (res.ok === false) {
      set({ error: res.error })
      return
    }
    set({ agentInstances: get().agentInstances.map((a) => (a.id === agentId ? res.data : a)) })
  },
  reviewAction: async (token, reviewId, input) => {
    const res = await appService.repos.reviews.act(token, reviewId, input)
    if (res.ok === false) {
      set({ error: res.error })
      return
    }
    const wsId = get().workspaceId
    if (wsId) await get().load(token, wsId)
    set({ reviews: get().reviews.map((r) => (r.id === reviewId ? res.data.review : r)) })
  },

  createCustomTemplate: async (token, input) => {
    const res = await appService.repos.agents.createTemplate(token, input)
    if (res.ok === false) {
      set({ error: res.error })
      return false
    }
    const wsId = get().workspaceId
    if (wsId) await get().load(token, wsId)
    return true
  },

  updateCustomTemplate: async (token, templateId, patch) => {
    const res = await appService.repos.agents.updateTemplate(token, templateId, patch)
    if (res.ok === false) {
      set({ error: res.error })
      return false
    }
    const wsId = get().workspaceId
    if (wsId) await get().load(token, wsId)
    return true
  },

  createAgentInstance: async (token, input) => {
    const res = await appService.repos.agents.createInstance(token, input)
    if (res.ok === false) {
      set({ error: res.error })
      return false
    }
    const wsId = get().workspaceId
    if (wsId) await get().load(token, wsId)
    return true
  },

  updateAgentInstance: async (token, agentId, patch) => {
    const res = await appService.repos.agents.updateInstance(token, agentId, patch)
    if (res.ok === false) {
      set({ error: res.error })
      return false
    }
    const wsId = get().workspaceId
    if (wsId) await get().load(token, wsId)
    return true
  },

  createWorkflow: async (token, input) => {
    const res = await appService.repos.workflows.create(token, input)
    if (res.ok === false) {
      set({ error: res.error })
      return null
    }
    const wsId = get().workspaceId
    if (wsId) await get().load(token, wsId)
    return res.data.id
  },

  updateWorkflow: async (token, workflowId, patch) => {
    const res = await appService.repos.workflows.update(token, workflowId, patch)
    if (res.ok === false) {
      set({ error: res.error })
      return false
    }
    const wsId = get().workspaceId
    if (wsId) await get().load(token, wsId)
    return true
  },

  createSkill: async (token, input) => {
    const res = await appService.repos.skills.create(token, input)
    if (res.ok === false) {
      set({ error: res.error })
      return false
    }
    const wsId = get().workspaceId
    if (wsId) await get().load(token, wsId)
    return true
  },

  updateSkill: async (token, skillId, patch) => {
    const res = await appService.repos.skills.update(token, skillId, patch)
    if (res.ok === false) {
      set({ error: res.error })
      return false
    }
    const wsId = get().workspaceId
    if (wsId) await get().load(token, wsId)
    return true
  },

  removeSkill: async (token, skillId) => {
    const res = await appService.repos.skills.remove(token, skillId)
    if (res.ok === false) {
      set({ error: res.error })
      return false
    }
    const wsId = get().workspaceId
    if (wsId) await get().load(token, wsId)
    return true
  },

  setAgentSkillBindings: async (token, agentId, skillIds) => {
    const res = await appService.repos.agents.setSkillBindings(token, agentId, skillIds)
    if (res.ok === false) {
      set({ error: res.error })
      return false
    }
    const wsId = get().workspaceId
    if (wsId) await get().load(token, wsId)
    return true
  },
}))
