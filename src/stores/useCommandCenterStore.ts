import { create } from 'zustand'
import type { AgentInstance, Id, Workflow } from '@/types/domain'
import { appService } from '@/services'
import { mockOrchestrate, type CommandProposal } from '@/lib/orchestrator'
import { codexPlan } from '@/lib/codexClient'

type WorkspaceContext = {
  id: Id
  name: string
  agents: AgentInstance[]
  workflows: Workflow[]
}

type Context = {
  workspaces: Array<{ id: Id; name: string }>
  byWorkspaceId: Record<Id, WorkspaceContext>
}

type State = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  planStatus: 'idle' | 'loading' | 'ready' | 'error'
  runStatus: 'idle' | 'running' | 'waiting_review' | 'done' | 'error'
  error: string | null

  input: string
  planner: 'mock' | 'codex'
  workspaceMode: 'auto' | 'pinned'
  preferredWorkspaceId: Id | null

  context: Context | null
  proposal: CommandProposal | null
  lastRun: { runId: Id; pendingReviewId: Id | null } | null

  setInput: (v: string) => void
  setPlanner: (p: 'mock' | 'codex') => void
  setWorkspaceMode: (m: 'auto' | 'pinned') => void
  setPreferredWorkspaceId: (id: Id | null) => void

  loadContext: (token: string) => Promise<void>
  generatePlan: (token: string) => Promise<void>
  confirmAndRun: (token: string) => Promise<void>
}

export const useCommandCenterStore = create<State>((set, get) => ({
  status: 'idle',
  planStatus: 'idle',
  runStatus: 'idle',
  error: null,

  input: '',
  planner: 'mock',
  workspaceMode: 'auto',
  preferredWorkspaceId: null,

  context: null,
  proposal: null,
  lastRun: null,

  setInput: (v) => set({ input: v }),
  setPlanner: (p) => set({ planner: p }),
  setWorkspaceMode: (m) => set({ workspaceMode: m }),
  setPreferredWorkspaceId: (id) => set({ preferredWorkspaceId: id }),

  loadContext: async (token) => {
    set({ status: 'loading', error: null })
    const wsRes = await appService.repos.workspaces.list(token)
    if (wsRes.ok === false) {
      set({ status: 'error', error: wsRes.error })
      return
    }

    const byWorkspaceId: Record<Id, WorkspaceContext> = {}
    const perWs = await Promise.all(
      wsRes.data.map(async (ws) => {
        const [agentsRes, workflowsRes] = await Promise.all([
          appService.repos.agents.listInstances(token, ws.id),
          appService.repos.workflows.list(token, ws.id),
        ])
        if (agentsRes.ok === false) return { ok: false as const, error: agentsRes.error }
        if (workflowsRes.ok === false) return { ok: false as const, error: workflowsRes.error }
        return {
          ok: true as const,
          data: {
            id: ws.id,
            name: ws.name,
            agents: agentsRes.data,
            workflows: workflowsRes.data,
          },
        }
      }),
    )

    const firstErr = perWs.find((x) => x.ok === false)
    if (firstErr && firstErr.ok === false) {
      set({ status: 'error', error: firstErr.error })
      return
    }

    perWs
      .filter((x) => x.ok === true)
      .forEach((x) => {
        byWorkspaceId[x.data.id] = x.data
      })

    set({
      status: 'ready',
      error: null,
      context: {
        workspaces: wsRes.data.map((w) => ({ id: w.id, name: w.name })),
        byWorkspaceId,
      },
    })
  },

  generatePlan: async (token) => {
    const ctx = get().context
    const input = get().input
    if (!ctx) {
      await get().loadContext(token)
    }
    const ctx2 = get().context
    if (!ctx2) {
      set({ planStatus: 'error', error: 'context_not_ready' })
      return
    }

    set({ planStatus: 'loading', error: null })
    const preferred = get().workspaceMode === 'pinned' ? get().preferredWorkspaceId : null

    if (get().planner === 'codex') {
      const payload = {
        input,
        locale: typeof navigator !== 'undefined' ? navigator.language : 'zh-CN',
        preferredWorkspaceId: preferred,
        context: {
          workspaces: ctx2.workspaces,
          byWorkspaceId: Object.fromEntries(
            Object.entries(ctx2.byWorkspaceId).map(([id, v]) => [
              id,
              {
                id: v.id,
                name: v.name,
                agents: v.agents.map((a) => ({ id: a.id, name: a.name, summary: a.summary, enabled: a.enabled })),
                workflows: v.workflows.map((wf) => ({ id: wf.id, name: wf.name, hasReview: wf.nodes.some((n) => n.type === 'review') })),
              },
            ]),
          ),
        },
      }

      const res = await codexPlan(token, payload)
      if (res.ok === false) {
        set({ planStatus: 'error', error: res.error })
        return
      }
      set({ planStatus: 'ready', proposal: res.data, runStatus: 'idle', lastRun: null })
      return
    }

    const proposal = mockOrchestrate({
      input,
      workspaces: ctx2.workspaces,
      byWorkspaceId: ctx2.byWorkspaceId,
      preferredWorkspaceId: preferred,
    })
    if (!proposal) {
      set({ planStatus: 'error', error: 'cannot_route' })
      return
    }
    set({ planStatus: 'ready', proposal, runStatus: 'idle', lastRun: null })
  },

  confirmAndRun: async (token) => {
    const proposal = get().proposal
    if (!proposal) return
    set({ runStatus: 'running', error: null })

    const wsId = proposal.workspace.id
    let workflowId: Id

    if (proposal.route.type === 'workflow') {
      workflowId = proposal.route.workflowId
    } else {
      const wfRes = await appService.repos.workflows.create(token, {
        workspaceId: wsId,
        name: proposal.title,
        description: proposal.summary,
        nodes: proposal.route.workflowNodes,
      })
      if (wfRes.ok === false) {
        set({ runStatus: 'error', error: wfRes.error })
        return
      }
      workflowId = wfRes.data.id
    }

    const runRes = await appService.repos.execution.startRun(token, {
      workspaceId: wsId,
      workflowId,
      title: proposal.title,
      description: proposal.summary,
      input: proposal.taskInput,
    })
    if (runRes.ok === false) {
      set({ runStatus: 'error', error: runRes.error })
      return
    }

    set({
      runStatus: runRes.data.status === 'waiting_review' ? 'waiting_review' : 'done',
      lastRun: { runId: runRes.data.runId, pendingReviewId: runRes.data.pendingReviewId },
    })
  },
}))
