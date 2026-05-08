import type { AgentInstance, AgentTemplate, Id, ReviewItem, Skill, Workflow, WorkflowRun } from '@/types/domain'
import type { Repositories } from '@/repositories/interfaces'
import type { Result } from '@/repositories/result'

export function createAppService(repos: Repositories) {
  return {
    repos,
    async loadWorkspaceCatalog(
      token: string,
      workspaceId: Id,
    ): Promise<
      Result<{
        templates: { system: AgentTemplate[]; custom: AgentTemplate[] }
        agentInstances: AgentInstance[]
        skills: { global: Skill[]; workspace: Skill[]; agent: Skill[] }
        workflows: Workflow[]
        runs: WorkflowRun[]
        reviews: ReviewItem[]
      }>
    > {
      const [tpl, inst, skl, wfs, runs, revs] = await Promise.all([
        repos.agents.listTemplates(token),
        repos.agents.listInstances(token, workspaceId),
        repos.skills.list(token, workspaceId),
        repos.workflows.list(token, workspaceId),
        repos.execution.listRuns(token, workspaceId),
        repos.reviews.list(token, workspaceId),
      ])

      const firstErr = [tpl, inst, skl, wfs, runs, revs].find((r) => r.ok === false)
      if (firstErr && firstErr.ok === false) return { ok: false, error: firstErr.error }

      return {
        ok: true,
        data: {
          templates: tpl.ok === true ? tpl.data : { system: [], custom: [] },
          agentInstances: inst.ok === true ? inst.data : [],
          skills: skl.ok === true ? skl.data : { global: [], workspace: [], agent: [] },
          workflows: wfs.ok === true ? wfs.data : [],
          runs: runs.ok === true ? runs.data : [],
          reviews: revs.ok === true ? revs.data : [],
        },
      }
    },
  }
}
