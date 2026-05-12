'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AskPmAssistantAction,
  ReviewItem,
  createUserRequestedReviewItemFromAnalysis,
  loadReviewState,
  saveReviewState,
  seedReviewState
} from '../amigoMock'

function riskDot(risk: ReviewItem['riskLevel']) {
  if (risk === 'critical') return 'rgb(var(--danger) / 1)'
  if (risk === 'high') return 'rgb(var(--accent) / 1)'
  if (risk === 'medium') return 'rgb(var(--accent-2) / 1)'
  return 'rgb(var(--muted) / 1)'
}

function statusDot(status: ReviewItem['status']) {
  if (status === 'approved') return 'rgb(var(--positive) / 1)'
  if (status === 'rejected') return 'rgb(var(--danger) / 1)'
  if (status === 'needs_revision') return 'rgb(var(--accent-2) / 1)'
  if (status === 'snoozed') return 'rgb(var(--muted) / 1)'
  return 'rgb(var(--accent) / 1)'
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

const REVIEW_TABS = [
  { key: 'all', label: 'All' },
  { key: 'user_requested', label: 'User Requests' },
  { key: 'automation_detected', label: 'Automation' },
  { key: 'comment_reply', label: 'Jira comment 回复' },
  { key: 'create_ticket', label: '创建 Jira ticket' },
  { key: 'create_epic', label: '创建 Jira Epic' }
] as const

const ASK_PM_QUICK_ACTIONS: Array<{ label: string; action: AskPmAssistantAction }> = [
  { label: 'Jira comment 回复', action: 'comment_reply' },
  { label: '创建 Jira ticket', action: 'create_ticket' },
  { label: '创建 Jira Epic', action: 'create_epic' }
]

function ReviewQueueInner() {
  const router = useRouter()
  const sp = useSearchParams()

  const queryTab = sp.get('tab') ?? 'all'
  const queryKeyword = sp.get('q') ?? ''
  const queryStatus = sp.get('status') ?? ''
  const queryRisk = sp.get('risk') ?? ''
  const queryOrigin = sp.get('origin') ?? ''
  const queryExecutionMode = sp.get('executionMode') ?? ''

  const didHydrate = useRef(false)
  const [state, setState] = useState(() => seedReviewState())
  const [askPrompt, setAskPrompt] = useState('')
  const [askAction, setAskAction] = useState<AskPmAssistantAction>('comment_reply')

  useEffect(() => {
    setState(loadReviewState())
    didHydrate.current = true
  }, [])

  useEffect(() => {
    if (!didHydrate.current) return
    saveReviewState(state)
  }, [state])

  const items = state.items

  const tabCounts = useMemo(() => {
    return Object.fromEntries(
      REVIEW_TABS.map((tab) => [
        tab.key,
        items.filter((item) => {
          if (tab.key === 'all') return true
          if (tab.key === 'user_requested' || tab.key === 'automation_detected') return item.origin === tab.key
          return item.category === tab.key
        }).length
      ])
    ) as Record<(typeof REVIEW_TABS)[number]['key'], number>
  }, [items])

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const hitTab =
        queryTab === 'all'
          ? true
          : queryTab === 'user_requested' || queryTab === 'automation_detected'
            ? i.origin === queryTab
            : i.category === queryTab
      const keyword = queryKeyword.trim().toLowerCase()
      const hitKeyword =
        !keyword ||
        [i.id, i.issueKey ?? '', i.title, i.type, i.category, i.origin, i.executionMode, i.owner, i.suggestedOwner, i.sourceLabel]
          .join(' ')
          .toLowerCase()
          .includes(keyword)
      const hitStatus = !queryStatus || i.status === queryStatus
      const hitRisk = !queryRisk || i.riskLevel === queryRisk
      const hitOrigin = !queryOrigin || i.origin === queryOrigin
      const hitExecutionMode = !queryExecutionMode || i.executionMode === queryExecutionMode
      return hitTab && hitKeyword && hitStatus && hitRisk && hitOrigin && hitExecutionMode
    })
  }, [items, queryExecutionMode, queryKeyword, queryOrigin, queryRisk, queryStatus, queryTab])

  const setFilter = (
    key: 'q' | 'status' | 'risk' | 'origin' | 'executionMode' | 'tab',
    value: string
  ) => {
    const params = new URLSearchParams(sp.toString())
    if (value && value !== 'all') params.set(key, value)
    else params.delete(key)
    router.replace(`/review-queue?${params.toString()}`)
  }

  const handleAsk = async () => {
    const cleanPrompt = askPrompt.trim()
    if (!cleanPrompt) return

    const response = await fetch('/api/pm-assistant/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: cleanPrompt,
        quickAction: askAction,
        context: {
          dataSource: 'mock',
          jiraWritesEnabled: false,
          notes: ['Jira writes disabled', 'Approval only updates local state', 'Ask analysis should be model-backed'],
          recentItems: state.items.slice(0, 10).map((item) => ({
            id: item.id,
            issueKey: item.issueKey,
            title: item.title,
            category: item.category,
            riskLevel: item.riskLevel,
            status: item.status
          }))
        }
      })
    })

    const data = (await response.json()) as { result?: any }
    if (!data?.result) return

    const created = createUserRequestedReviewItemFromAnalysis(state, {
      prompt: cleanPrompt,
      quickAction: askAction,
      result: data.result
    })
    setState(created.state)
    saveReviewState(created.state)
    setAskPrompt('')

    const fromParams = new URLSearchParams(sp.toString())
    fromParams.set('tab', 'user_requested')
    router.push(`/review-queue/${encodeURIComponent(created.itemId)}?from=${encodeURIComponent(fromParams.toString())}`)
  }

  const currentFrom = useMemo(() => sp.toString(), [sp])

  return (
    <main>
      <div className="u-card">
        <div className="u-kicker">REVIEW QUEUE</div>
        <h1 className="u-title mt-2">你的 PM 决策清单</h1>
        <p className="u-subtitle mt-3 max-w-[95ch]">
          左侧是 queue list。选择 item 后会跳转到单独的详情页；这里不做任何 Jira 写入；所有 actions 都会生成 draft，且必须经过你确认。
        </p>

        <div className="mt-4 u-well u-well--soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="u-kicker">ASK PM ASSISTANT</div>
              <div className="mt-1 font-mono text-xs leading-5 text-muted">
                主动创建 `origin = user_requested` review item；V0 仍然只生成 analysis + draft
              </div>
            </div>
            <button className="u-btn u-btn--primary" type="button" onClick={handleAsk} disabled={!askPrompt.trim()}>
              Ask
            </button>
          </div>
          <div className="mt-3">
            <textarea
              className="u-input"
              rows={3}
              placeholder="Ask about a Jira ticket, sprint, release, epic, or draft a reply…"
              value={askPrompt}
              onChange={(event) => setAskPrompt(event.target.value)}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {ASK_PM_QUICK_ACTIONS.map((quickAction) => (
              <button
                key={quickAction.action}
                type="button"
                className={`u-btn ${askAction === quickAction.action ? 'u-btn--primary' : ''}`}
                onClick={() => setAskAction(quickAction.action)}
              >
                {quickAction.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {REVIEW_TABS.map((tab) => {
            const active = queryTab === tab.key || (!sp.get('tab') && tab.key === 'all')
            return (
              <button
                key={tab.key}
                type="button"
                className={`u-btn ${active ? 'u-btn--primary' : ''}`}
                onClick={() => setFilter('tab', tab.key)}
              >
                {tab.label} ({tabCounts[tab.key]})
              </button>
            )
          })}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr,180px,180px,180px,180px] sm:items-center">
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
          <select className="u-input" value={queryOrigin} onChange={(e) => setFilter('origin', e.target.value)}>
            <option value="">all origin</option>
            <option value="user_requested">user_requested</option>
            <option value="automation_detected">automation_detected</option>
          </select>
          <select className="u-input" value={queryExecutionMode} onChange={(e) => setFilter('executionMode', e.target.value)}>
            <option value="">all executionMode</option>
            <option value="safe_auto">safe_auto</option>
            <option value="draft_only">draft_only</option>
            <option value="needs_approval">needs_approval</option>
            <option value="blocked">blocked</option>
          </select>
        </div>
      </div>

      <section className="mt-5 u-card u-card--soft">
        <div className="u-kicker">QUEUE LIST</div>
        <div className="mt-4 space-y-3">
          {filteredItems.map((it) => (
            <a
              key={it.id}
              className="block u-well no-underline"
              href={`/review-queue/${encodeURIComponent(it.id)}?from=${encodeURIComponent(currentFrom)}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display text-sm leading-6 text-text">
                    {it.issueKey ? `${it.issueKey} · ` : ''}
                    {it.title}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2 font-mono text-xs leading-5 text-muted">
                    <span>{labelCategory(it.category)}</span>
                    <span>{labelOrigin(it.origin)}</span>
                    <span>{labelExecutionMode(it.executionMode)}</span>
                    <span>{it.createdAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
              <div className="mt-2 text-sm leading-6 text-text">{it.recommendedMove || it.suggestedNextStep}</div>
            </a>
          ))}

          {!filteredItems.length ? (
            <div className="u-well">
              <div className="u-kicker">EMPTY STATE</div>
              <div className="mt-2 font-mono text-xs leading-6 text-muted">
                No items match current tabs / filters. Change tab or create a new Ask PM Assistant request.
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  )
}

export default function ReviewQueuePage() {
  return (
    <Suspense>
      <ReviewQueueInner />
    </Suspense>
  )
}

