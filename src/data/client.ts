import type {
  AgentInstance,
  AgentTemplate,
  Id,
  Membership,
  ReviewItem,
  ReviewAction,
  Skill,
  SkillBinding,
  User,
  Workflow,
  WorkflowNodeRun,
  WorkflowRun,
  Workspace,
} from '@/types/domain'
import { getMockDb, mockDelay, setMockDb } from '@/mocks/mockDb'

type ResultOk<T> = { ok: true; data: T }
type ResultFail = { ok: false; error: string }
type Result<T> = ResultOk<T> | ResultFail

export type Session = {
  accessToken: string
  expiresAt: number
}

const MODE = (import.meta.env.VITE_DATA_SOURCE as string | undefined) ?? 'mock'

function nowSec() {
  return Math.floor(Date.now() / 1000)
}

function newToken() {
  return `mock_${crypto.randomUUID()}`
}

function normalizeName(input: string) {
  return input.trim()
}

function isValidName(input: string, min: number, max: number) {
  const v = normalizeName(input)
  return v.length >= min && v.length <= max
}

function recordValues<T>(record: Record<string, T>): T[] {
  return Object.values(record)
}

function recordFromEntries<T>(entries: Array<[string, T]>): Record<string, T> {
  return Object.fromEntries(entries) as Record<string, T>
}

function getUserByToken(token: string): User | null {
  const db = getMockDb()
  const session = db.sessions[token]
  if (!session) return null
  const user = db.users[session.userId]
  if (!user) return null
  return { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt }
}

function getMembershipByUserId(db: ReturnType<typeof getMockDb>, userId: Id): Membership | null {
  const rows = recordValues(db.memberships)
  return rows.find((m) => m.userId === userId && m.status === 'active') ?? null
}

function resolveAgentSkillBindings(
  db: ReturnType<typeof getMockDb>,
  agent: AgentInstance,
): Array<{ bindingId: Id; skillId: Id; scope: Skill['scope']; enabled: boolean; priority: number }> {
  const bindings: Array<{ id: Id; row: SkillBinding }> = agent.skillBindingIds
    .map((bindingId) => ({ id: bindingId, row: db.skillBindings[bindingId] }))
    .filter((x) => Boolean(x.row)) as Array<{ id: Id; row: SkillBinding }>

  return bindings
    .filter((b) => b.row.enabled)
    .sort((a, b) => a.row.priority - b.row.priority)
    .map((b) => {
      const skill = db.skills[b.row.skillId]
      if (!skill || skill.archivedAt) return null
      return { bindingId: b.id, skillId: skill.id, scope: skill.scope, enabled: b.row.enabled, priority: b.row.priority }
    })
    .filter(Boolean) as Array<{ bindingId: Id; skillId: Id; scope: Skill['scope']; enabled: boolean; priority: number }>
}

