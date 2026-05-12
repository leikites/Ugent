import { NextResponse } from 'next/server'
import { analyzeAskWithDeepSeek, getPmAssistantModelStatus } from '../../../../lib/revisionModel'
import type { AskAnalysisApiResponse, AskAnalysisRequest, AskAnalysisResult } from '../../../../lib/pmAssistantTypes'

export const runtime = 'nodejs'

function isAskPayload(value: unknown): value is AskAnalysisRequest {
  if (!value || typeof value !== 'object') return false
  const payload = value as Record<string, unknown>
  return typeof payload.prompt === 'string'
}

function normalizeCategory(value: unknown): AskAnalysisResult['category'] {
  if (value === 'comment_reply' || value === 'create_ticket' || value === 'create_epic') {
    return value
  }
  return 'comment_reply'
}

function normalizeExecutionMode(value: unknown): AskAnalysisResult['executionMode'] {
  if (value === 'needs_approval' || value === 'blocked' || value === 'draft_only') return value
  return 'draft_only'
}

function normalizeRisk(value: unknown): AskAnalysisResult['riskLevel'] {
  if (value === 'critical' || value === 'high' || value === 'medium' || value === 'low') return value
  return 'medium'
}

function mockAskFallback(payload: AskAnalysisRequest, reason: string): AskAnalysisResult {
  const prompt = payload.prompt.trim()
  const category = normalizeCategory(payload.quickAction)
  const executionMode = normalizeExecutionMode(category === 'comment_reply' ? 'draft_only' : 'needs_approval')
  const riskLevel = normalizeRisk(category === 'comment_reply' ? 'medium' : 'medium')

  const analysisNarrative = [
    '[Main Take]',
    `我看完了你的请求。表面上是在问“${prompt}”，本质上是要你快速拿到一版可 review 的 PM 判断和可用 draft。我的建议是先产出一个保守但可执行的 draft，并把需要 owner/范围确认的点写出来。`,
    '',
    '[Why]',
    '当前仍是 mock/Jira read-only 的上下文：我们可以做判断与起草，但不能做 Jira write，也不能假设缺失信息已经确认。',
    '',
    '[Recommended Move]',
    '1. 先明确要达成的结果（回复 comment / 创建 ticket draft / 创建 epic draft）。',
    '2. 把缺失信息列为待确认项（owner、scope、deadline、acceptance criteria）。',
    '3. 用“draft only / needs approval”的方式推进，不做任何 Jira 写入。',
    '',
    '[Draft Direction]',
    '这版 draft 应该走“先给结论 + 明确边界 + 点名需要确认的人/时间”的方向，保持直接但不过度承诺。',
    '',
    '[Small Risk / Assumption]',
    `小风险：当前未拿到完整 Jira thread/context，所以这个判断需要你对照原始信息再校正一次。Fallback reason: ${reason}`
  ].join('\n')

  return {
    category,
    origin: 'user_requested',
    executionMode,
    analysisNarrative,
    recommendedMove: '先产出可 review draft，并列出必须确认的 owner/scope/时间点；再决定是否进入 approval。',
    riskLevel,
    confidence: 'medium',
    suggestedOwner: undefined,
    draft:
      category === 'comment_reply'
        ? 'Draft reply: reply based on confirmed info only; ask owner to confirm open points.'
        : category === 'create_ticket'
          ? 'Ticket draft: include background/scope/user story/requirements/acceptance criteria; keep Jira write disabled.'
          : 'Epic draft: define epic goal/scope, sequencing, and first child tickets; keep Jira write disabled.',
    sourceEvidence: payload.context?.recentItems?.slice(0, 4).map((it) => `${it.id}${it.issueKey ? ` (${it.issueKey})` : ''}: ${it.title}`) ?? [],
    assumptions: ['Jira writes disabled', `Data source = ${payload.context?.dataSource ?? 'mock'}`, 'Missing context must be treated conservatively'],
    analysisSource: 'mock',
    dataSource: payload.context?.dataSource ?? 'mock'
  }
}

export async function POST(request: Request) {
  let payload: AskAnalysisRequest
  try {
    const json = await request.json()
    if (!isAskPayload(json)) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
    payload = json
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const modelStatus = getPmAssistantModelStatus()

  try {
    const result = await analyzeAskWithDeepSeek(payload)
    const response: AskAnalysisApiResponse = {
      result: { ...result, dataSource: payload.context?.dataSource ?? result.dataSource },
      fallbackUsed: false,
      modelStatus: { ...modelStatus, available: true }
    }
    return NextResponse.json(response)
  } catch (error) {
    const fallback = mockAskFallback(payload, error instanceof Error ? error.message : 'unknown_error')
    const response: AskAnalysisApiResponse = {
      result: fallback,
      fallbackUsed: true,
      modelStatus: {
        ...modelStatus,
        available: false,
        detail:
          error instanceof Error
            ? `${modelStatus.detail} Fallback active: ${error.message}`
            : `${modelStatus.detail} Fallback active due to unknown error.`
      }
    }
    return NextResponse.json(response)
  }
}
