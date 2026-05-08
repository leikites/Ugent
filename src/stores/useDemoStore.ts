import { create } from 'zustand'

export type ProjectRole = 'owner' | 'member' | 'viewer'

export type Project = {
  id: string
  name: string
  role: ProjectRole
  updatedAt: string
}

type DemoState = {
  projects: Project[]
  createProject: (name: string) => void
}

function nowIso() {
  return new Date().toISOString()
}

export const useDemoStore = create<DemoState>((set) => ({
  projects: [
    {
      id: 'p_demo_1',
      name: 'Agent Workspace Demo',
      role: 'owner',
      updatedAt: nowIso(),
    },
    {
      id: 'p_demo_2',
      name: 'Skill Import Playground',
      role: 'member',
      updatedAt: nowIso(),
    },
  ],
  createProject: (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    set((s) => ({
      projects: [
        {
          id: `p_${Math.random().toString(16).slice(2, 10)}`,
          name: trimmed,
          role: 'owner',
          updatedAt: nowIso(),
        },
        ...s.projects,
      ],
    }))
  },
}))

