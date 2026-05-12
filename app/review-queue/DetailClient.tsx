'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { DraftRevisionApiResponse, DraftRevisionRequest } from '../../lib/reviseDraftTypes'
import {
  ReviewItem,
  ReviewItemStatus,
  approveCurrentDraft,
  buildFallbackAnalysisNarrative,
  buildMockRevisionResult,
  decideCurrentDraft,
  loadReviewState,
  reviseDraft,
  saveReviewState,
  seedReviewState
} from '../amigoMock'

function riskDot(risk: ReviewItem['riskLevel']) {
  if (risk === 'critical') return 'rgb(var(--danger) / 1)'
  if (risk === 'high') return 'rgb(var(--accent) / 1)'
  if (risk === 'medium') return 'rgb(var(--accent-2) / 1)'
  return 'rgb(var(--muted) / 1)'
}

function statusDot(status: ReviewItemStatus) {
  if (status === 'approved') return 'rgb(var(--positive) / 1)'
  if (status === 'rejected') return 'rgb(var(--danger) / 1)'
  if (status === 'needs_revision') return 'rgb(var(--accent-2) / 1)'
  if (status === 'snoozed') return 'rgb(var(--muted) / 1)'
  return 'rgb(var(--accent) / 1)'
}

function labelSource(s: ReviewItem['source']) {
  if (s === 'jira_issue') return 'Jira issue'
  if (s === 'jira_comment') return 'Jira comment'
  if (s === 'sprint') return 'Sprint'
  if (s === 'epic') return 'Epic'
  return 'Release'
}

function labelType(t: ReviewItem['type']) {
  if (t === 'comment_reply') return 'comment_reply'
  if (t === 'sprint_risk') return 'sprint_risk'
  if (t === 'priority_conflict') return 'priority_conflict'
  if (t === 'release_risk') return 'release_risk'
  if (t === 'ticket_creation_draft') return 'ticket_creation_draft'
  if (t === 'epic_creation_draft') return 'epic_creation_draft'
  return 'epic_breakdown'
}

function labelCategory(category: ReviewItem['category']) {
  if (category === 'comment_reply') return 'jira_comment_reply'
  if (category === 'create_ticket') return 'create_jira_ticket'
  return 'create_jira_epic'
}

function labelOrigin(origin: ReviewItem['origin']) {
  return origin === 'user_requested' ? 'user_requested' : 'automation_detected'
}

function labelExecutionMode(mode: ReviewItem['executionMode']) {
  if (mode === 'safe_auto') return 'safe_auto'
  if (mode === 'draft_only') return 'draft_only'
  if (mode === 'needs_approval') return 'needs_approval'
  return 'blocked'
}

function metadataValue(value?: string) {
  return value?.trim() || 'n/a'
}

