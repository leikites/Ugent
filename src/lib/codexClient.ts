import type { CommandProposal } from '@/lib/orchestrator'
import { postJson } from '@/utils/api'

export async function codexPlan(
  token: string,
  input: {
    input: string
    locale: string
    preferredWorkspaceId: string | null
    context: {
      workspaces: Array<{ id: string; name: string }>
      byWorkspaceId: Record<
        string,
        {
          id: string
          name: string
          agents: Array<{ id: string; name: string; summary: string; enabled: boolean }>
          workflows: Array<{ id: string; name: string; hasReview: boolean }>
        }
      >
    }
  },
): Promise<{ ok: true; data: CommandProposal } | { ok: false; error: string }>
{
  try {
    const res = await postJson<{ ok: true; data: CommandProposal } | { ok: false; error: string }>(
      '/api/codex/plan',
      input,
      token,
    )
    return res
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, error: msg }
  }
}

