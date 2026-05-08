import { describe, expect, it, vi } from 'vitest'
import { dataClient } from '@/data/client'
import { getMockDb, resetMockDb, setMockDb } from '@/mocks/mockDb'

function bootstrapToken() {
  const db = resetMockDb()
  const userId = Object.keys(db.users)[0]
  const token = 't_test'
  setMockDb((cur) => ({
    ...cur,
    sessions: {
      ...cur.sessions,
      [token]: { token, userId, createdAt: new Date().toISOString() },
    },
  }))
  return { token, userId }
}

describe('dataClient mock mutations', () => {
  it('creates workspace', async () => {
    vi.useFakeTimers()
    const { token } = bootstrapToken()

    const p = dataClient.workspaces.create(token, { name: 'New Workspace', description: 'For tests' })
    await vi.runAllTimersAsync()
    const res = await p

    expect(res.ok).toBe(true)
    if (res.ok === true) {
      expect(res.data.name).toBe('New Workspace')
      expect(res.data.description).toBe('For tests')
    }

    const p2 = dataClient.workspaces.list(token)
    await vi.runAllTimersAsync()
    const list = await p2
    expect(list.ok).toBe(true)
    if (list.ok === true && res.ok === true) {
      expect(list.data.some((w) => w.id === res.data.id)).toBe(true)
    }

    vi.useRealTimers()
  })

  it('creates custom template and instance, then links workflow participation', async () => {
    vi.useFakeTimers()
    const { token } = bootstrapToken()
    const db = getMockDb()
    const workspaceId = Object.keys(db.workspaces)[0]

    const tpl = dataClient.agents.createTemplate(token, {
      name: 'QA Agent',
      summary: 'Checks output quality.',
      responsibilities: 'Quality gate and risk review.',
      defaultPrompt: 'Use a checklist to evaluate outputs.',
      defaultEnabled: true,
      recommendedSkillIds: [],
    })
    await vi.runAllTimersAsync()
    const tplRes = await tpl
    expect(tplRes.ok).toBe(true)

    const listTpl = dataClient.agents.listTemplates(token)
    await vi.runAllTimersAsync()
    const listTplRes = await listTpl
    expect(listTplRes.ok).toBe(true)
    if (tplRes.ok === true && listTplRes.ok === true) {
      expect(listTplRes.data.custom.some((t) => t.id === tplRes.data.id)).toBe(true)
    }

    const inst = dataClient.agents.createInstance(token, {
      workspaceId,
      templateId: tplRes.ok === true ? tplRes.data.id : null,
      name: 'QA Instance',
      summary: 'Workspace QA instance.',
      status: 'active',
    })
    await vi.runAllTimersAsync()
    const instRes = await inst
    expect(instRes.ok).toBe(true)
    if (instRes.ok === true) {
      expect(instRes.data.enabled).toBe(true)
    }

    if (instRes.ok === true) {
      const wf = dataClient.workflows.create(token, {
        workspaceId,
        name: 'Demo Flow',
        description: 'Start → Agent → End',
        nodes: [
          {
            id: 'n_start',
            tenantId: 't',
            workflowId: 'w',
            type: 'start',
            title: 'Start',
            description: '',
            agentId: null,
            status: 'pending',
            config: { type: 'start', inputHint: '' },
          },
          {
            id: 'n_agent',
            tenantId: 't',
            workflowId: 'w',
            type: 'agent',
            title: 'Agent',
            description: '',
            agentId: instRes.data.id,
            status: 'pending',
            config: { type: 'agent', agentId: instRes.data.id, inputHint: '', outputHint: '' },
          },
          {
            id: 'n_end',
            tenantId: 't',
            workflowId: 'w',
            type: 'end',
            title: 'End',
            description: '',
            agentId: null,
            status: 'pending',
            config: { type: 'end', resultHint: '' },
          },
        ],
      })
      await vi.runAllTimersAsync()
      const wfRes = await wf
      expect(wfRes.ok).toBe(true)

      const instList = dataClient.agents.listInstances(token, workspaceId)
      await vi.runAllTimersAsync()
      const instListRes = await instList
      expect(instListRes.ok).toBe(true)
      if (instListRes.ok === true && wfRes.ok === true) {
        const found = instListRes.data.find((a) => a.id === instRes.data.id)
        expect(found?.workflowIds.includes(wfRes.data.id)).toBe(true)
      }
    }

    vi.useRealTimers()
  })

  it('creates, updates, archives skill and maintains agent bindings', async () => {
    vi.useFakeTimers()
    const { token } = bootstrapToken()
    const db = getMockDb()
    const workspaceId = Object.keys(db.workspaces)[0]
    const agentId = Object.values(db.workspaceAgents).find((a) => a.workspaceId === workspaceId)?.id
    expect(agentId).toBeTruthy()
    if (!agentId) return

    const createdP = dataClient.skills.create(token, {
      scope: 'workspace',
      workspaceId,
      name: 'Test Skill',
      kind: 'checklist',
      description: 'For tests',
      version: '0.1.0',
      enabled: true,
      contentText: 'Checklist content',
      source: { type: 'user', ref: 'unit-test' },
    })
    await vi.runAllTimersAsync()
    const created = await createdP
    expect(created.ok).toBe(true)
    if (created.ok === false) return

    const updatedP = dataClient.skills.update(token, created.data.id, { description: 'Updated', enabled: false })
    await vi.runAllTimersAsync()
    const updated = await updatedP
    expect(updated.ok).toBe(true)
    if (updated.ok === true) {
      expect(updated.data.description).toBe('Updated')
      expect(updated.data.enabled).toBe(false)
    }

    const bindP = dataClient.agents.setSkillBindings(token, agentId, [created.data.id])
    await vi.runAllTimersAsync()
    const bound = await bindP
    expect(bound.ok).toBe(true)
    if (bound.ok === true) {
      expect(bound.data.skillBindings.some((b) => b.skillId === created.data.id)).toBe(true)
    }

    const removeP = dataClient.skills.remove(token, created.data.id)
    await vi.runAllTimersAsync()
    const removed = await removeP
    expect(removed.ok).toBe(true)

    const instP = dataClient.agents.getInstance(token, agentId)
    await vi.runAllTimersAsync()
    const inst = await instP
    expect(inst.ok).toBe(true)
    if (inst.ok === true) {
      expect(inst.data.skillBindings.some((b) => b.skillId === created.data.id)).toBe(false)
    }

    vi.useRealTimers()
  })

  it('review approve advances run and completes end node', async () => {
    vi.useFakeTimers()
    const { token } = bootstrapToken()
    const db = getMockDb()

    const pending = Object.values(db.reviews).find((r) => r.status === 'pending')
    expect(pending).toBeTruthy()
    if (!pending) return

    const actP = dataClient.reviews.act(token, pending.id, { decision: 'approve', comment: 'LGTM' })
    await vi.runAllTimersAsync()
    const acted = await actP
    expect(acted.ok).toBe(true)

    const db2 = getMockDb()
    const run = db2.runs[pending.runId]
    expect(run.status).toBe('succeeded')
    const nodeRuns = Object.values(db2.nodeRuns).filter((nr) => nr.runId === pending.runId)
    expect(nodeRuns.some((nr) => nr.nodeId === pending.nodeId && nr.status === 'approved')).toBe(true)
    expect(nodeRuns.some((nr) => nr.status === 'completed')).toBe(true)

    vi.useRealTimers()
  })

  it('review reject back_to creates a new running node run', async () => {
    vi.useFakeTimers()
    const { token } = bootstrapToken()
    const db = getMockDb()

    const pending = Object.values(db.reviews).find((r) => r.status === 'pending')
    expect(pending).toBeTruthy()
    if (!pending) return

    const actP = dataClient.reviews.act(token, pending.id, { decision: 'reject', comment: 'Please revise.' })
    await vi.runAllTimersAsync()
    const acted = await actP
    expect(acted.ok).toBe(true)

    const db2 = getMockDb()
    const run = db2.runs[pending.runId]
    expect(run.status).toBe('running')

    const nodeRuns = Object.values(db2.nodeRuns).filter((nr) => nr.runId === pending.runId)
    expect(nodeRuns.some((nr) => nr.nodeId !== pending.nodeId && nr.status === 'running')).toBe(true)

    vi.useRealTimers()
  })

  it('execution startRun creates run and pending review when workflow has review node', async () => {
    vi.useFakeTimers()
    const { token } = bootstrapToken()
    const db = getMockDb()

    const wf = Object.values(db.workflows).find((w) => w.nodes.some((n) => n.type === 'review'))
    expect(wf).toBeTruthy()
    if (!wf) return

    const p = dataClient.execution.startRun(token, {
      workspaceId: wf.workspaceId,
      workflowId: wf.id,
      title: 'Command task',
      description: 'From command center',
      input: { goal: 'test', risk_level: 'low' },
    })
    await vi.runAllTimersAsync()
    const res = await p
    expect(res.ok).toBe(true)
    if (res.ok === false) return

    expect(res.data.runId).toMatch(/^run_/)
    expect(res.data.pendingReviewId).toBeTruthy()

    const detailP = dataClient.execution.getRunDetail(token, res.data.runId)
    await vi.runAllTimersAsync()
    const detail = await detailP
    expect(detail.ok).toBe(true)
    if (detail.ok === false) return

    expect(detail.data.reviews.some((r) => r.status === 'pending')).toBe(true)

    vi.useRealTimers()
  })
})