function normalizeDraftContent(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function hasMeaningfulRevision(currentDraft: string, revisedDraft: string) {
  return normalizeDraftContent(currentDraft) !== normalizeDraftContent(revisedDraft)
}

function buildTicketCreationChinesePreview(item: ReviewItem, englishDraft: string) {
  const sections = [
    `建单草稿中文预览：${item.title}`,
    item.background ? `背景：${item.background}` : '',
    item.scope?.length ? `范围：${item.scope.join('；')}` : '',
    item.userStory ? `用户故事：${item.userStory}` : '',
    item.requirements?.length ? `需求：${item.requirements.join('；')}` : '',
    item.acceptanceCriteria?.length ? `验收标准：${item.acceptanceCriteria.join('；')}` : '',
    item.preCreationChecks?.length ? `建单前检查：${item.preCreationChecks.join('；')}` : '',
    `当前英文提交稿：${englishDraft}`,
    '注意：中文仅用于 review 理解，approve 时仍以英文版作为提交稿。'
  ]

  return sections.filter(Boolean).join('\n\n')
}

const QUICK_FEEDBACK = [
  'Make it shorter',
  'Make it softer',
  'Be more direct',
  'Do not commit to launch',
  'Add release risk',
  'Ask for owner',
  'Clarify out of scope',
  'Turn into Jira comment'
]

export default function DetailClient({ itemId }: { itemId: string }) {
  const router = useRouter()
  const sp = useSearchParams()
  const from = sp.get('from') ?? ''

  const didHydrate = useRef(false)
  const [state, setState] = useState(() => seedReviewState())

  useEffect(() => {
    setState(loadReviewState())
    didHydrate.current = true
  }, [])

  useEffect(() => {
    if (!didHydrate.current) return
    saveReviewState(state)
  }, [state])

  const item = useMemo(() => state.items.find((it) => it.id === itemId) ?? null, [itemId, state.items])

  const backHref = useMemo(() => {
    if (!from) return '/review-queue'
    return `/review-queue?${from}`
  }, [from])

  const [feedback, setFeedback] = useState('')
  const [chips, setChips] = useState<string[]>([])
  const [feedbackError, setFeedbackError] = useState('')
  const [isRevising, setIsRevising] = useState(false)
  const [ticketDraftLanguage, setTicketDraftLanguage] = useState<'en' | 'zh'>('en')
  const [compareId, setCompareId] = useState<string>('')

  useEffect(() => {
    setFeedback('')
    setChips([])
    setCompareId('')
    setFeedbackError('')
    setTicketDraftLanguage('en')
  }, [itemId])

  const current = item?.draftVersions.find((v) => v.id === item.currentDraftVersionId) ?? item?.draftVersions[0]
  const analysisNarrative = item ? item.analysisNarrative?.trim() || buildFallbackAnalysisNarrative(item) : ''
  const draftRevisionSource = current?.revisionSource ?? 'initial'
  const askAnalysisSource = item?.origin === 'user_requested' ? item.analysisSource : 'mock'

  const compareVersion = useMemo(() => {
    if (!item || !compareId) return null
    return item.draftVersions.find((v) => v.id === compareId) ?? null
  }, [compareId, item])

  const otherVersions = useMemo(() => {
    if (!item || !current) return []
    return item.draftVersions
      .slice()
      .sort((a, b) => b.version - a.version)
      .filter((v) => v.id !== current.id)
  }, [current, item])

  const previousVersion = useMemo(() => {
    if (!item || !current) return null
    return item.draftVersions
      .slice()
      .sort((a, b) => b.version - a.version)
      .find((v) => v.id !== current.id)
  }, [current, item])

  const lastRevisionSummary = useMemo(() => {
    if (!item || !current) return ''
    const summary =
      current.revisionSummary ||
      item.thread.find((t) => t.role === 'assistant_summary' && t.versionId === current.id)?.content ||
      current.feedbackApplied ||
      ''
    if (!summary) return ''
    return `已更新 ${current.id.replace(`${item.id}-`, '')}：${summary}`
  }, [current, item])

  const ticketDraftReviewCopy = useMemo(() => {
    if (!item || !current) return ''
    if (item.type !== 'ticket_creation_draft') return current.content
    return ticketDraftLanguage === 'zh' ? buildTicketCreationChinesePreview(item, current.content) : current.content
  }, [current, item, ticketDraftLanguage])

  const callReviseApi = async (payload: DraftRevisionRequest): Promise<DraftRevisionApiResponse> => {
    const res = await fetch('/api/revise-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return (await res.json()) as DraftRevisionApiResponse
  }

  const handleRevise = async (args: { reason?: 'revise' | 'needs_revision' }) => {
    if (!item || !current) return
    const feedbackText = feedback
    const selectedChips = chips

    const payload: DraftRevisionRequest = {
      itemId: item.id,
      issueKey: item.issueKey,
      itemType: item.type,
      title: item.title,
      analysisNarrative: analysisNarrative,
      currentDraft: current.content,
      userFeedback: feedbackText,
      quickChips: selectedChips
    }

    let revisionResult = undefined as any

    try {
      const api = await callReviseApi(payload)
      if (api?.revisedDraft && hasMeaningfulRevision(current.content, api.revisedDraft)) {
        revisionResult = {
          revisedDraft: api.revisedDraft,
          revisionSummary: api.revisionSummary,
          appliedFeedback: api.appliedFeedback,
          confidence: api.confidence,
          guardrailNotes: api.guardrailNotes,
          source: api.source
        }
      }
    } catch {
      revisionResult = undefined
    }

    if (!revisionResult) {
      revisionResult = buildMockRevisionResult(item, feedbackText, selectedChips)
    }

    const next = reviseDraft(state, {
      itemId: item.id,
      feedbackText,
      chips: selectedChips,
      reason: args.reason,
      revisionResult
    })
    setState(next)
    saveReviewState(next)
  }

  const handleApprove = () => {
    if (!item) return
    const next = approveCurrentDraft(state, { itemId: item.id })
    setState(next)
    saveReviewState(next)
  }

  const handleDecide = (decision: 'reject' | 'needs_revision' | 'snooze') => {
    if (!item) return
    const next = decideCurrentDraft(state, { itemId: item.id, decision })
    setState(next)
    saveReviewState(next)
  }

  const handleReviseClick = async () => {
    if (!item) return
    setFeedbackError('')
    setIsRevising(true)
    try {
      await handleRevise({ reason: 'revise' })
      setFeedback('')
      setChips([])
      setCompareId('')
    } catch {
      setFeedbackError('Revision request failed. Mock rewrite remains available.')
    } finally {
      setIsRevising(false)
    }
  }

  const handleNeedsRevision = async () => {
    if (!item) return
    if (!feedback.trim() && chips.length === 0) {
      setFeedbackError('Add feedback so the assistant can revise the draft.')
      return
    }
    setFeedbackError('')
    setIsRevising(true)
    try {
      await handleRevise({ reason: 'needs_revision' })
      setFeedback('')
      setChips([])
      setCompareId('')
    } catch {
      setFeedbackError('Revision request failed. Mock rewrite remains available.')
    } finally {
      setIsRevising(false)
    }
  }

  if (!item) {
    return (
      <div className="u-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="u-kicker">REVIEW DETAIL</div>
            <h1 className="u-title mt-2">Item not found</h1>
            <div className="mt-3 font-mono text-xs leading-6 text-muted">找不到这个 item（可能被清空或 local state 被重置）。</div>
          </div>
          <a className="u-btn u-btn--primary no-underline" href={backHref}>
            Back to queue
          </a>
        </div>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="u-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="u-kicker">REVIEW DETAIL</div>
            <h1 className="u-title mt-2">No draft versions</h1>
            <div className="mt-3 font-mono text-xs leading-6 text-muted">该 item 没有 draftVersions。</div>
          </div>
          <a className="u-btn u-btn--primary no-underline" href={backHref}>
            Back to queue
          </a>
        </div>
      </div>
    )
  }

  return (
    <main>
      <div className="u-card u-card--soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="u-kicker">REVIEW DETAIL</div>
            <h1 className="u-title mt-2">
              {item.issueKey ? `${item.issueKey} · ` : ''}
              {item.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="u-badge">
                <span className="u-badge__dot" style={{ background: statusDot(item.status) }} />
                {item.status}
              </span>
              <span className="u-badge">
                <span className="u-badge__dot" style={{ background: riskDot(item.riskLevel) }} />
                {item.riskLevel}
              </span>
              <span className="u-badge">
                <span className="u-badge__dot" style={{ background: 'rgb(var(--muted) / 1)' }} />
                {labelCategory(item.category)}
              </span>
              <span className="u-badge">
                <span className="u-badge__dot" style={{ background: 'rgb(var(--muted) / 1)' }} />
                {labelOrigin(item.origin)}
              </span>
              <span className="u-badge">
                <span className="u-badge__dot" style={{ background: 'rgb(var(--muted) / 1)' }} />
                {labelExecutionMode(item.executionMode)}
              </span>
              <span className="u-badge">
                <span className="u-badge__dot" style={{ background: 'rgb(var(--muted) / 1)' }} />
                {labelSource(item.source)}
              </span>
              <span className="u-badge">
                <span className="u-badge__dot" style={{ background: 'rgb(var(--muted) / 1)' }} />
                {labelType(item.type)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a className="u-btn no-underline" href={backHref}>
              Back to queue
            </a>
            <button className="u-btn u-btn--primary" type="button" onClick={handleApprove}>
              Approve
            </button>
            <button className="u-btn" type="button" onClick={() => handleDecide('reject')}>
              Reject
            </button>
            <button className="u-btn" type="button" onClick={handleNeedsRevision}>
              Needs revision
            </button>
            <button className="u-btn" type="button" onClick={() => handleDecide('snooze')}>
              Snooze
            </button>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr,0.85fr]">
        <section className="space-y-5">
          <div className="u-card u-card--soft">
            <div className="u-kicker">PM ASSISTANT ANALYSIS</div>
            <div className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-text">{analysisNarrative}</div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                ['Source', metadataValue(item.sourceLabel)],
                ['Data source', item.dataSource],
                ['Ask analysis', askAnalysisSource],
                ['Draft revision', draftRevisionSource],
                ['Category', labelCategory(item.category)],
                ['Origin', labelOrigin(item.origin)],
                ['Execution mode', labelExecutionMode(item.executionMode)],
                ['Risk', item.riskLevel],
                ['Decision needed by', metadataValue(item.decisionNeededBy)],
                ['Confidence', item.confidence],
                ['Suggested owner', metadataValue(item.suggestedOwner)],
                ['Current owner', metadataValue(item.owner)],
                ['Release / due', item.releaseDate ? `${item.releaseDate} / ${item.dueDate}` : metadataValue(item.dueDate)]
              ].map(([label, value]) => (
                <span key={label} className="u-badge">
                  <span className="u-badge__dot" style={{ background: 'rgb(var(--muted) / 1)' }} />
                  {label}: {value}
                </span>
              ))}
            </div>
            <div className="mt-3 font-mono text-xs leading-5 text-muted">
              Ask analysis may use DeepSeek with mock fallback · Draft revision may use DeepSeek with mock fallback · Jira writes disabled · Approval only updates local state
            </div>
          </div>

          {item.type === 'ticket_creation_draft' ? (
            <div className="u-card u-card--soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="u-kicker">REVIEW LANGUAGE</div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={`u-btn ${ticketDraftLanguage === 'en' ? 'u-btn--primary' : ''}`}
                    onClick={() => setTicketDraftLanguage('en')}
                  >
                    EN review
                  </button>
                  <button
                    type="button"
                    className={`u-btn ${ticketDraftLanguage === 'zh' ? 'u-btn--primary' : ''}`}
                    onClick={() => setTicketDraftLanguage('zh')}
                  >
                    中文 review
                  </button>
                </div>
              </div>
              <div className="mt-2 font-mono text-xs leading-5 text-muted">Review 可切换中英文；Approve 时只提交英文版 draft。</div>
            </div>
          ) : null}

          <div className="u-card u-card--soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="u-kicker">
                {item.type === 'comment_reply'
                  ? 'DRAFT JIRA REPLY'
                  : item.type === 'ticket_creation_draft'
                    ? 'DRAFT TICKET CREATION PLAN'
                    : item.type === 'epic_creation_draft'
                      ? 'DRAFT EPIC CREATION PLAN'
                      : 'DRAFT RECOMMENDATION'}
              </div>
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text">{ticketDraftReviewCopy}</div>
            {item.type === 'ticket_creation_draft' ? (
              <div className="mt-2 font-mono text-xs leading-5 text-muted">Approved payload is locked to the English ticket draft.</div>
            ) : null}
          </div>

          <div className="u-card u-card--soft">
            <div className="u-kicker">REVIEW FEEDBACK</div>
            <div className="mt-2 font-mono text-xs leading-5 text-muted">提交 feedback 后会生成新版本 draft（不会写 Jira）。</div>
            <textarea
              className="u-input mt-3"
              rows={4}
              placeholder="Tell the PM assistant what to change…"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_FEEDBACK.map((chip) => {
                const active = chips.includes(chip)
                return (
                  <button
                    key={chip}
                    type="button"
                    className={`u-btn ${active ? 'u-btn--primary' : ''}`}
                    onClick={() => setChips((prev) => (prev.includes(chip) ? prev.filter((x) => x !== chip) : [...prev, chip]))}
                  >
                    {chip}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              {feedbackError ? <div className="font-mono text-xs leading-5 text-danger">{feedbackError}</div> : <div />}
              <button className="u-btn u-btn--primary" type="button" onClick={handleReviseClick} disabled={isRevising}>
                Update draft
              </button>
            </div>
          </div>

          <div className="u-card u-card--soft">
            <div className="u-kicker">REVISION SUMMARY</div>
            {lastRevisionSummary ? (
              <div className="mt-2 text-sm leading-6 text-text">{lastRevisionSummary}</div>
            ) : (
              <div className="mt-2 font-mono text-xs leading-6 text-muted">暂无 revision summary。提交 feedback 后会在这里显示中文改动摘要。</div>
            )}
            {current.appliedFeedback ? (
              <div className="mt-2 font-mono text-xs leading-5 text-muted">已应用反馈：{current.appliedFeedback}</div>
            ) : null}
          </div>

          <details className="u-card u-card--soft" open={false}>
            <summary className="u-btn">VERSION HISTORY / COMPARE ({item.draftVersions.length} versions)</summary>
            <div className="mt-4 grid gap-3">
              <div className="u-well">
                <div className="u-kicker">COMPARE WITH</div>
                <select className="u-input mt-2" value={compareId} onChange={(e) => setCompareId(e.target.value)}>
                  <option value="">(none)</option>
                  {otherVersions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {`v${v.version} · ${v.createdBy} · ${v.createdAt}`}
                    </option>
                  ))}
                </select>
              </div>

              {compareVersion ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  <div className="u-well">
                    <div className="u-kicker">CURRENT ({current.id.replace(`${item.id}-`, '')})</div>
                    <div className="mt-2 whitespace-pre-wrap font-mono text-xs leading-6 text-text">{current.content}</div>
                  </div>
                  <div className="u-well">
                    <div className="u-kicker">COMPARE ({compareVersion.id.replace(`${item.id}-`, '')})</div>
                    <div className="mt-2 whitespace-pre-wrap font-mono text-xs leading-6 text-text">{compareVersion.content}</div>
                  </div>
                </div>
              ) : null}

              {previousVersion ? (
                <div className="u-well">
                  <div className="u-kicker">PREVIOUS VERSION</div>
                  <div className="mt-2 font-mono text-xs leading-6 text-text">
                    {previousVersion.id.replace(`${item.id}-`, '')} · {previousVersion.createdAt} · {previousVersion.createdBy}
                  </div>
                </div>
              ) : null}
            </div>
          </details>

          <details className="u-card u-card--soft" open={false}>
            <summary className="u-btn">Source evidence</summary>
            <div className="mt-4 space-y-2">
              {item.evidence.map((e, idx) => (
                <div key={`${idx}-${e}`} className="u-well">
                  <div className="font-mono text-xs leading-6 text-text">{e}</div>
                </div>
              ))}
              {item.assumptions.length ? (
                <div className="u-well">
                  <div className="u-kicker">ASSUMPTIONS</div>
                  <div className="mt-2 space-y-1 font-mono text-xs leading-6 text-text">
                    {item.assumptions.map((a) => (
                      <div key={a}>- {a}</div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </details>
        </section>

        <aside className="space-y-5">
          {item.approvedVersionId ? (
            <div className="u-card u-card--soft">
              <div className="u-kicker">READY TO POST (MANUAL)</div>
              <div className="mt-2 font-mono text-xs leading-6 text-text">
                Approved version: {item.approvedVersionId.replace(`${item.id}-`, '')} · approved at {item.approvedAt}
              </div>
              <div className="mt-2 space-y-1 font-mono text-xs leading-6 text-text">
                <div>- Copy draft</div>
                <div>- Mark as ready-to-post</div>
                <div>- Still not posted to Jira in V0</div>
              </div>
            </div>
          ) : null}

          <div className="u-card u-card--soft">
            <div className="u-kicker">ASSISTANT THREAD</div>
            <div className="mt-3 space-y-3">
              {item.thread.slice(0, 10).map((msg) => (
                <div key={msg.id} className="u-well">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-xs leading-6 text-muted">{msg.role}</div>
                    <div className="font-mono text-xs leading-6 text-muted">{msg.createdAt}</div>
                  </div>
                  <div className="mt-2 whitespace-pre-wrap font-mono text-xs leading-6 text-text">{msg.content}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
