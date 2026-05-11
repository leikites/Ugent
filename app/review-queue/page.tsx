'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  buildMockRevisionResult,
  DraftRevisionResult,
  ReviewItem,
  ReviewItemStatus,
  approveCurrentDraft,
  buildFallbackAnalysisNarrative,
  decideCurrentDraft,
  loadReviewState,
  reviseDraft,
  saveReviewState
} from '../amigoMock'
import type { DraftRevisionApiResponse, DraftRevisionRequest } from '../../lib/reviseDraftTypes'

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
  return 'epic_breakdown'
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

function Detail({
  item,
  onRevise,
  onApprove,
  onDecide
}: {
  item: ReviewItem
  onRevise: (args: { itemId: string; feedbackText: string; chips: string[]; reason?: 'revise' | 'needs_revision' }) => Promise<void>
  onApprove: (itemId: string) => void
  onDecide: (args: { itemId: string; decision: 'reject' | 'needs_revision' | 'snooze' }) => void
}) {
  const [feedback, setFeedback] = useState('')
  const [chips, setChips] = useState<string[]>([])
  const [feedbackError, setFeedbackError] = useState('')
  const [isRevising, setIsRevising] = useState(false)
  const [ticketDraftLanguage, setTicketDraftLanguage] = useState<'en' | 'zh'>('en')
  const current = item.draftVersions.find((v) => v.id === item.currentDraftVersionId) ?? item.draftVersions[0]
  const analysisNarrative = item.analysisNarrative?.trim() || buildFallbackAnalysisNarrative(item)
  const [compareId, setCompareId] = useState<string>('')

  useEffect(() => {
    setFeedback('')
    setChips([])
    setCompareId('')
    setFeedbackError('')
    setTicketDraftLanguage('en')
  }, [item.id])

  const compareVersion = useMemo(() => {
    if (!compareId) return null
    return item.draftVersions.find((v) => v.id === compareId) ?? null
  }, [compareId, item.draftVersions])

  const otherVersions = useMemo(() => {
    return item.draftVersions
      .slice()
      .sort((a, b) => b.version - a.version)
      .filter((v) => v.id !== current.id)
  }, [current.id, item.draftVersions])

  const previousVersion = useMemo(() => {
    return item.draftVersions
      .slice()
      .sort((a, b) => b.version - a.version)
      .find((v) => v.id !== current.id)
  }, [current.id, item.draftVersions])

  const lastRevisionSummary = useMemo(() => {
    const summary =
      current.revisionSummary ||
      item.thread.find((t) => t.role === 'assistant_summary' && t.versionId === current.id)?.content ||
      current.feedbackApplied ||
      ''
    if (!summary) return ''
    return `已更新 ${current.id.replace(`${item.id}-`, '')}：${summary}`
  }, [current.feedbackApplied, current.id, current.revisionSummary, item.id, item.thread])

  const ticketDraftReviewCopy = useMemo(() => {
    if (item.type !== 'ticket_creation_draft') return current.content
    return ticketDraftLanguage === 'zh' ? buildTicketCreationChinesePreview(item, current.content) : current.content
  }, [current.content, item, ticketDraftLanguage])

  const handleReviseClick = async () => {
    setFeedbackError('')
    setIsRevising(true)
    try {
      await onRevise({ itemId: item.id, feedbackText: feedback, chips, reason: 'revise' })
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
    if (!feedback.trim() && chips.length === 0) {
      setFeedbackError('Add feedback so the assistant can revise the draft.')
      return
    }
    setFeedbackError('')
    setIsRevising(true)
    try {
      await onRevise({ itemId: item.id, feedbackText: feedback, chips, reason: 'needs_revision' })
      setFeedback('')
      setChips([])
      setCompareId('')
    } catch {
      setFeedbackError('Revision request failed. Mock rewrite remains available.')
    } finally {
      setIsRevising(false)
    }
  }

  return (
    <div className="u-card u-card--soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="u-kicker">SELECTED ITEM</div>
          <h2 className="mt-2 font-display text-[16px] leading-6 text-text">
            {item.issueKey ? `${item.issueKey} · ` : ''}
            {item.title}
          </h2>
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
              {labelSource(item.source)}
            </span>
            <span className="u-badge">
              <span className="u-badge__dot" style={{ background: 'rgb(var(--muted) / 1)' }} />
              {labelType(item.type)}
            </span>
            {item.approvedVersionId ? (
              <span className="u-badge">
                <span className="u-badge__dot" style={{ background: 'rgb(var(--positive) / 1)' }} />
                Approved {item.approvedVersionId.replace(`${item.id}-`, '')}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="u-btn u-btn--primary" type="button" onClick={() => onApprove(item.id)}>
            Approve
          </button>
          <button className="u-btn" type="button" onClick={() => onDecide({ itemId: item.id, decision: 'reject' })}>
            Reject
          </button>
          <button className="u-btn" type="button" onClick={handleNeedsRevision}>
            Needs revision
          </button>
          <button className="u-btn" type="button" onClick={() => onDecide({ itemId: item.id, decision: 'snooze' })}>
            Snooze
          </button>
        </div>
      </div>

      {item.type === 'ticket_creation_draft' ? (
        <div className="mt-4 u-well u-well--soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="u-kicker">REVIEW LANGUAGE</div>
              <div className="mt-1 font-mono text-xs leading-5 text-muted">
                Review 时可切换中英文；Approve 仍只认英文版 draft。
              </div>
            </div>
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
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        <div className="u-well">
          <div className="u-kicker">PM ASSISTANT ANALYSIS</div>
          <div className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-text">{analysisNarrative}</div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ['Source', metadataValue(item.sourceLabel)],
              ['Type', labelType(item.type)],
              ['Risk', item.riskLevel],
              ['Decision needed by', metadataValue(item.decisionNeededBy)],
              ['Confidence', item.confidence],
              ['Suggested owner', metadataValue(item.suggestedOwner)],
              ['Current owner', metadataValue(item.owner)],
              ['Release / due', item.releaseDate ? `${item.releaseDate} / ${item.dueDate}` : metadataValue(item.dueDate)]
            ].map(([label, value]) => (
              <div key={label} className="rounded-[16px] border border-border/60 bg-white/[0.03] px-3 py-2">
                <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">{label}</div>
                <div className="mt-1 text-sm leading-5 text-text">{value}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 font-mono text-xs leading-5 text-muted">
            Jira writes disabled · Draft revision may use DeepSeek with mock fallback · Approval only updates local state
          </div>
        </div>

        <div className="u-well">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="u-kicker">DRAFT FOR REVIEW</div>
              <div className="mt-1 font-mono text-xs leading-5 text-muted">
                Current version: {current.id.replace(`${item.id}-`, '')} · {current.createdBy} · {current.createdAt}
                {item.approvedVersionId === current.id ? ` · approved at ${item.approvedAt}` : ''}
              </div>
            </div>
            <span className="u-badge">
              <span className="u-badge__dot" style={{ background: statusDot(item.status) }} />
              {item.status}
            </span>
          </div>

          <div className="mt-3 u-well u-well--soft">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="u-kicker">
                {item.type === 'comment_reply'
                  ? 'DRAFT JIRA REPLY'
                  : item.type === 'release_risk' || item.type === 'sprint_risk'
                    ? 'DRAFT PM ACTION'
                    : item.type === 'ticket_creation_draft'
                      ? 'DRAFT TICKET CREATION PLAN'
                      : 'DRAFT RECOMMENDATION'}
              </div>
              {item.type === 'ticket_creation_draft' ? (
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
              ) : null}
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-text">{ticketDraftReviewCopy}</div>
            {item.type === 'ticket_creation_draft' ? (
              <div className="mt-2 font-mono text-xs leading-5 text-muted">
                Review 可切换中英文；Approve 时只提交英文版 draft。
              </div>
            ) : null}
          </div>

          {item.type === 'ticket_creation_draft' ? (
            <div className="mt-3 u-well u-well--soft">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="u-kicker">AMIGO WORKFLOW</div>
                <span className="u-badge">
                  <span className="u-badge__dot" style={{ background: 'rgb(var(--accent-2) / 1)' }} />
                  {item.workflowStage ?? 'draft'} (V0 stops at draft / confirm)
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
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
              <div className="mt-3 grid gap-3">
                <div className="u-well">
                  <div className="u-kicker">{ticketDraftLanguage === 'zh' ? '背景' : 'BACKGROUND'}</div>
                  <div className="mt-2 text-sm leading-6 text-text">{item.background}</div>
                </div>
                <div className="u-well">
                  <div className="u-kicker">{ticketDraftLanguage === 'zh' ? '范围' : 'SCOPE'}</div>
                  <div className="mt-2 space-y-1">
                    {item.scope?.map((x) => (
                      <div key={x} className="font-mono text-xs leading-6 text-text">
                        - {x}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="u-well">
                  <div className="u-kicker">{ticketDraftLanguage === 'zh' ? '用户故事' : 'USER STORY'}</div>
                  <div className="mt-2 text-sm leading-6 text-text">{item.userStory}</div>
                </div>
                <div className="u-well">
                  <div className="u-kicker">{ticketDraftLanguage === 'zh' ? '需求' : 'REQUIREMENTS'}</div>
                  <div className="mt-2 space-y-1">
                    {item.requirements?.map((x) => (
                      <div key={x} className="font-mono text-xs leading-6 text-text">
                        - {x}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="u-well">
                  <div className="u-kicker">{ticketDraftLanguage === 'zh' ? '验收标准' : 'ACCEPTANCE CRITERIA'}</div>
                  <div className="mt-2 space-y-1">
                    {item.acceptanceCriteria?.map((x) => (
                      <div key={x} className="font-mono text-xs leading-6 text-text">
                        - {x}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="u-well">
                  <div className="u-kicker">{ticketDraftLanguage === 'zh' ? '建单前检查' : 'PRE-CREATION CHECKS'}</div>
                  <div className="mt-2 space-y-1">
                    {item.preCreationChecks?.map((x) => (
                      <div key={x} className="font-mono text-xs leading-6 text-text">
                        - {x}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {item.approvedVersionId ? (
            <div className="mt-3 u-well u-well--soft">
              <div className="u-kicker">READY TO POST (MANUAL)</div>
              <div className="mt-2 font-mono text-xs leading-6 text-text">
                Approved version: {item.approvedVersionId.replace(`${item.id}-`, '')} · approved at {item.approvedAt}
              </div>
              {item.type === 'ticket_creation_draft' ? (
                <div className="mt-2 font-mono text-xs leading-5 text-muted">Approved payload is locked to the English ticket draft.</div>
              ) : null}
              <div className="mt-2 space-y-1 font-mono text-xs leading-6 text-text">
                <div>- Copy draft</div>
                <div>- Mark as ready-to-post</div>
                <div>- Keep as approved draft</div>
              </div>
              <div className="mt-2 font-mono text-xs leading-5 text-muted">Still not posted to Jira in V0</div>
            </div>
          ) : null}
        </div>

        <div className="u-well">
          <div className="u-kicker">REVIEW FEEDBACK</div>
          <div className="mt-3">
            <textarea
              className="u-input"
              placeholder="Tell the PM assistant what to change…"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK_FEEDBACK.map((chip) => {
              const active = chips.includes(chip)
              return (
                <button
                  key={chip}
                  type="button"
                  className={`u-btn ${active ? 'u-btn--primary' : ''}`}
                  onClick={() => setChips((prev) => (prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]))}
                >
                  {chip}
                </button>
              )
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="font-mono text-xs leading-5 text-muted">
              Revision only updates local/mock draft · No Jira write · Approval only updates local state
            </div>
            <button
              className="u-btn u-btn--primary"
              type="button"
              onClick={handleReviseClick}
              disabled={isRevising || (!feedback.trim() && chips.length === 0)}
            >
              {isRevising ? 'Updating…' : 'Update draft'}
            </button>
          </div>
          {feedbackError ? <div className="mt-2 font-mono text-xs leading-5 text-danger">{feedbackError}</div> : null}
        </div>

        <div className="u-well u-well--soft">
          <div className="u-kicker">REVISION SUMMARY</div>
          {lastRevisionSummary ? (
            <div className="mt-2 text-sm leading-6 text-text">{lastRevisionSummary}</div>
          ) : (
            <div className="mt-2 font-mono text-xs leading-6 text-muted">
              暂无 revision summary。提交 feedback 后会在这里显示中文改动摘要。
            </div>
          )}
          {current.feedbackApplied ? (
            <div className="mt-2 font-mono text-xs leading-5 text-muted">
              已应用反馈：{current.feedbackApplied}
            </div>
          ) : null}
          {current.revisionSource || current.revisionConfidence ? (
            <div className="mt-2 font-mono text-xs leading-5 text-muted">
              Revision source: {current.revisionSource ?? 'mock'} · confidence: {current.revisionConfidence ?? 'medium'}
            </div>
          ) : null}
          {current.guardrailNotes?.length ? (
            <div className="mt-2 font-mono text-xs leading-5 text-muted">
              {current.guardrailNotes.join(' · ')}
            </div>
          ) : null}
        </div>

        <details className="u-well u-well--soft">
          <summary className="flex flex-wrap items-center justify-between gap-3 cursor-pointer list-none">
            <div>
              <div className="u-kicker">VERSION HISTORY / COMPARE</div>
              <div className="mt-1 font-mono text-xs leading-5 text-muted">{item.draftVersions.length} versions</div>
            </div>
            <span className="u-badge">
              <span className="u-badge__dot" style={{ background: 'rgb(var(--muted) / 1)' }} />
              collapsed by default
            </span>
          </summary>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="font-mono text-xs leading-5 text-muted">
              Current: {current.id.replace(`${item.id}-`, '')}
            </div>
            <div className="flex items-center gap-2">
              <div className="font-mono text-xs leading-5 text-muted">Compare</div>
              <select className="u-input" value={compareId} onChange={(e) => setCompareId(e.target.value)}>
                <option value="">(none)</option>
                {otherVersions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id.replace(`${item.id}-`, '')} · {v.createdBy} · {v.createdAt}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 grid gap-2">
            {item.draftVersions
              .slice()
              .sort((a, b) => b.version - a.version)
              .map((v) => (
                <div key={v.id} className="u-well">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-mono text-xs leading-5 text-muted">
                      {v.id.replace(`${item.id}-`, '')} · {v.createdBy} · {v.createdAt}
                    </div>
                    <span className="u-badge">
                      <span
                        className="u-badge__dot"
                        style={{
                          background:
                            v.status === 'approved'
                              ? 'rgb(var(--positive) / 1)'
                              : v.id === current.id
                                ? 'rgb(var(--accent) / 1)'
                                : 'rgb(var(--muted) / 1)'
                        }}
                      />
                      {v.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="u-well">
              <div className="u-kicker">CURRENT</div>
              <div className="mt-2 whitespace-pre-wrap font-mono text-xs leading-6 text-text">{current.content}</div>
            </div>
            <div className="u-well">
              <div className="u-kicker">{compareVersion ? compareVersion.id.replace(`${item.id}-`, '') : 'PREVIOUS'}</div>
              <div className="mt-2 whitespace-pre-wrap font-mono text-xs leading-6 text-text">
                {(compareVersion?.content ?? previousVersion?.content ?? '').trim() || '(none)'}
              </div>
            </div>
          </div>
        </details>

        <details className="u-well u-well--soft">
          <summary className="u-btn">Source evidence</summary>
          <div className="mt-3 grid gap-3">
            <div className="u-well">
              <div className="u-kicker">EVIDENCE USED</div>
              <div className="mt-2 space-y-1">
                {item.evidence.map((e) => (
                  <div key={e} className="font-mono text-xs leading-6 text-text">
                    - {e}
                  </div>
                ))}
              </div>
            </div>
            <div className="u-well">
              <div className="u-kicker">SOURCE</div>
              <div className="mt-2 font-mono text-xs leading-6 text-text">{item.sourceLabel}</div>
              <div className="mt-1 font-mono text-xs leading-6 text-muted">{item.sourceUrl ?? 'source link placeholder'}</div>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}

function ReviewQueueInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const selectedId = sp.get('selected') ?? ''
  const queryKeyword = sp.get('q') ?? ''
  const queryStatus = sp.get('status') ?? ''
  const queryRisk = sp.get('risk') ?? ''

  const [state, setState] = useState(() => loadReviewState())

  useEffect(() => {
    saveReviewState(state)
  }, [state])

  const items = state.items
  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const keyword = queryKeyword.trim().toLowerCase()
      const hitKeyword =
        !keyword ||
        [i.id, i.issueKey ?? '', i.title, i.type, i.owner, i.suggestedOwner, i.sourceLabel]
          .join(' ')
          .toLowerCase()
          .includes(keyword)
      const hitStatus = !queryStatus || i.status === queryStatus
      const hitRisk = !queryRisk || i.riskLevel === queryRisk
      return hitKeyword && hitStatus && hitRisk
    })
  }, [items, queryKeyword, queryRisk, queryStatus])

  const selected = useMemo(() => {
    return filteredItems.find((i) => i.id === selectedId) ?? filteredItems[0] ?? items[0]
  }, [filteredItems, items, selectedId])

  useEffect(() => {
    if (!filteredItems.length) return
    if (!selectedId || !filteredItems.some((i) => i.id === selectedId)) {
      const params = new URLSearchParams(sp.toString())
      params.set('selected', filteredItems[0].id)
      router.replace(`/review-queue?${params.toString()}`)
    }
  }, [filteredItems, router, selectedId, sp])

  const setSelected = (id: string) => {
    if (id === selectedId) return
    const params = new URLSearchParams(sp.toString())
    params.set('selected', id)
    router.push(`/review-queue?${params.toString()}`)
  }

  const setFilter = (key: 'q' | 'status' | 'risk', value: string) => {
    const params = new URLSearchParams(sp.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.replace(`/review-queue?${params.toString()}`)
  }

  const handleRevise = async (args: {
    itemId: string
    feedbackText: string
    chips: string[]
    reason?: 'revise' | 'needs_revision'
  }) => {
    const item = state.items.find((candidate) => candidate.id === args.itemId)
    if (!item) return

    const currentDraft = item.draftVersions.find((v) => v.id === item.currentDraftVersionId)?.content ?? ''

    let revisionResult: DraftRevisionResult | undefined

    try {
      const payload: DraftRevisionRequest = {
        itemId: item.id,
        issueKey: item.issueKey,
        itemType: item.type,
        title: item.title,
        analysisNarrative: item.analysisNarrative?.trim() || buildFallbackAnalysisNarrative(item),
        currentDraft,
        userFeedback: args.feedbackText,
        quickChips: args.chips
      }

      const response = await fetch('/api/revise-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = (await response.json()) as DraftRevisionApiResponse
        revisionResult = {
          revisedDraft: data.revisedDraft,
          revisionSummary: data.revisionSummary,
          appliedFeedback: data.appliedFeedback,
          confidence: data.confidence,
          guardrailNotes: data.guardrailNotes,
          source: data.source
        }
      }
    } catch {
      revisionResult = undefined
    }

    if (!revisionResult || !hasMeaningfulRevision(currentDraft, revisionResult.revisedDraft)) {
      const fallback = buildMockRevisionResult(item, args.feedbackText, args.chips)
      revisionResult = {
        ...fallback,
        guardrailNotes: [
          ...fallback.guardrailNotes,
          !revisionResult
            ? 'API revision unavailable, local fallback applied'
            : 'Model returned unchanged draft, local fallback applied'
        ]
      }
    }

    setState((prev) => {
      const next = reviseDraft(prev, { ...args, revisionResult })
      saveReviewState(next)
      return next
    })
    setSelected(args.itemId)
  }

  const handleApprove = (itemId: string) => {
    setState((prev) => {
      const next = approveCurrentDraft(prev, { itemId })
      saveReviewState(next)
      return next
    })
    setSelected(itemId)
  }

  const handleDecide = (args: { itemId: string; decision: 'reject' | 'needs_revision' | 'snooze' }) => {
    setState((prev) => {
      const next = decideCurrentDraft(prev, args)
      saveReviewState(next)
      return next
    })
    setSelected(args.itemId)
  }

  return (
    <main className="space-y-6">
      <div className="u-card">
        <div className="u-kicker">REVIEW QUEUE</div>
        <h1 className="u-title mt-2">你的 PM 決策清單</h1>
        <p className="u-subtitle mt-3 max-w-[95ch]">
          左側是 queue list，右側是 selected item detail。這裡不做任何 Jira 寫入；所有 actions 都只產生 draft，且必須經過你確認。
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr,220px,220px,auto] sm:items-center">
          <input
            className="u-input"
            placeholder="搜尋：issue key / title / type…"
            value={queryKeyword}
            onChange={(e) => setFilter('q', e.target.value)}
          />
          <select className="u-input" value={queryStatus} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">all status</option>
            <option value="pending">pending</option>
            <option value="revised_pending_review">revised_pending_review</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="needs_revision">needs_revision</option>
            <option value="snoozed">snoozed</option>
          </select>
          <select className="u-input" value={queryRisk} onChange={(e) => setFilter('risk', e.target.value)}>
            <option value="">all risk</option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>
          <a className="u-btn u-btn--primary no-underline" href="/review-queue">
            Refresh
          </a>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.95fr,1.05fr]">
        <section className="u-card u-card--soft">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="u-kicker">QUEUE LIST</div>
              <div className="mt-1 font-mono text-xs leading-5 text-muted">
                {filteredItems.length} / {items.length} items
              </div>
            </div>
            <span className="u-badge">
              <span className="u-badge__dot" style={{ background: 'rgb(var(--muted) / 1)' }} />
              local state
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {filteredItems.map((it) => {
              const active = it.id === selected.id
              return (
                <button
                  key={it.id}
                  type="button"
                  className={`block w-full text-left u-well ${active ? '' : 'u-well--soft'}`}
                  onClick={() => setSelected(it.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-display text-sm leading-6 text-text">
                        {it.issueKey ? `${it.issueKey} · ` : ''}
                        {it.title}
                      </div>
                      <div className="mt-1 font-mono text-xs leading-5 text-muted">
                        {labelSource(it.source)} · {labelType(it.type)} · {it.createdAt}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="u-badge">
                        <span className="u-badge__dot" style={{ background: statusDot(it.status) }} />
                        {it.status}
                      </span>
                      <span className="u-badge">
                        <span className="u-badge__dot" style={{ background: riskDot(it.riskLevel) }} />
                        {it.riskLevel}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
            {!filteredItems.length ? (
              <div className="u-well u-well--soft">
                <div className="font-mono text-xs leading-6 text-muted">No items match current filters.</div>
              </div>
            ) : null}
          </div>
        </section>

        <section>
          <Detail item={selected} onRevise={handleRevise} onApprove={handleApprove} onDecide={handleDecide} />
        </section>
      </div>
    </main>
  )
}

export default function ReviewQueuePage() {
  return (
    <Suspense
      fallback={
        <main className="space-y-6">
          <div className="u-card">
            <div className="u-kicker">REVIEW QUEUE</div>
            <h1 className="u-title mt-2">Loading…</h1>
          </div>
        </main>
      }
    >
      <ReviewQueueInner />
    </Suspense>
  )
}