export const dataClient = {
  mode: MODE,

  auth: {
    async signIn(username: string, password: string): Promise<Result<{ user: User; session: Session }>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay()

      const db = getMockDb()
      const u = recordValues(db.users).find((x) => x.username.toLowerCase() === username.trim().toLowerCase())
      if (!u || u.password !== password) return { ok: false, error: 'invalid_credentials' }

      const token = newToken()
      setMockDb((cur) => {
        const createdAt = new Date().toISOString()
        return {
          ...cur,
          sessions: { ...cur.sessions, [token]: { token, userId: u.id, createdAt } },
        }
      })

      return {
        ok: true,
        data: {
          user: { id: u.id, username: u.username, email: u.email, createdAt: u.createdAt },
          session: { accessToken: token, expiresAt: nowSec() + 60 * 60 * 24 },
        },
      }
    },

    async signUp(username: string, password: string): Promise<Result<{ user: User; session: Session }>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay()

      const uname = username.trim()
      if (!/^[A-Za-z0-9_]{3,24}$/.test(uname)) return { ok: false, error: 'invalid_username' }
      if (password.length < 8) return { ok: false, error: 'invalid_password' }

      const db = getMockDb()
      const exists = recordValues(db.users).some((u) => u.username.toLowerCase() === uname.toLowerCase())
      if (exists) return { ok: false, error: 'username_taken' }

      const userId = `u_${crypto.randomUUID()}`
      const membershipId = `m_${crypto.randomUUID()}`
      const token = newToken()
      const email = `${uname}@uuugent.local`

      setMockDb((cur) => {
        const createdAt = new Date().toISOString()
        const shouldCreateWorkspace = Object.keys(cur.workspaces).length === 0
        const workspaceId = shouldCreateWorkspace ? `ws_${crypto.randomUUID()}` : null
        return {
          ...cur,
          users: {
            ...cur.users,
            [userId]: { id: userId, username: uname, email, createdAt, password },
          },
          memberships: {
            ...cur.memberships,
            [membershipId]: {
              id: membershipId,
              tenantId: cur.tenant.id,
              userId,
              role: 'member',
              status: 'active',
              createdAt,
            },
          },
          sessions: { ...cur.sessions, [token]: { token, userId, createdAt } },
          workspaces:
            shouldCreateWorkspace && workspaceId
              ? {
                  ...cur.workspaces,
                  [workspaceId]: {
                    id: workspaceId,
                    tenantId: cur.tenant.id,
                    name: 'Default',
                    description: '默认 Workspace，用于快速开始。',
                    createdAt,
                    updatedAt: createdAt,
                    archivedAt: null,
                  },
                }
              : cur.workspaces,
        }
      })

      return {
        ok: true,
        data: {
          user: { id: userId, username: uname, email, createdAt: new Date().toISOString() },
          session: { accessToken: token, expiresAt: nowSec() + 60 * 60 * 24 },
        },
      }
    },

    async me(token: string): Promise<Result<{ user: User }>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(120)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      return { ok: true, data: { user } }
    },

    async signOut(token: string): Promise<Result<{ success: true }>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(80)
      setMockDb((cur) => {
        const next = { ...cur.sessions }
        delete next[token]
        return { ...cur, sessions: next }
      })
      return { ok: true, data: { success: true } }
    },
  },

  workspaces: {
    async list(token: string): Promise<Result<Workspace[]>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(150)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()
      const rows = recordValues(db.workspaces).slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      return { ok: true, data: rows }
    },

    async getDashboard(token: string): Promise<
      Result<
        Array<
          Workspace & {
            metrics: {
              agents: number
              workflows: number
              pendingReviews: number
              recentRuns: number
            }
          }
        >
      >
    > {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(150)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }

      const db = getMockDb()
      const workspaces = recordValues(db.workspaces)
      const agentsAll = recordValues(db.workspaceAgents)
      const workflowsAll = recordValues(db.workflows)
      const reviewsAll = recordValues(db.reviews)
      const runsAll = recordValues(db.runs)

      const rows = workspaces.map((w) => {
        const agents = agentsAll.filter((a) => a.workspaceId === w.id && a.status === 'active').length
        const workflows = workflowsAll.filter((wf) => wf.workspaceId === w.id).length
        const pendingReviews = reviewsAll.filter((r) => r.workspaceId === w.id && r.status === 'pending').length
        const recentRuns = runsAll.filter((r) => r.workspaceId === w.id).length
        return { ...w, metrics: { agents, workflows, pendingReviews, recentRuns } }
      })
      return { ok: true, data: rows }
    },

    async rename(token: string, workspaceId: Id, name: string): Promise<Result<Workspace>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(200)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      if (!isValidName(name, 1, 40)) return { ok: false, error: 'invalid_workspace_name' }

      const next = setMockDb((cur) => {
        const existing = cur.workspaces[workspaceId]
        if (!existing) return cur
        return {
          ...cur,
          workspaces: {
            ...cur.workspaces,
            [workspaceId]: { ...existing, name: normalizeName(name), updatedAt: new Date().toISOString() },
          },
        }
      })

      const found = next.workspaces[workspaceId]
      if (!found) return { ok: false, error: 'workspace_not_found' }
      return { ok: true, data: found }
    },

    async create(token: string, input: { name: string; description: string }): Promise<Result<Workspace>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(220)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }

      const name = normalizeName(input.name)
      const description = String(input.description ?? '').trim()
      if (!isValidName(name, 1, 40)) return { ok: false, error: 'invalid_workspace_name' }
      if (description.length > 240) return { ok: false, error: 'invalid_workspace_description' }

      const id = `ws_${crypto.randomUUID()}`
      const now = new Date().toISOString()

      const next = setMockDb((cur) => ({
        ...cur,
        workspaces: {
          ...cur.workspaces,
          [id]: {
            id,
            tenantId: cur.tenant.id,
            name,
            description,
            createdAt: now,
            updatedAt: now,
            archivedAt: null,
          },
        },
      }))

      return { ok: true, data: next.workspaces[id] }
    },

    async update(
      token: string,
      workspaceId: Id,
      patch: { name?: string; description?: string; archived?: boolean },
    ): Promise<Result<Workspace>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(220)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }

      const next = setMockDb((cur) => {
        const existing = cur.workspaces[workspaceId]
        if (!existing) return cur

        const now = new Date().toISOString()
        const nextName = patch.name === undefined ? existing.name : normalizeName(patch.name)
        const nextDesc = patch.description === undefined ? existing.description : String(patch.description ?? '').trim()

        if (!isValidName(nextName, 1, 40)) return cur
        if (nextDesc.length > 240) return cur

        const archivedAt =
          patch.archived === undefined
            ? existing.archivedAt
            : patch.archived
              ? now
              : null

        return {
          ...cur,
          workspaces: {
            ...cur.workspaces,
            [workspaceId]: {
              ...existing,
              name: nextName,
              description: nextDesc,
              archivedAt,
              updatedAt: now,
            },
          },
        }
      })

      const found = next.workspaces[workspaceId]
      if (!found) return { ok: false, error: 'workspace_not_found' }
      return { ok: true, data: found }
    },

    async get(token: string, workspaceId: Id): Promise<Result<Workspace>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(150)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()
      const found = db.workspaces[workspaceId]
      if (!found) return { ok: false, error: 'workspace_not_found' }
      return { ok: true, data: found }
    },

    async remove(token: string, workspaceId: Id): Promise<Result<{ success: true }>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(260)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }

      const db = getMockDb()
      if (!db.workspaces[workspaceId]) return { ok: false, error: 'workspace_not_found' }
      if (Object.keys(db.workspaces).length <= 1) return { ok: false, error: 'cannot_delete_last_workspace' }

      setMockDb((cur) => {
        if (!cur.workspaces[workspaceId]) return cur

        const agentIds = new Set(
          recordValues(cur.workspaceAgents)
            .filter((a) => a.workspaceId === workspaceId)
            .map((a) => a.id),
        )
        const workflowIds = new Set(recordValues(cur.workflows).filter((w) => w.workspaceId === workspaceId).map((w) => w.id))
        const runIds = new Set(recordValues(cur.runs).filter((r) => r.workspaceId === workspaceId).map((r) => r.id))
        const nodeRunIds = new Set(recordValues(cur.nodeRuns).filter((nr) => nr.workspaceId === workspaceId).map((nr) => nr.id))
        const skillIds = new Set(
          recordValues(cur.skills)
            .filter((s) => {
              if (s.scope === 'global') return false
              if (s.owner.type === 'workspace') return s.owner.workspaceId === workspaceId
              if (s.owner.type === 'agent') return s.owner.workspaceId === workspaceId
              return false
            })
            .map((s) => s.id),
        )

        const nextWorkspaces = { ...cur.workspaces }
        delete nextWorkspaces[workspaceId]

        const nextWorkspaceAgents = recordFromEntries(Object.entries(cur.workspaceAgents).filter(([, a]) => a.workspaceId !== workspaceId))
        const nextSkills = recordFromEntries(Object.entries(cur.skills).filter(([id]) => !skillIds.has(id)))
        const nextSkillBindings = recordFromEntries(
          Object.entries(cur.skillBindings).filter(([, b]) => b.workspaceId !== workspaceId && !agentIds.has(b.target.agentId) && !skillIds.has(b.skillId)),
        )
        const nextWorkflows = recordFromEntries(Object.entries(cur.workflows).filter(([, w]) => w.workspaceId !== workspaceId))
        const nextWorkflowNodes = recordFromEntries(Object.entries(cur.workflowNodes).filter(([, n]) => !workflowIds.has(n.workflowId)))
        const nextWorkflowEdges = recordFromEntries(Object.entries(cur.workflowEdges).filter(([, e]) => !workflowIds.has(e.workflowId)))
        const nextTasks = recordFromEntries(Object.entries(cur.tasks).filter(([, t]) => t.workspaceId !== workspaceId))
        const nextRuns = recordFromEntries(Object.entries(cur.runs).filter(([, r]) => r.workspaceId !== workspaceId))
        const nextNodeRuns = recordFromEntries(Object.entries(cur.nodeRuns).filter(([, nr]) => nr.workspaceId !== workspaceId))
        const nextReviews = recordFromEntries(Object.entries(cur.reviews).filter(([, r]) => r.workspaceId !== workspaceId))
        const nextReviewActions = recordFromEntries(
          Object.entries(cur.reviewActions).filter(([, a]) => a.workspaceId !== workspaceId && !runIds.has(a.runId) && !nodeRunIds.has(a.nodeRunId)),
        )
        const nextExecutionLogs = recordFromEntries(Object.entries(cur.executionLogs).filter(([, l]) => l.workspaceId !== workspaceId && !runIds.has(l.runId)))
        const nextAuditRecords = recordFromEntries(Object.entries(cur.auditRecords).filter(([, a]) => a.entity.type !== 'workspace' || a.entity.id !== workspaceId))

        return {
          ...cur,
          workspaces: nextWorkspaces,
          workspaceAgents: nextWorkspaceAgents,
          skills: nextSkills,
          skillBindings: nextSkillBindings,
          workflows: nextWorkflows,
          workflowNodes: nextWorkflowNodes,
          workflowEdges: nextWorkflowEdges,
          tasks: nextTasks,
          runs: nextRuns,
          nodeRuns: nextNodeRuns,
          reviews: nextReviews,
          reviewActions: nextReviewActions,
          executionLogs: nextExecutionLogs,
          auditRecords: nextAuditRecords,
        }
      })

      return { ok: true, data: { success: true } }
    },
  },

  agents: {
    async listTemplates(token: string): Promise<Result<{ system: AgentTemplate[]; custom: AgentTemplate[] }>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(200)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()
      void getMembershipByUserId(db, user.id)
      const templates = recordValues(db.agentTemplates)
      return {
        ok: true,
        data: {
          system: templates.filter((t) => t.scope === 'system'),
          custom: templates.filter((t) => t.scope === 'custom'),
        },
      }
    },

    async createTemplate(
      token: string,
      input: {
        name: string
        summary: string
        responsibilities: string
        defaultPrompt: string
        defaultEnabled: boolean
        recommendedSkillIds: Id[]
      },
    ): Promise<Result<AgentTemplate>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(260)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }

      const name = normalizeName(input.name)
      const summary = String(input.summary ?? '').trim()
      const responsibilities = String(input.responsibilities ?? '').trim()
      const defaultPrompt = String(input.defaultPrompt ?? '').trim()

      if (!isValidName(name, 2, 40)) return { ok: false, error: 'invalid_template_name' }
      if (summary.length < 2 || summary.length > 240) return { ok: false, error: 'invalid_template_summary' }
      if (responsibilities.length < 2 || responsibilities.length > 800) return { ok: false, error: 'invalid_template_responsibilities' }
      if (defaultPrompt.length < 2 || defaultPrompt.length > 4000) return { ok: false, error: 'invalid_template_prompt' }

      const id = `tpl_${crypto.randomUUID()}`
      const now = new Date().toISOString()

      const next = setMockDb((cur) => ({
        ...cur,
        agentTemplates: {
          ...cur.agentTemplates,
          [id]: {
            id,
            tenantId: cur.tenant.id,
            scope: 'custom',
            name,
            summary,
            responsibilities,
            defaultPrompt,
            defaultEnabled: Boolean(input.defaultEnabled),
            recommendedSkillIds: Array.isArray(input.recommendedSkillIds) ? input.recommendedSkillIds : [],
            createdAt: now,
            updatedAt: now,
          },
        },
      }))

      return { ok: true, data: next.agentTemplates[id] }
    },

    async updateTemplate(
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
    ): Promise<Result<AgentTemplate>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(240)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }

      const next = setMockDb((cur) => {
        const existing = cur.agentTemplates[templateId]
        if (!existing) return cur
        if (existing.scope === 'system') return cur

        const now = new Date().toISOString()
        const name = patch.name === undefined ? existing.name : normalizeName(patch.name)
        const summary = patch.summary === undefined ? existing.summary : String(patch.summary ?? '').trim()
        const responsibilities =
          patch.responsibilities === undefined ? existing.responsibilities : String(patch.responsibilities ?? '').trim()
        const defaultPrompt =
          patch.defaultPrompt === undefined ? existing.defaultPrompt : String(patch.defaultPrompt ?? '').trim()
        const defaultEnabled = patch.defaultEnabled === undefined ? existing.defaultEnabled : Boolean(patch.defaultEnabled)
        const recommendedSkillIds = patch.recommendedSkillIds === undefined ? existing.recommendedSkillIds : patch.recommendedSkillIds

        if (!isValidName(name, 2, 40)) return cur
        if (summary.length < 2 || summary.length > 240) return cur
        if (responsibilities.length < 2 || responsibilities.length > 800) return cur
        if (defaultPrompt.length < 2 || defaultPrompt.length > 4000) return cur

        return {
          ...cur,
          agentTemplates: {
            ...cur.agentTemplates,
            [templateId]: {
              ...existing,
              name,
              summary,
              responsibilities,
              defaultPrompt,
              defaultEnabled,
              recommendedSkillIds: Array.isArray(recommendedSkillIds) ? recommendedSkillIds : [],
              updatedAt: now,
            },
          },
        }
      })

      const found = next.agentTemplates[templateId]
      if (!found) return { ok: false, error: 'template_not_found' }
      if (found.scope === 'system') return { ok: false, error: 'template_readonly' }
      return { ok: true, data: found }
    },

    async listInstances(token: string, workspaceId: Id): Promise<Result<AgentInstance[]>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(200)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()
      void getMembershipByUserId(db, user.id)
      return {
        ok: true,
        data: recordValues(db.workspaceAgents)
          .filter((a) => a.workspaceId === workspaceId)
          .map((a) => ({
            ...a,
            enabled: a.status === 'active',
            skillBindings: resolveAgentSkillBindings(db, a as AgentInstance),
          }))
          .slice()
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      }
    },

    async createInstance(
      token: string,
      input: { workspaceId: Id; templateId: Id | null; name: string; summary: string; status: 'active' | 'inactive' | 'draft' | 'archived' },
    ): Promise<Result<AgentInstance>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(260)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()

      const ws = db.workspaces[input.workspaceId]
      if (!ws) return { ok: false, error: 'workspace_not_found' }
      if (ws.archivedAt) return { ok: false, error: 'workspace_archived' }

      const template = input.templateId ? db.agentTemplates[input.templateId] : null
      if (input.templateId && !template) return { ok: false, error: 'template_not_found' }

      const name = normalizeName(input.name)
      const summary = String(input.summary ?? '').trim()
      if (!isValidName(name, 2, 40)) return { ok: false, error: 'invalid_agent_name' }
      if (summary.length < 2 || summary.length > 240) return { ok: false, error: 'invalid_agent_summary' }

      const id = `ag_${crypto.randomUUID()}`
      const now = new Date().toISOString()

      const recommendedSkillIds = template?.recommendedSkillIds ?? []
      const bindingIds: Id[] = []
      const newBindings: Record<string, SkillBinding> = {}
      recommendedSkillIds.forEach((skillId, idx) => {
        const bId = `sb_${crypto.randomUUID()}`
        bindingIds.push(bId)
        newBindings[bId] = {
          id: bId,
          tenantId: db.tenant.id,
          workspaceId: input.workspaceId,
          target: { type: 'workspaceAgent', agentId: id },
          skillId,
          enabled: true,
          priority: (idx + 1) * 10,
          createdAt: now,
          updatedAt: now,
        }
      })

      const next = setMockDb((cur) => ({
        ...cur,
        skillBindings: { ...cur.skillBindings, ...newBindings },
        workspaceAgents: {
          ...cur.workspaceAgents,
          [id]: {
            id,
            tenantId: cur.tenant.id,
            workspaceId: input.workspaceId,
            templateId: input.templateId ?? null,
            name,
            summary,
            status: input.status,
            promptOverride: null,
            skillBindingIds: bindingIds,
            workflowIds: [],
            createdAt: now,
            updatedAt: now,
          },
        },
      }))

      const created = next.workspaceAgents[id]
      return {
        ok: true,
        data: {
          ...(created as AgentInstance),
          enabled: created.status === 'active',
          skillBindings: resolveAgentSkillBindings(next, created as AgentInstance),
        },
      }
    },

    async updateInstance(
      token: string,
      agentId: Id,
      patch: Partial<{ name: string; summary: string; status: 'active' | 'inactive' | 'draft' | 'archived'; workspaceId: Id }>,
    ): Promise<Result<AgentInstance>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(240)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }

      const next = setMockDb((cur) => {
        const existing = cur.workspaceAgents[agentId]
        if (!existing) return cur

        const wsId = patch.workspaceId ?? existing.workspaceId
        const ws = cur.workspaces[wsId]
        if (!ws || ws.archivedAt) return cur

        const name = patch.name === undefined ? existing.name : normalizeName(patch.name)
        const summary = patch.summary === undefined ? existing.summary : String(patch.summary ?? '').trim()
        const status = patch.status === undefined ? existing.status : patch.status

        if (!isValidName(name, 2, 40)) return cur
        if (summary.length < 2 || summary.length > 240) return cur

        const now = new Date().toISOString()
        return {
          ...cur,
          workspaceAgents: {
            ...cur.workspaceAgents,
            [agentId]: {
              ...existing,
              workspaceId: wsId,
              name,
              summary,
              status,
              updatedAt: now,
            },
          },
        }
      })

      const found = next.workspaceAgents[agentId]
      if (!found) return { ok: false, error: 'agent_not_found' }
      return {
        ok: true,
        data: {
          ...(found as AgentInstance),
          enabled: found.status === 'active',
          skillBindings: resolveAgentSkillBindings(next, found as AgentInstance),
        },
      }
    },

    async toggleEnabled(token: string, agentId: Id): Promise<Result<AgentInstance>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(220)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }

      const next = setMockDb((cur) => {
        const existing = cur.workspaceAgents[agentId]
        if (!existing) return cur
        const nextStatus = existing.status === 'active' ? 'inactive' : 'active'
        return {
          ...cur,
          workspaceAgents: {
            ...cur.workspaceAgents,
            [agentId]: { ...existing, status: nextStatus, updatedAt: new Date().toISOString() },
          },
        }
      })

      const found = next.workspaceAgents[agentId]
      if (!found) return { ok: false, error: 'agent_not_found' }
      const db = next
      return {
        ok: true,
        data: {
          ...(found as AgentInstance),
          enabled: found.status === 'active',
          skillBindings: resolveAgentSkillBindings(db, found as AgentInstance),
        },
      }
    },

    async getInstance(token: string, agentId: Id): Promise<Result<AgentInstance>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(150)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()
      const found = db.workspaceAgents[agentId]
      if (!found) return { ok: false, error: 'agent_not_found' }
      return {
        ok: true,
        data: {
          ...(found as AgentInstance),
          enabled: found.status === 'active',
          skillBindings: resolveAgentSkillBindings(db, found as AgentInstance),
        },
      }
    },

    async setSkillBindings(token: string, agentId: Id, skillIds: Id[]): Promise<Result<AgentInstance>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(260)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()
      const agent = db.workspaceAgents[agentId]
      if (!agent) return { ok: false, error: 'agent_not_found' }
      const ws = db.workspaces[agent.workspaceId]
      if (!ws || ws.archivedAt) return { ok: false, error: 'workspace_archived' }

      const requested = Array.from(new Set((skillIds ?? []).filter(Boolean)))
      for (const sid of requested) {
        const s = db.skills[sid]
        if (!s || s.archivedAt) return { ok: false, error: 'skill_not_found' }
      }

      const next = setMockDb((cur) => {
        const existingAgent = cur.workspaceAgents[agentId]
        if (!existingAgent) return cur

        const updatedAt = new Date().toISOString()
        const nextBindings = { ...cur.skillBindings }

        const existingBindingIds = existingAgent.skillBindingIds.slice()
        const existingSkillIds = existingBindingIds
          .map((bid) => nextBindings[bid])
          .filter(Boolean)
          .map((b) => b.skillId)

        const toAdd = requested.filter((sid) => !existingSkillIds.includes(sid))
        const toRemoveBindingIds = existingBindingIds.filter((bid) => {
          const b = nextBindings[bid]
          if (!b) return false
          return !requested.includes(b.skillId)
        })

        let maxPriority = 0
        for (const bid of existingBindingIds) {
          const b = nextBindings[bid]
          if (b && b.priority > maxPriority) maxPriority = b.priority
        }

        const addedIds: Id[] = []
        toAdd.forEach((skillId, idx) => {
          const id = `sb_${crypto.randomUUID()}`
          addedIds.push(id)
          nextBindings[id] = {
            id,
            tenantId: cur.tenant.id,
            workspaceId: existingAgent.workspaceId,
            target: { type: 'workspaceAgent', agentId },
            skillId,
            enabled: true,
            priority: maxPriority + (idx + 1) * 10,
            createdAt: updatedAt,
            updatedAt,
          }
        })

        toRemoveBindingIds.forEach((bid) => {
          delete nextBindings[bid]
        })

        const nextAgent = {
          ...existingAgent,
          skillBindingIds: existingBindingIds.filter((bid) => !toRemoveBindingIds.includes(bid)).concat(addedIds),
          updatedAt,
        }

        return { ...cur, skillBindings: nextBindings, workspaceAgents: { ...cur.workspaceAgents, [agentId]: nextAgent } }
      })

      const found = next.workspaceAgents[agentId]
      if (!found) return { ok: false, error: 'agent_not_found' }
      return {
        ok: true,
        data: {
          ...(found as AgentInstance),
          enabled: found.status === 'active',
          skillBindings: resolveAgentSkillBindings(next, found as AgentInstance),
        },
      }
    },
  },

  skills: {
    async list(token: string, workspaceId: Id): Promise<Result<{ global: Skill[]; workspace: Skill[]; agent: Skill[] }>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(180)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()

      const all = recordValues(db.skills).filter((s) => !s.archivedAt)
      return {
        ok: true,
        data: {
          global: all.filter((s) => s.scope === 'global'),
          workspace: all.filter((s) => s.scope === 'workspace' && s.owner.type === 'workspace' && s.owner.workspaceId === workspaceId),
          agent: all.filter((s) => s.scope === 'agent' && s.owner.type === 'agent' && s.owner.workspaceId === workspaceId),
        },
      }
    },

    async listAll(token: string): Promise<Result<Skill[]>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(120)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()
      return { ok: true, data: recordValues(db.skills).filter((s) => !s.archivedAt) }
    },

    async get(token: string, skillId: Id): Promise<Result<Skill>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(110)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()
      const found = db.skills[skillId]
      if (!found || found.archivedAt) return { ok: false, error: 'skill_not_found' }
      return { ok: true, data: found }
    },

    async create(
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
    ): Promise<Result<Skill>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(240)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }

      const name = normalizeName(input.name)
      const description = String(input.description ?? '').trim()
      const version = String(input.version ?? '').trim() || '0.1.0'
      const contentText = String(input.contentText ?? '').trim()

      if (!isValidName(name, 2, 60)) return { ok: false, error: 'invalid_skill_name' }
      if (description.length < 2 || description.length > 240) return { ok: false, error: 'invalid_skill_description' }
      if (contentText.length < 2 || contentText.length > 2000) return { ok: false, error: 'invalid_skill_content' }

      const db = getMockDb()
      const skillId = `sk_${crypto.randomUUID()}`
      const now = new Date().toISOString()

      const scope = input.scope
      const owner: Skill['owner'] =
        scope === 'global'
          ? { type: 'tenant', tenantId: db.tenant.id }
          : scope === 'workspace'
            ? input.workspaceId
              ? { type: 'workspace', tenantId: db.tenant.id, workspaceId: input.workspaceId }
              : null
            : input.workspaceId && input.agentId
              ? { type: 'agent', tenantId: db.tenant.id, workspaceId: input.workspaceId, agentId: input.agentId }
              : null

      if (!owner) return { ok: false, error: 'invalid_skill_owner' }

      if (scope === 'workspace') {
        const ws = db.workspaces[(owner as { workspaceId: Id }).workspaceId]
        if (!ws || ws.archivedAt) return { ok: false, error: 'workspace_not_found' }
      }
      if (scope === 'agent') {
        const wsId = (owner as { workspaceId: Id }).workspaceId
        const ws = db.workspaces[wsId]
        if (!ws || ws.archivedAt) return { ok: false, error: 'workspace_not_found' }
        const agentId = (owner as { agentId: Id }).agentId
        const agent = db.workspaceAgents[agentId]
        if (!agent || agent.workspaceId !== wsId) return { ok: false, error: 'agent_not_found' }
      }

      const next = setMockDb((cur) => {
        const skill: Skill = {
          id: skillId,
          tenantId: cur.tenant.id,
          scope,
          owner: owner as Skill['owner'],
          name,
          kind: input.kind,
          description,
          version,
          enabled: Boolean(input.enabled),
          archivedAt: null,
          source: input.source,
          content: { text: contentText },
          createdAt: now,
          updatedAt: now,
        }
        return { ...cur, skills: { ...cur.skills, [skillId]: skill } }
      })

      return { ok: true, data: next.skills[skillId] }
    },

    async update(
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
    ): Promise<Result<Skill>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(220)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }

      const next = setMockDb((cur) => {
        const existing = cur.skills[skillId]
        if (!existing || existing.archivedAt) return cur

        const name = patch.name === undefined ? existing.name : normalizeName(patch.name)
        const description = patch.description === undefined ? existing.description : String(patch.description ?? '').trim()
        const version = patch.version === undefined ? existing.version : String(patch.version ?? '').trim()
        const contentText = patch.contentText === undefined ? existing.content.text : String(patch.contentText ?? '').trim()

        if (!isValidName(name, 2, 60)) return cur
        if (description.length < 2 || description.length > 240) return cur
        if (contentText.length < 2 || contentText.length > 2000) return cur

        const updatedAt = new Date().toISOString()
        const updated: Skill = {
          ...existing,
          name,
          kind: patch.kind === undefined ? existing.kind : patch.kind,
          description,
          version,
          enabled: patch.enabled === undefined ? existing.enabled : Boolean(patch.enabled),
          source: patch.source === undefined ? existing.source : patch.source,
          content: { text: contentText },
          updatedAt,
        }

        return { ...cur, skills: { ...cur.skills, [skillId]: updated } }
      })

      const found = next.skills[skillId]
      if (!found || found.archivedAt) return { ok: false, error: 'skill_not_found' }
      return { ok: true, data: found }
    },

    async remove(token: string, skillId: Id): Promise<Result<Skill>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(200)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }

      const next = setMockDb((cur) => {
        const existing = cur.skills[skillId]
        if (!existing || existing.archivedAt) return cur
        const updatedAt = new Date().toISOString()
        const updated: Skill = { ...existing, archivedAt: updatedAt, updatedAt }

        const nextAgents = { ...cur.workspaceAgents }
        const nextBindings = { ...cur.skillBindings }
        for (const agent of Object.values(nextAgents)) {
          const removeIds = agent.skillBindingIds.filter((bid) => nextBindings[bid]?.skillId === skillId)
          if (removeIds.length === 0) continue
          agent.skillBindingIds = agent.skillBindingIds.filter((bid) => !removeIds.includes(bid))
          agent.updatedAt = updatedAt
          for (const bid of removeIds) delete nextBindings[bid]
        }

        return { ...cur, skills: { ...cur.skills, [skillId]: updated }, workspaceAgents: nextAgents, skillBindings: nextBindings }
      })

      const found = next.skills[skillId]
      if (!found) return { ok: false, error: 'skill_not_found' }
      return { ok: true, data: found }
    },
  },

  workflows: {
    async list(token: string, workspaceId: Id): Promise<Result<Workflow[]>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(180)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()
      return {
        ok: true,
        data: recordValues(db.workflows)
          .filter((w) => w.workspaceId === workspaceId)
          .slice()
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      }
    },

    async get(token: string, workflowId: Id): Promise<Result<Workflow>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(120)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()
      const found = db.workflows[workflowId]
      if (!found) return { ok: false, error: 'workflow_not_found' }
      return { ok: true, data: found }
    },

    async create(
      token: string,
      input: { workspaceId: Id; name: string; description: string; nodes: Workflow['nodes'] },
    ): Promise<Result<Workflow>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(260)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }

      const name = normalizeName(input.name)
      const description = String(input.description ?? '').trim()
      if (!isValidName(name, 2, 60)) return { ok: false, error: 'invalid_workflow_name' }
      if (description.length < 2 || description.length > 240) return { ok: false, error: 'invalid_workflow_description' }

      const db = getMockDb()
      const ws = db.workspaces[input.workspaceId]
      if (!ws) return { ok: false, error: 'workspace_not_found' }
      if (ws.archivedAt) return { ok: false, error: 'workspace_archived' }

      const workflowId = `wf_${crypto.randomUUID()}`
      const now = new Date().toISOString()

      const nodes = (input.nodes ?? []).map((n, idx) => {
        const id = n.id || `node_${crypto.randomUUID()}`
        return {
          ...n,
          id,
          tenantId: db.tenant.id,
          workflowId,
          title: n.title || `${n.type.toUpperCase()} ${idx + 1}`,
          description: n.description || '',
          agentId: n.type === 'agent' ? n.agentId : null,
          status: n.status || 'pending',
          config: n.config,
        }
      })

      if (nodes.length < 2) return { ok: false, error: 'invalid_workflow_nodes' }
      if (nodes[0].type !== 'start') return { ok: false, error: 'workflow_must_start_with_start' }
      if (nodes[nodes.length - 1].type !== 'end') return { ok: false, error: 'workflow_must_end_with_end' }

      const edges = nodes.slice(0, -1).map((from, idx) => {
        const to = nodes[idx + 1]
        return {
          id: `edge_${crypto.randomUUID()}`,
          tenantId: db.tenant.id,
          workflowId,
          fromNodeId: from.id,
          toNodeId: to.id,
          condition: null,
        }
      })

      const agentIds = nodes.filter((n) => n.type === 'agent' && n.agentId).map((n) => n.agentId as string)

      const next = setMockDb((cur) => {
        const nextAgents = { ...cur.workspaceAgents }
        Object.values(nextAgents)
          .filter((a) => a.workspaceId === input.workspaceId)
          .forEach((a) => {
            const has = agentIds.includes(a.id)
            const exists = a.workflowIds.includes(workflowId)
            if (has && !exists) a.workflowIds = [...a.workflowIds, workflowId]
            if (!has && exists) a.workflowIds = a.workflowIds.filter((id) => id !== workflowId)
          })

        const wf: Workflow = {
          id: workflowId,
          tenantId: cur.tenant.id,
          workspaceId: input.workspaceId,
          name,
          description,
          status: 'active',
          startNodeId: nodes[0].id,
          nodes,
          edges,
          createdAt: now,
          updatedAt: now,
        }

        const workflowNodes = { ...cur.workflowNodes }
        nodes.forEach((n) => {
          workflowNodes[n.id] = n
        })
        const workflowEdges = { ...cur.workflowEdges }
        edges.forEach((e) => {
          workflowEdges[e.id] = e
        })

        return {
          ...cur,
          workflows: { ...cur.workflows, [workflowId]: wf },
          workspaceAgents: nextAgents,
          workflowNodes,
          workflowEdges,
        }
      })

      return { ok: true, data: next.workflows[workflowId] }
    },

    async update(
      token: string,
      workflowId: Id,
      patch: Partial<{ name: string; description: string; nodes: Workflow['nodes'] }>,
    ): Promise<Result<Workflow>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(260)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }

      const next = setMockDb((cur) => {
        const existing = cur.workflows[workflowId]
        if (!existing) return cur

        const ws = cur.workspaces[existing.workspaceId]
        if (!ws || ws.archivedAt) return cur

        const name = patch.name === undefined ? existing.name : normalizeName(patch.name)
        const description = patch.description === undefined ? existing.description : String(patch.description ?? '').trim()
        if (!isValidName(name, 2, 60)) return cur
        if (description.length < 2 || description.length > 240) return cur

        const nodes = (patch.nodes ?? existing.nodes).map((n, idx) => {
          const id = n.id || `node_${crypto.randomUUID()}`
          return {
            ...n,
            id,
            tenantId: cur.tenant.id,
            workflowId,
            title: n.title || `${n.type.toUpperCase()} ${idx + 1}`,
            description: n.description || '',
            agentId: n.type === 'agent' ? n.agentId : null,
            status: n.status || 'pending',
            config: n.config,
          }
        })

        if (nodes.length < 2) return cur
        if (nodes[0].type !== 'start') return cur
        if (nodes[nodes.length - 1].type !== 'end') return cur

        const edges = nodes.slice(0, -1).map((from, idx) => {
          const to = nodes[idx + 1]
          return {
            id: `edge_${crypto.randomUUID()}`,
            tenantId: cur.tenant.id,
            workflowId,
            fromNodeId: from.id,
            toNodeId: to.id,
            condition: null,
          }
        })

        const agentIds = nodes.filter((n) => n.type === 'agent' && n.agentId).map((n) => n.agentId as string)
        const nextAgents = { ...cur.workspaceAgents }
        Object.values(nextAgents)
          .filter((a) => a.workspaceId === existing.workspaceId)
          .forEach((a) => {
            const has = agentIds.includes(a.id)
            const existsIn = a.workflowIds.includes(workflowId)
            if (has && !existsIn) a.workflowIds = [...a.workflowIds, workflowId]
            if (!has && existsIn) a.workflowIds = a.workflowIds.filter((id) => id !== workflowId)
          })

        const now = new Date().toISOString()
        const wf: Workflow = {
          ...existing,
          name,
          description,
          startNodeId: nodes[0].id,
          nodes,
          edges,
          updatedAt: now,
        }

        const workflowNodes = { ...cur.workflowNodes }
        nodes.forEach((n) => {
          workflowNodes[n.id] = n
        })
        const workflowEdges = { ...cur.workflowEdges }
        edges.forEach((e) => {
          workflowEdges[e.id] = e
        })

        return {
          ...cur,
          workflows: { ...cur.workflows, [workflowId]: wf },
          workspaceAgents: nextAgents,
          workflowNodes,
          workflowEdges,
        }
      })

      const found = next.workflows[workflowId]
      if (!found) return { ok: false, error: 'workflow_not_found' }
      return { ok: true, data: found }
    },
  },

  execution: {
    async listRuns(token: string, workspaceId: Id): Promise<Result<WorkflowRun[]>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(160)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()
      return {
        ok: true,
        data: recordValues(db.runs)
          .filter((r) => r.workspaceId === workspaceId)
          .slice()
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      }
    },

    async getRun(token: string, runId: Id): Promise<Result<WorkflowRun>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(120)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()
      const found = db.runs[runId]
      if (!found) return { ok: false, error: 'run_not_found' }
      return { ok: true, data: found }
    },

    async startRun(
      token: string,
      input: { workspaceId: Id; workflowId: Id; title: string; description: string; input: Record<string, unknown> },
    ): Promise<Result<{ runId: Id; status: WorkflowRun['status']; pendingReviewId: Id | null }>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(220)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()

      const ws = db.workspaces[input.workspaceId]
      if (!ws) return { ok: false, error: 'workspace_not_found' }
      if (ws.archivedAt) return { ok: false, error: 'workspace_archived' }

      const wf = db.workflows[input.workflowId]
      if (!wf || wf.workspaceId !== input.workspaceId) return { ok: false, error: 'workflow_not_found' }

      const now = new Date().toISOString()
      const taskId = `task_${crypto.randomUUID()}`
      const runId = `run_${crypto.randomUUID()}`

      const normalizeText = (v: unknown) => String(v ?? '').trim()
      const title = normalizeText(input.title) || normalizeText(input.input?.goal) || 'Task'
      const description = normalizeText(input.description) || ''

      const evalCondition = (expr: string, vars: Record<string, unknown>) => {
        const x = String(expr ?? '').trim()
        if (!x) return false
        if (x.includes('risk_level') && x.includes('high')) return String(vars.risk_level ?? '') === 'high'
        if (x.includes('risk_level') && x.includes('low')) return String(vars.risk_level ?? '') === 'low'
        return false
      }

      let pendingReviewId: Id | null = null
      let finalStatus: WorkflowRun['status'] = 'running'

      const next = setMockDb((cur) => {
        const workflow = cur.workflows[input.workflowId]
        const workspace = cur.workspaces[input.workspaceId]
        if (!workflow || !workspace || workspace.archivedAt) return cur

        const nextTasks = { ...cur.tasks }
        nextTasks[taskId] = {
          id: taskId,
          tenantId: cur.tenant.id,
          workspaceId: input.workspaceId,
          title,
          description,
          input: input.input ?? {},
          createdByUserId: user.id,
          createdAt: now,
          updatedAt: now,
        }

        const nextRuns = { ...cur.runs }
        nextRuns[runId] = {
          id: runId,
          tenantId: cur.tenant.id,
          workspaceId: input.workspaceId,
          workflowId: input.workflowId,
          taskId,
          status: 'running',
          triggeredByUserId: user.id,
          triggeredBy: user.username,
          createdAt: now,
          startedAt: now,
          finishedAt: null,
        }

        const nextNodeRuns = { ...cur.nodeRuns }
        const nextReviews = { ...cur.reviews }
        const nextLogs = { ...cur.executionLogs }

        const createNodeRun = (
          nodeId: Id,
          status: WorkflowNodeRun['status'],
          output: WorkflowNodeRun['output'],
        ) => {
          const id = `nrun_${crypto.randomUUID()}`
          nextNodeRuns[id] = {
            id,
            tenantId: cur.tenant.id,
            workspaceId: input.workspaceId,
            runId,
            nodeId,
            status,
            startedAt: now,
            finishedAt: status === 'completed' || status === 'approved' || status === 'rejected' ? now : null,
            output,
          }

          const logId = `log_${crypto.randomUUID()}`
          nextLogs[logId] = {
            id: logId,
            tenantId: cur.tenant.id,
            workspaceId: input.workspaceId,
            runId,
            nodeRunId: id,
            agentId: null,
            level: 'info',
            message: `node_run.${status}`,
            data: { nodeId },
            createdAt: now,
          }

          return id
        }

        const nodeById = new Map(workflow.nodes.map((n) => [n.id, n]))
        const visited = new Set<Id>()

        const nextByOrder = (nodeId: Id) => {
          const idx = workflow.nodes.findIndex((n) => n.id === nodeId)
          if (idx < 0) return null
          return workflow.nodes[idx + 1]?.id ?? null
        }

        const nextByEdges = (fromNodeId: Id, condition: string) => {
          const e = workflow.edges.find((x) => x.fromNodeId === fromNodeId && x.condition === condition)
          return e?.toNodeId ?? null
        }

        let currentId: Id | null = workflow.startNodeId
        let safety = 0

        while (currentId && safety++ < 20) {
          if (visited.has(currentId)) break
          visited.add(currentId)

          const node = nodeById.get(currentId) ?? null
          if (!node) break

          if (node.type === 'start') {
            createNodeRun(node.id, 'completed', { text: 'Input received.', artifacts: [] })
            currentId = nextByEdges(node.id, 'approved') ?? nextByOrder(node.id)
            continue
          }

          if (node.type === 'agent') {
            const agentId = node.agentId
            const agent = agentId ? cur.workspaceAgents[agentId] ?? null : null
            const out = {
              text: agent
                ? `Agent ${agent.name} produced a draft output for: ${title}`
                : `Agent produced a draft output for: ${title}`,
              artifacts: [{ name: 'output.md', uri: 'mock://artifacts/output.md' }],
            }
            const nrId = createNodeRun(node.id, 'completed', out)
            const logId = `log_${crypto.randomUUID()}`
            nextLogs[logId] = {
              id: logId,
              tenantId: cur.tenant.id,
              workspaceId: input.workspaceId,
              runId,
              nodeRunId: nrId,
              agentId: agent?.id ?? null,
              level: 'info',
              message: 'agent.output',
              data: { agentId: agent?.id ?? null },
              createdAt: now,
            }
            currentId = nextByEdges(node.id, 'approved') ?? nextByOrder(node.id)
            continue
          }

          if (node.type === 'condition') {
            const cfg = node.config.type === 'condition' ? node.config : null
            const passed = cfg ? evalCondition(cfg.expression, input.input ?? {}) : false
            createNodeRun(node.id, 'completed', {
              text: passed ? 'Condition matched: true branch.' : 'Condition matched: false branch.',
              artifacts: [],
            })
            const toNodeId = cfg ? (passed ? cfg.trueToNodeId : cfg.falseToNodeId) : null
            currentId = toNodeId ?? nextByOrder(node.id)
            continue
          }

          if (node.type === 'review') {
            createNodeRun(node.id, 'waiting_review', { text: 'Waiting for review.', artifacts: [] })
            const rid = `rev_${crypto.randomUUID()}`
            nextReviews[rid] = {
              id: rid,
              tenantId: cur.tenant.id,
              workspaceId: input.workspaceId,
              runId,
              nodeId: node.id,
              title: node.title,
              summary: node.description || '等待审核。',
              status: 'pending',
              createdAt: now,
              updatedAt: now,
            }
            pendingReviewId = rid
            finalStatus = 'waiting_review'
            nextRuns[runId] = { ...nextRuns[runId], status: 'waiting_review', finishedAt: null }
            currentId = null
            continue
          }

          if (node.type === 'end') {
            createNodeRun(node.id, 'completed', { text: 'Workflow completed.', artifacts: [] })
            finalStatus = 'succeeded'
            nextRuns[runId] = { ...nextRuns[runId], status: 'succeeded', finishedAt: now }
            currentId = null
            continue
          }

          currentId = nextByOrder(node.id)
        }

        if (finalStatus === 'running') {
          nextRuns[runId] = { ...nextRuns[runId], status: 'running', finishedAt: null }
        }

        return { ...cur, tasks: nextTasks, runs: nextRuns, nodeRuns: nextNodeRuns, reviews: nextReviews, executionLogs: nextLogs }
      })

      const created = next.runs[runId]
      if (!created) return { ok: false, error: 'run_not_created' }
      return { ok: true, data: { runId, status: finalStatus, pendingReviewId } }
    },

    async getRunDetail(
      token: string,
      runId: Id,
    ): Promise<
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
    > {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(140)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()
      const run = db.runs[runId]
      if (!run) return { ok: false, error: 'run_not_found' }
      const workflow = db.workflows[run.workflowId]
      if (!workflow) return { ok: false, error: 'workflow_not_found' }

      const nodeRuns = recordValues(db.nodeRuns)
        .filter((nr) => nr.runId === runId)
        .map((nr) => ({
          id: nr.id,
          nodeId: nr.nodeId,
          status: nr.status,
          startedAt: nr.startedAt,
          finishedAt: nr.finishedAt,
          outputText: nr.output?.text ?? null,
          artifactCount: nr.output?.artifacts?.length ?? 0,
        }))

      const reviews = recordValues(db.reviews).filter((r) => r.runId === runId)

      return { ok: true, data: { run, workflow, nodeRuns, reviews } }
    },
  },

  reviews: {
    async list(token: string, workspaceId: Id): Promise<Result<ReviewItem[]>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(180)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()
      return {
        ok: true,
        data: recordValues(db.reviews)
          .filter((r) => r.workspaceId === workspaceId)
          .slice()
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      }
    },

    async get(token: string, reviewId: Id): Promise<Result<ReviewItem>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(120)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()
      const found = db.reviews[reviewId]
      if (!found) return { ok: false, error: 'review_not_found' }
      return { ok: true, data: found }
    },

    async getDetail(
      token: string,
      reviewId: Id,
    ): Promise<
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
    > {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(140)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }
      const db = getMockDb()
      const review = db.reviews[reviewId]
      if (!review) return { ok: false, error: 'review_not_found' }
      const run = db.runs[review.runId]
      if (!run) return { ok: false, error: 'run_not_found' }
      const workflow = db.workflows[run.workflowId]
      if (!workflow) return { ok: false, error: 'workflow_not_found' }

      const node = workflow.nodes.find((n) => n.id === review.nodeId) ?? null
      const nodeTitle = node?.title ?? review.title
      const nodeDescription = node?.description ?? ''

      const nodeRun = recordValues(db.nodeRuns).find((nr) => nr.runId === review.runId && nr.nodeId === review.nodeId) ?? null

      const idx = workflow.nodes.findIndex((n) => n.id === review.nodeId)
      const prevAgentNode = idx > 0 ? workflow.nodes.slice(0, idx).reverse().find((n) => n.type === 'agent') ?? null : null
      const prevNodeRun = prevAgentNode
        ? recordValues(db.nodeRuns).find((nr) => nr.runId === review.runId && nr.nodeId === prevAgentNode.id) ?? null
        : null

      const history = recordValues(db.reviewActions)
        .filter((a) => a.runId === review.runId)
        .filter((a) => (nodeRun ? a.nodeRunId === nodeRun.id : a.nodeRunId === review.nodeId))
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((a) => ({ id: a.id, decision: a.decision, comment: a.comment, createdAt: a.createdAt, createdByUserId: a.createdByUserId }))

      return {
        ok: true,
        data: {
          review,
          run,
          workflow,
          nodeId: review.nodeId,
          nodeTitle,
          nodeDescription,
          nodeRunId: nodeRun?.id ?? null,
          nodeRunStatus: nodeRun?.status ?? null,
          evidence: {
            previousNodeId: prevAgentNode?.id ?? null,
            previousNodeTitle: prevAgentNode?.title ?? null,
            previousNodeOutputText: prevNodeRun?.output?.text ?? null,
            previousNodeArtifacts: prevNodeRun?.output?.artifacts ?? [],
          },
          history,
        },
      }
    },

    async act(
      token: string,
      reviewId: Id,
      input: { decision: 'approve' | 'reject' | 'comment'; comment: string },
    ): Promise<Result<{ review: ReviewItem }>> {
      if (MODE !== 'mock') return { ok: false, error: 'unsupported_mode' }
      await mockDelay(240)
      const user = getUserByToken(token)
      if (!user) return { ok: false, error: 'invalid_token' }

      const decision = input.decision
      const comment = String(input.comment ?? '').trim()

      const next = setMockDb((cur) => {
        const review = cur.reviews[reviewId]
        if (!review) return cur

        const updatedAt = new Date().toISOString()

        const run = cur.runs[review.runId] ?? null
        const workflow = run ? cur.workflows[run.workflowId] ?? null : null
        const reviewNode = workflow ? workflow.nodes.find((n) => n.id === review.nodeId) ?? null : null
        const reviewNodeConfig = reviewNode && reviewNode.config.type === 'review' ? reviewNode.config : null

        const nodeRun = recordValues(cur.nodeRuns).find((nr) => nr.runId === review.runId && nr.nodeId === review.nodeId) ?? null

        const nextReview: ReviewItem =
          decision === 'comment'
            ? review
            : {
                ...review,
                status: decision === 'approve' ? 'approved' : 'rejected',
                updatedAt,
              }

        const nextRuns = { ...cur.runs }
        const nextNodeRuns = { ...cur.nodeRuns }
        const nextReviews = { ...cur.reviews, [reviewId]: nextReview }

        if (nodeRun && decision !== 'comment') {
          nextNodeRuns[nodeRun.id] = {
            ...nodeRun,
            status: decision === 'approve' ? 'approved' : 'rejected',
            finishedAt: updatedAt,
            output: nodeRun.output
              ? { ...nodeRun.output, text: comment ? `${nodeRun.output.text}\n\nReviewer: ${comment}` : nodeRun.output.text }
              : comment
                ? { text: `Reviewer: ${comment}`, artifacts: [] }
                : nodeRun.output,
          }
        }

        const reviewActionId = `ract_${crypto.randomUUID()}`
        const nextReviewActions: Record<Id, ReviewAction> = {
          ...cur.reviewActions,
          [reviewActionId]: {
            id: reviewActionId,
            tenantId: review.tenantId,
            workspaceId: review.workspaceId,
            runId: review.runId,
            nodeRunId: nodeRun?.id ?? review.nodeId,
            decision,
            comment,
            createdByUserId: user.id,
            createdAt: updatedAt,
          },
        }

        const createNodeRun = (nodeId: Id, status: WorkflowNodeRun['status'], output: WorkflowNodeRun['output']) => {
          const id = `nrun_${crypto.randomUUID()}`
          nextNodeRuns[id] = {
            id,
            tenantId: review.tenantId,
            workspaceId: review.workspaceId,
            runId: review.runId,
            nodeId,
            status,
            startedAt: updatedAt,
            finishedAt: status === 'completed' || status === 'approved' || status === 'rejected' ? updatedAt : null,
            output,
          }
          return id
        }

        const findEdgeTarget = (fromNodeId: Id, condition: string) => {
          if (!workflow) return null
          const e = workflow.edges.find((x) => x.fromNodeId === fromNodeId && x.condition === condition)
          if (!e) return null
          return e.toNodeId
        }

        const findNextByOrder = (nodeId: Id) => {
          if (!workflow) return null
          const idx = workflow.nodes.findIndex((n) => n.id === nodeId)
          if (idx < 0) return null
          return workflow.nodes[idx + 1]?.id ?? null
        }

        if (run && decision === 'approve') {
          const toNodeId = findEdgeTarget(review.nodeId, 'approved') ?? findNextByOrder(review.nodeId)
          const toNode = workflow?.nodes.find((n) => n.id === toNodeId) ?? null

          if (toNode?.type === 'end') {
            nextRuns[run.id] = { ...run, status: 'succeeded', finishedAt: updatedAt }
            createNodeRun(toNode.id, 'completed', { text: 'Workflow completed.', artifacts: [] })
          } else if (toNode?.type === 'review') {
            nextRuns[run.id] = { ...run, status: 'waiting_review', finishedAt: null }
            createNodeRun(toNode.id, 'waiting_review', { text: 'Waiting for review.', artifacts: [] })
            const rid = `rev_${crypto.randomUUID()}`
            nextReviews[rid] = {
              id: rid,
              tenantId: review.tenantId,
              workspaceId: review.workspaceId,
              runId: review.runId,
              nodeId: toNode.id,
              title: `${toNode.title}`,
              summary: toNode.description || '等待审核。',
              status: 'pending',
              createdAt: updatedAt,
              updatedAt,
            }
          } else if (toNode) {
            nextRuns[run.id] = { ...run, status: 'running', finishedAt: null }
            createNodeRun(toNode.id, 'running', null)
          } else {
            nextRuns[run.id] = { ...run, status: 'running', finishedAt: null }
          }
        }

        if (run && decision === 'reject') {
          const onReject = reviewNodeConfig?.onReject ?? 'pause'
          const backToNodeId = reviewNodeConfig?.backToNodeId ?? null

          if (onReject === 'back_to' && backToNodeId) {
            nextRuns[run.id] = { ...run, status: 'running', finishedAt: null }
            createNodeRun(backToNodeId, 'running', null)
          } else {
            nextRuns[run.id] = { ...run, status: 'paused', finishedAt: null }
          }
        }

        return {
          ...cur,
          reviews: nextReviews,
          runs: nextRuns,
          nodeRuns: nextNodeRuns,
          reviewActions: nextReviewActions,
        }
      })

      const found = next.reviews[reviewId]
      if (!found) return { ok: false, error: 'review_not_found' }
      return { ok: true, data: { review: found } }
    },
  },
}
