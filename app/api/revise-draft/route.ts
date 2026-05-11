import { NextResponse } from 'next/server'
import { buildMockRevisionResult, type ReviewItem } from '../../amigoMock'
import { getRevisionModelStatus, reviseDraftWithDeepSeek } from '../../../lib/revisionModel'
import type { DraftRevisionRequest } from '../../../lib/reviseDraftTypes'

export const runtime = 'nodejs'

type RevisionFallbackItem = Pick<
  ReviewItem,
  | 'id'
  | 'issueKey'
  | 'type'
  | 'riskLevel'
  | 'title'
  | 'analysisNarrative'
  | 'whyItMatters'
  | 'suggestedNextStep'
  | 'owner'
  | 'suggestedOwner'
  | 'dueDate'
  | 'releaseDate'
  | 'codeFreezeImpact'
  | 'confidence'
  | 'decisionNeededBy'
  | 'sourceLabel'
  | 'workflowStage'
>

function isRevisionPayload(value: unknown): value is DraftRevisionRequest {
  if (!value || typeof value !== 'object') return false
  const payload = value as Record<string, unknown>
  return (
    typeof payload.itemId === 'string' &&
    typeof payload.itemType === 'string' &&
    typeof payload.title === 'string' &&
    typeof payload.analysisNarrative === 'string' &&
    typeof payload.currentDraft === 'string' &&
    typeof payload.userFeedback === 'string' &&
    Array.isArray(payload.quickChips)
  )
}

function toFallbackItem(payload: DraftRevisionRequest): RevisionFallbackItem {
  return {
    id: payload.itemId,
    issueKey: payload.issueKey,
    type: payload.itemType as ReviewItem['type'],
    riskLevel: 'medium',
    title: payload.title,
    analysisNarrative: payload.analysisNarrative,
    whyItMatters: payload.analysisNarrative,
    suggestedNextStep: 'Revise the current draft based on PM feedback.',
    owner: 'Current owner',
    suggestedOwner: 'Suggested owner',
    dueDate: '',
    releaseDate: undefined,
    codeFreezeImpact: 'Guardrail: Jira writes disabled during V1 revision flow.',
    confidence: 'medium',
    decisionNeededBy: '',
    sourceLabel: 'Draft revision API request',
    workflowStage: payload.itemType === 'ticket_creation_draft' ? 'draft' : undefined
  }
}

export async function POST(request: Request) {
  let payload: DraftRevisionRequest

  try {
    const json = await request.json()
    if (!isRevisionPayload(json)) {
      return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
    }
    payload = json
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const modelStatus = getRevisionModelStatus()

  try {
    const revision = await reviseDraftWithDeepSeek(payload)
    return NextResponse.json({
      ...revision,
      fallbackUsed: false,
      modelStatus: {
        ...modelStatus,
        available: true
      }
    })
  } catch (error) {
    const fallback = buildMockRevisionResult(toFallbackItem(payload) as ReviewItem, payload.userFeedback, payload.quickChips)
    return NextResponse.json({
      ...fallback,
      fallbackUsed: true,
      guardrailNotes: [
        ...fallback.guardrailNotes,
        error instanceof Error ? `DeepSeek fallback reason: ${error.message}` : 'DeepSeek fallback reason: unknown_error'
      ],
      modelStatus: {
        ...modelStatus,
        available: false,
        detail:
          error instanceof Error
            ? `${modelStatus.detail} Fallback active: ${error.message}`
            : `${modelStatus.detail} Fallback active due to unknown error.`
      }
    })
  }
}
