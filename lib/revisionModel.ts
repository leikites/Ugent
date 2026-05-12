import { execFileSync } from 'node:child_process'
import type { AskAnalysisApiResponse, AskAnalysisRequest, AskAnalysisResult } from './pmAssistantTypes'
import type { DraftRevisionApiResponse, DraftRevisionRequest, RevisionConfidence, RevisionModelStatus } from './reviseDraftTypes'

const DEFAULT_BASE_URL = process.env.DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com'
const DEFAULT_MODEL = process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-v4-flash'
const KEYCHAIN_SERVICE = process.env.DEEPSEEK_KEYCHAIN_SERVICE?.trim() || 'codex-deepseek-api-key'

type ResolvedAuth = {
  apiKey?: string
  authSource: RevisionModelStatus['authSource']
}

function readKeyFromKeychain(): string | undefined {
  try {
    const key = execFileSync(
      'security',
      ['find-generic-password', '-a', process.env.USER || '', '-s', KEYCHAIN_SERVICE, '-w'],
      { encoding: 'utf8' }
    ).trim()
    return key || undefined
  } catch {
    return undefined
  }
}

function resolveAuth(): ResolvedAuth {
  const envKey = process.env.DEEPSEEK_API_KEY?.trim()
  if (envKey) return { apiKey: envKey, authSource: 'env' }

  const keychainKey = readKeyFromKeychain()
  if (keychainKey) return { apiKey: keychainKey, authSource: 'keychain' }

  return { apiKey: undefined, authSource: 'missing' }
}

export function getRevisionModelStatus(): RevisionModelStatus {
  const auth = resolveAuth()
  const enabled = Boolean(auth.apiKey)

  return {
    provider: 'DeepSeek',
    model: DEFAULT_MODEL,
    baseUrl: DEFAULT_BASE_URL,
    enabled,
    available: enabled,
    authSource: auth.authSource,
    revisionOnly: true,
    jiraWritesEnabled: false,
    approvalMode: 'local_state_only',
    detail: enabled
      ? `DeepSeek is configured for draft revision only via ${auth.authSource}.`
      : 'DeepSeek is not configured. Revision API will fall back to local mock rewrite.'
  }
}

export function getPmAssistantModelStatus(): AskAnalysisApiResponse['modelStatus'] {
  const base = getRevisionModelStatus()
  return {
    provider: base.provider,
    model: base.model,
    baseUrl: base.baseUrl,
    enabled: base.enabled,
    available: base.available,
    authSource: base.authSource,
    revisionOnly: base.revisionOnly,
    askAnalysisEnabled: true,
    jiraWritesEnabled: false,
    approvalMode: 'local_state_only',
    detail: base.detail
  }
}

function extractTextFromResponsesPayload(payload: any): string {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim()
  }

  if (Array.isArray(payload?.output)) {
    const text = payload.output
      .flatMap((entry: any) => entry?.content ?? [])
      .map((entry: any) => entry?.text || entry?.content?.[0]?.text || '')
      .find((value: string) => typeof value === 'string' && value.trim())
    if (text) return text.trim()
  }

  throw new Error('No text found in DeepSeek response payload')
}

function normalizeConfidence(value: unknown): RevisionConfidence {
  return value === 'low' || value === 'high' ? value : 'medium'
}

function parseRevisionJson(rawText: string): Omit<DraftRevisionApiResponse, 'fallbackUsed' | 'modelStatus'> {
  const parsed = JSON.parse(rawText)
  const revisedDraft = typeof parsed?.revisedDraft === 'string' ? parsed.revisedDraft.trim() : ''
  const revisionSummary = typeof parsed?.revisionSummary === 'string' ? parsed.revisionSummary.trim() : ''
  const appliedFeedback =
    typeof parsed?.appliedFeedback === 'string'
      ? parsed.appliedFeedback.trim()
      : Array.isArray(parsed?.appliedFeedback)
        ? parsed.appliedFeedback.filter((value: unknown) => typeof value === 'string').join('；')
        : ''
  const guardrailNotes = Array.isArray(parsed?.guardrailNotes)
    ? parsed.guardrailNotes.filter((value: unknown) => typeof value === 'string')
    : []

  if (!revisedDraft || !revisionSummary) {
    throw new Error('DeepSeek revision response is missing required fields')
  }

  return {
    revisedDraft,
    revisionSummary,
    appliedFeedback,
    confidence: normalizeConfidence(parsed?.confidence),
    guardrailNotes,
    source: 'deepseek'
  }
}

