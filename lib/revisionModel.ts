import { execFileSync } from 'node:child_process'
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
