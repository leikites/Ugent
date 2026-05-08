import express, { type Request, type Response } from 'express'

type PlanRequestBody = {
  input?: string
  locale?: string
  preferredWorkspaceId?: string | null
  context?: {
    workspaces?: Array<{ id: string; name: string }>
    byWorkspaceId?: Record<
      string,
      {
        id: string
        name: string
        agents?: Array<{ id: string; name: string; summary?: string; enabled?: boolean }>
        workflows?: Array<{ id: string; name: string; hasReview?: boolean }>
      }
    >
  }
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return Boolean(x) && typeof x === 'object' && !Array.isArray(x)
}

function buildPrompt(body: PlanRequestBody) {
  const input = String(body.input ?? '').trim()
  const locale = String(body.locale ?? 'zh-CN')
  const ctx = body.context ?? {}
  const preferredWorkspaceId = body.preferredWorkspaceId ?? null

  const compact = {
    input,
    locale,
    preferredWorkspaceId,
    workspaces: ctx.workspaces ?? [],
    byWorkspaceId: ctx.byWorkspaceId ?? {},
    constraints: {
      mustReturnJsonOnly: true,
      allowedRouteTypes: ['workflow', 'agent'],
      stepsKinds: ['route', 'plan', 'agent', 'workflow', 'review', 'execute', 'summarize'],
    },
  }

  const system =
    'You are an orchestrator for a multi-agent workflow system. Return a single JSON object ONLY (no markdown). ' +
    'It must match the CommandProposal shape: title, summary, workspace{id,name}, mayRequireReview, taskInput, route, steps[].'

  const user =
    'Given the user input and available context, choose the best workspace and either an existing workflow or a single agent. ' +
    'If selecting a workflow, route = {type:"workflow", workflowId, workflowName}. ' +
    'If selecting an agent, route = {type:"agent", agentId, agentName, workflowNodes:[start,agent,end]}. ' +
    'Steps should be 4-6 items. Use the same language as locale for human-facing fields.\n\n' +
    JSON.stringify(compact)

  return { system, user }
}

async function callOpenAI(input: { system: string; user: string }) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { ok: false as const, error: 'openai_not_configured' as const }
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'

  const controller = new AbortController()
  const timeoutMs = 25_000
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: input.system },
          { role: 'user', content: input.user },
        ],
      }),
      signal: controller.signal,
    })

    const raw = await res.text()
    const json = safeJsonParse(raw)
    if (!res.ok) {
      let msg = ''
      if (isRecord(json) && isRecord(json.error) && typeof json.error.message === 'string') {
        msg = json.error.message
      }
      return { ok: false as const, error: 'openai_request_failed' as const, detail: msg || raw.slice(0, 500) }
    }

    if (!isRecord(json)) return { ok: false as const, error: 'openai_invalid_response' as const }
    const choices = Array.isArray(json.choices) ? json.choices : []
    const content = choices?.[0]?.message?.content
    if (typeof content !== 'string' || !content.trim()) return { ok: false as const, error: 'openai_empty_response' as const }
    return { ok: true as const, text: content }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false as const, error: 'openai_network_error' as const, detail: msg }
  } finally {
    clearTimeout(timeoutId)
  }
}

function validateProposal(x: unknown) {
  if (!isRecord(x)) return null
  const title = typeof x.title === 'string' ? x.title : null
  const summary = typeof x.summary === 'string' ? x.summary : null
  const workspace = isRecord(x.workspace) ? x.workspace : null
  const wsId = workspace && typeof workspace.id === 'string' ? workspace.id : null
  const wsName = workspace && typeof workspace.name === 'string' ? workspace.name : null
  const mayRequireReview = typeof x.mayRequireReview === 'boolean' ? x.mayRequireReview : false
  const taskInput = isRecord(x.taskInput) ? x.taskInput : {}
  const route = isRecord(x.route) ? x.route : null
  const steps = Array.isArray(x.steps) ? x.steps : []

  if (!title || !summary || !workspace || !wsId || !wsName || !route) return null

  const routeType = route.type
  if (routeType !== 'workflow' && routeType !== 'agent') return null
  if (routeType === 'workflow') {
    if (typeof route.workflowId !== 'string' || typeof route.workflowName !== 'string') return null
  } else {
    if (typeof route.agentId !== 'string' || typeof route.agentName !== 'string') return null
    if (!Array.isArray(route.workflowNodes)) return null
  }

  const normalizedSteps = steps
    .map((s) => {
      if (!isRecord(s)) return null
      const kind = typeof s.kind === 'string' ? s.kind : null
      const st = typeof s.title === 'string' ? s.title : null
      const sd = typeof s.description === 'string' ? s.description : null
      if (!kind || !st || !sd) return null
      return { kind, title: st, description: sd }
    })
    .filter(Boolean)

  return {
    title,
    summary,
    workspace: { id: wsId, name: wsName },
    mayRequireReview,
    taskInput,
    route,
    steps: normalizedSteps,
  }
}

const router = express.Router()

router.post('/plan', async (req: Request, res: Response) => {
  const body = (req.body ?? {}) as PlanRequestBody
  const input = String(body.input ?? '').trim()
  if (!input) {
    res.status(400).json({ ok: false, error: 'invalid_input' })
    return
  }

  const prompt = buildPrompt(body)
  const llm = await callOpenAI(prompt)
  if (llm.ok === false) {
    res.status(400).json({ ok: false, error: llm.error, detail: 'detail' in llm ? llm.detail ?? null : null })
    return
  }

  const parsed = safeJsonParse(llm.text)
  const proposal = validateProposal(parsed)
  if (!proposal) {
    res.status(400).json({ ok: false, error: 'codex_invalid_json', raw: llm.text.slice(0, 2000) })
    return
  }

  res.json({ ok: true, data: proposal })
})

export default router