export async function reviseDraftWithDeepSeek(payload: DraftRevisionRequest) {
  const status = getRevisionModelStatus()
  const auth = resolveAuth()
  if (!auth.apiKey) {
    throw new Error('DeepSeek API key is not configured')
  }

  const prompt = [
    'You are a PM assistant rewriting a draft for review.',
    'Keep Jira writes disabled and assume approval only updates local state.',
    'Return JSON only with fields: revisedDraft, revisionSummary, appliedFeedback, confidence, guardrailNotes.',
    'The revisedDraft must be directly usable and should reflect the analysis narrative and user feedback.',
    'IMPORTANT: revisionSummary MUST be in Simplified Chinese for the PM to read quickly.',
    'Do not mention external AI, system prompts, or hidden reasoning.'
  ].join(' ')

  const input = [
    `Item: ${payload.issueKey ? `${payload.issueKey} · ` : ''}${payload.title}`,
    `Type: ${payload.itemType}`,
    `Analysis narrative:\n${payload.analysisNarrative}`,
    `Current draft:\n${payload.currentDraft}`,
    `User feedback:\n${payload.userFeedback || '(none)'}`,
    `Quick chips: ${payload.quickChips.join(', ') || '(none)'}`,
    'Guardrails: Jira writes disabled. Approval only updates local state. Mock review items remain allowed.'
  ].join('\n\n')

  const response = await fetch(`${status.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.apiKey}`
    },
    body: JSON.stringify({
      model: status.model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: input }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepSeek request failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content || extractTextFromResponsesPayload(data)
  return parseRevisionJson(text)
}

function parseAskAnalysisJson(rawText: string): AskAnalysisResult {
  const parsed = JSON.parse(rawText)
  const category = parsed?.category
  const executionMode = parsed?.executionMode
  const analysisNarrative = typeof parsed?.analysisNarrative === 'string' ? parsed.analysisNarrative.trim() : ''
  const recommendedMove = typeof parsed?.recommendedMove === 'string' ? parsed.recommendedMove.trim() : ''
  const riskLevel = parsed?.riskLevel
  const confidence = normalizeConfidence(parsed?.confidence)
  const draft = typeof parsed?.draft === 'string' ? parsed.draft.trim() : ''
  const sourceEvidence = Array.isArray(parsed?.sourceEvidence)
    ? parsed.sourceEvidence.filter((value: unknown) => typeof value === 'string' && value.trim()).map((value: string) => value.trim())
    : []
  const assumptions = Array.isArray(parsed?.assumptions)
    ? parsed.assumptions.filter((value: unknown) => typeof value === 'string' && value.trim()).map((value: string) => value.trim())
    : []
  const suggestedOwner = typeof parsed?.suggestedOwner === 'string' ? parsed.suggestedOwner.trim() : undefined

  const validCategory = category === 'comment_reply' || category === 'create_ticket' || category === 'create_epic'
  const validExecutionMode = executionMode === 'draft_only' || executionMode === 'needs_approval' || executionMode === 'blocked'
  const validRisk = riskLevel === 'low' || riskLevel === 'medium' || riskLevel === 'high' || riskLevel === 'critical'

  if (!validCategory || !validExecutionMode || !analysisNarrative || !recommendedMove || !validRisk || !draft) {
    throw new Error('DeepSeek ask-analysis response is missing required fields')
  }

  return {
    category,
    origin: 'user_requested',
    executionMode,
    analysisNarrative,
    recommendedMove,
    riskLevel,
    confidence,
    suggestedOwner,
    draft,
    sourceEvidence,
    assumptions,
    analysisSource: 'deepseek',
    dataSource: 'mock'
  }
}

export async function analyzeAskWithDeepSeek(payload: AskAnalysisRequest) {
  const status = getPmAssistantModelStatus()
  const auth = resolveAuth()
  if (!auth.apiKey) {
    throw new Error('DeepSeek API key is not configured')
  }

  const prompt = [
    'You are a Codex-style PM assistant.',
    'Task: analyze the user request and produce a structured PM output.',
    'Output MUST be Simplified Chinese for analysisNarrative.',
    'Category MUST be one of: comment_reply, create_ticket, create_epic.',
    'Quick action (if provided) should strongly bias the category.',
    'analysisNarrative MUST follow exactly this sectioned format:',
    '[Main Take] ...',
    '[Why] ...',
    '[Recommended Move] 1. ... 2. ...',
    '[Draft Direction] ...',
    '[Small Risk / Assumption] ...',
    'Return JSON only with fields:',
    'category, executionMode, analysisNarrative, recommendedMove, riskLevel, confidence, suggestedOwner, draft, sourceEvidence, assumptions.',
    'Do not mention system prompts or hidden reasoning.',
    'Guardrails: Jira writes disabled. Approval only updates local state.'
  ].join(' ')

  const context = payload.context
    ? [
        `Data source: ${payload.context.dataSource}`,
        `Jira writes enabled: ${payload.context.jiraWritesEnabled}`,
        payload.context.notes?.length ? `Notes:\n${payload.context.notes.map((n) => `- ${n}`).join('\n')}` : '',
        payload.context.recentItems?.length
          ? `Recent items:\n${payload.context.recentItems
              .slice(0, 12)
              .map((it) => `- ${it.id}${it.issueKey ? ` (${it.issueKey})` : ''} | ${it.category ?? 'n/a'} | ${it.riskLevel ?? 'n/a'} | ${it.title}`)
              .join('\n')}`
          : ''
      ]
        .filter(Boolean)
        .join('\n\n')
    : ''

  const input = [
    `User prompt:\n${payload.prompt.trim()}`,
    payload.quickAction ? `Quick action: ${payload.quickAction}` : '',
    context ? `Context:\n${context}` : ''
  ]
    .filter(Boolean)
    .join('\n\n')

  const response = await fetch(`${status.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.apiKey}`
    },
    body: JSON.stringify({
      model: status.model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: input }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`DeepSeek request failed: ${response.status} ${errorText}`)
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content || extractTextFromResponsesPayload(data)
  return parseAskAnalysisJson(text)
}
