import { create } from 'zustand'
import { appService } from '@/services'
import type { Workspace } from '@/types/domain'

export type WorkspaceWithMetrics = Workspace & {
  metrics: {
    agents: number
    workflows: number
    pendingReviews: number
    recentRuns: number
  }
}

type WorkspaceState = {
  status: 'idle' | 'loading' | 'ready' | 'error'
  workspaces: WorkspaceWithMetrics[]
  selectedWorkspaceId: string | null
  error: string | null
  loadDashboard: (token: string) => Promise<void>
  selectWorkspace: (workspaceId: string) => void
  renameWorkspace: (token: string, workspaceId: string, name: string) => Promise<boolean>
  createWorkspace: (token: string, input: { name: string; description: string }) => Promise<boolean>
  updateWorkspace: (
    token: string,
    workspaceId: string,
    patch: { name?: string; description?: string; archived?: boolean },
  ) => Promise<boolean>
  deleteWorkspace: (token: string, workspaceId: string) => Promise<boolean>
}

const STORAGE_KEY = 'selected_workspace_id'

function readSelectedWorkspaceId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function storeSelectedWorkspaceId(id: string | null) {
  try {
    if (!id) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, id)
  } catch {
    void 0
  }
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  status: 'idle',
  workspaces: [],
  selectedWorkspaceId: readSelectedWorkspaceId(),
  error: null,
  loadDashboard: async (token: string) => {
    set({ status: 'loading', error: null })
    const res = await appService.repos.workspaces.getDashboard(token)
    if (res.ok === false) {
      set({ status: 'error', error: res.error })
      return
    }

    const stored = get().selectedWorkspaceId
    const resolvedSelected =
      (stored && res.data.some((w) => w.id === stored) ? stored : null) ?? res.data[0]?.id ?? null

    storeSelectedWorkspaceId(resolvedSelected)
    set({ status: 'ready', workspaces: res.data, selectedWorkspaceId: resolvedSelected, error: null })
  },
  selectWorkspace: (workspaceId) => {
    storeSelectedWorkspaceId(workspaceId)
    set({ selectedWorkspaceId: workspaceId })
  },
  renameWorkspace: async (token, workspaceId, name) => {
    set({ status: 'loading', error: null })
    const res = await appService.repos.workspaces.rename(token, workspaceId, name)
    if (res.ok === false) {
      set({ status: 'ready', error: res.error })
      return false
    }
    set({
      status: 'ready',
      workspaces: get().workspaces.map((w) => (w.id === workspaceId ? { ...w, ...res.data } : w)),
      error: null,
    })
    return true
  },
  createWorkspace: async (token, input) => {
    set({ status: 'loading', error: null })
    const res = await appService.repos.workspaces.create(token, input)
    if (res.ok === false) {
      set({ status: 'ready', error: res.error })
      return false
    }
    await get().loadDashboard(token)
    set({ selectedWorkspaceId: res.data.id })
    storeSelectedWorkspaceId(res.data.id)
    return true
  },
  updateWorkspace: async (token, workspaceId, patch) => {
    set({ status: 'loading', error: null })
    const res = await appService.repos.workspaces.update(token, workspaceId, patch)
    if (res.ok === false) {
      set({ status: 'ready', error: res.error })
      return false
    }
    await get().loadDashboard(token)
    return true
  },
  deleteWorkspace: async (token, workspaceId) => {
    set({ status: 'loading', error: null })
    const res = await appService.repos.workspaces.remove(token, workspaceId)
    if (res.ok === false) {
      set({ status: 'ready', error: res.error })
      return false
    }
    await get().loadDashboard(token)
    return true
  },
}))
