import { create } from 'zustand'
import type { Id, ReviewItem, Workflow, WorkflowNodeRunStatus, WorkflowRun } from '@/types/domain'
import { appService } from '@/services'

export type ExecutionRunRow = {
  runId: Id
  workspaceId: Id
  workspaceName: string
  workflowId: Id
  workflowName: string
  status: WorkflowRun['status']
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  triggeredBy: string
  currentNodeTitle: string | null
  currentNodeStatus: WorkflowNodeRunStatus | null
  pendingReviewId: Id | null
}

type State = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error: string | null
  workspaceFilterId: Id | 'all'
  workspaces: Array<{ id: Id; name: string }>
  rows: ExecutionRunRow[]
  load: (token: string) => Promise<void>
  setWorkspaceFilter: (id: Id | 'all') => void
}

function pickCurrentNode(nodeRuns: Array<{ nodeId: Id; status: WorkflowNodeRunStatus; startedAt: string | null; finishedAt: string | null }>) {
  const preferred = nodeRuns.find((n) => n.status === 'waiting_review') ?? nodeRuns.find((n) => n.status === 'running')
  if (preferred) return preferred

  const sorted = nodeRuns
    .slice()
    .sort((a, b) => {
      const ta = a.finishedAt ?? a.startedAt ?? ''
      const tb = b.finishedAt ?? b.startedAt ?? ''
      return tb.localeCompare(ta)
    })
  return sorted[0] ?? null
}

function resolvePendingReviewId(reviews: ReviewItem[], runId: Id): Id | null {
  const r = reviews.find((x) => x.runId === runId && x.status === 'pending')
  return r ? r.id : null
}

export const useExecutionCenterStore = create<State>((set, get) => ({
  status: 'idle',
  error: null,
  workspaceFilterId: 'all',
  workspaces: [],
  rows: [],
  setWorkspaceFilter: (id) => set({ workspaceFilterId: id }),
  load: async (token) => {
    set({ status: 'loading', error: null })

    const wsRes = await appService.repos.workspaces.list(token)
    if (wsRes.ok === false) {
      set({ status: 'error', error: wsRes.error })
      return
    }

    const workspaces = wsRes.data.map((w) => ({ id: w.id, name: w.name }))

    const perWs = await Promise.all(
      wsRes.data.map(async (ws) => {
        const [wfRes, runRes, revRes] = await Promise.all([
          appService.repos.workflows.list(token, ws.id),
          appService.repos.execution.listRuns(token, ws.id),
          appService.repos.reviews.list(token, ws.id),
        ])

        if (wfRes.ok === false) return { ok: false as const, error: wfRes.error }
        if (runRes.ok === false) return { ok: false as const, error: runRes.error }
        if (revRes.ok === false) return { ok: false as const, error: revRes.error }

        return {
          ok: true as const,
          data: {
            workspaceId: ws.id,
            workspaceName: ws.name,
            workflows: wfRes.data,
            runs: runRes.data,
            reviews: revRes.data,
          },
        }
      }),
    )

    const firstErr = perWs.find((x) => x.ok === false)
    if (firstErr && firstErr.ok === false) {
      set({ status: 'error', error: firstErr.error })
      return
    }

    const okRows = perWs.filter((x) => x.ok === true).map((x) => x.data)

    const rows: ExecutionRunRow[] = []
    const detailLookups = await Promise.all(
      okRows.flatMap((g) =>
        g.runs.map(async (run) => {
          const wfName = g.workflows.find((w) => w.id === run.workflowId)?.name ?? run.workflowId
          const pendingReviewId = resolvePendingReviewId(g.reviews, run.id)

          const detail = await appService.repos.execution.getRunDetail(token, run.id)
          if (detail.ok === false) {
            return {
              run,
              row: {
                runId: run.id,
                workspaceId: g.workspaceId,
                workspaceName: g.workspaceName,
                workflowId: run.workflowId,
                workflowName: wfName,
                status: run.status,
                createdAt: run.createdAt,
                startedAt: run.startedAt,
                finishedAt: run.finishedAt,
                triggeredBy: run.triggeredBy,
                currentNodeTitle: null,
                currentNodeStatus: null,
                pendingReviewId,
              },
            }
          }

          const workflow: Workflow = detail.data.workflow
          const nodeRuns = detail.data.nodeRuns.map((n) => ({
            nodeId: n.nodeId,
            status: n.status as WorkflowNodeRunStatus,
            startedAt: n.startedAt,
            finishedAt: n.finishedAt,
          }))

          const current = pickCurrentNode(nodeRuns)
          const currentNodeTitle = current ? workflow.nodes.find((n) => n.id === current.nodeId)?.title ?? null : null

          return {
            run,
            row: {
              runId: run.id,
              workspaceId: g.workspaceId,
              workspaceName: g.workspaceName,
              workflowId: run.workflowId,
              workflowName: workflow.name,
              status: run.status,
              createdAt: run.createdAt,
              startedAt: run.startedAt,
              finishedAt: run.finishedAt,
              triggeredBy: run.triggeredBy,
              currentNodeTitle,
              currentNodeStatus: current ? current.status : null,
              pendingReviewId,
            },
          }
        }),
      ),
    )

    detailLookups.forEach((x) => rows.push(x.row))
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const currentFilter = get().workspaceFilterId
    const nextFilter =
      currentFilter === 'all'
        ? 'all'
        : workspaces.some((w) => w.id === currentFilter)
          ? currentFilter
          : 'all'

    set({ status: 'ready', error: null, workspaces, rows, workspaceFilterId: nextFilter })
  },
}))

