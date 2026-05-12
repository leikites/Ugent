'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AskPmAssistantAction,
  ReviewItem,
  counts,
  createUserRequestedReviewItemFromAnalysis,
  loadReviewState,
  projectDefaults,
  saveReviewState,
  seedReviewState,
  workerRuns
} from './amigoMock'

const QUICK_ACTIONS: Array<{ label: string; action: AskPmAssistantAction }> = [
  { label: 'Jira comment 回复', action: 'comment_reply' },
  { label: '创建 Jira ticket', action: 'create_ticket' },
  { label: '创建 Jira Epic', action: 'create_epic' }
]

const CATEGORY_LABELS: Array<{ key: ReviewItem['category']; label: string }> = [
  { key: 'comment_reply', label: 'Jira comment 回复' },
  { key: 'create_ticket', label: '创建 Jira ticket' },
  { key: 'create_epic', label: '创建 Jira Epic' }
]

function riskDot(risk: ReviewItem['riskLevel']) {
  if (risk === 'critical') return 'rgb(var(--danger) / 1)'
  if (risk === 'high') return 'rgb(var(--accent) / 1)'
  if (risk === 'medium') return 'rgb(var(--accent-2) / 1)'
  return 'rgb(var(--muted) / 1)'
}

function originLabel(origin: ReviewItem['origin']) {
  return origin === 'user_requested' ? 'user requested' : 'automation'
}

function executionLabel(mode: ReviewItem['executionMode']) {
  if (mode === 'safe_auto') return 'safe auto'
  if (mode === 'draft_only') return 'draft only'
  if (mode === 'needs_approval') return 'needs approval'
  return 'blocked'
}

export default function HomePage() {
  const router = useRouter()
  const didHydrate = useRef(false)
  const [state, setState] = useState(() => seedReviewState())

  useEffect(() => {
    setState(loadReviewState())
    didHydrate.current = true
  }, [])

  const [prompt, setPrompt] = useState('')
  const [selectedAction, setSelectedAction] = useState<AskPmAssistantAction>('comment_reply')

  useEffect(() => {
    if (!didHydrate.current) return
    saveReviewState(state)
  }, [state])

  const items = state.items
  const c = useMemo(() => counts(items), [items])
  const automationItems = useMemo(() => items.filter((item) => item.origin === 'automation_detected'), [items])
  const approvalQueue = useMemo(
    () =>
      items.filter(
        (item) =>
          item.executionMode === 'needs_approval' ||
          ((item.status === 'pending' || item.status === 'revised_pending_review') && item.draftVersions.some((version) => version.content.trim()))
      ),
    [items]
  )
  const automationCategoryCounts = useMemo(
    () =>
      Object.fromEntries(CATEGORY_LABELS.map(({ key }) => [key, automationItems.filter((item) => item.category === key).length])) as Record<
        ReviewItem['category'],
        number
      >,
    [automationItems]
  )
  const lastWorker = workerRuns[0]

  const handleAsk = async () => {
    const cleanPrompt = prompt.trim()
    if (!cleanPrompt) return

    try {
      const response = await fetch('/api/pm-assistant/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: cleanPrompt,
          quickAction: selectedAction,
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
      if (!response.ok || !data?.result) throw new Error('ask_analysis_failed')

      const created = createUserRequestedReviewItemFromAnalysis(state, {
        prompt: cleanPrompt,
        quickAction: selectedAction,
        result: data.result
      })
      setState(created.state)
      saveReviewState(created.state)
      setPrompt('')
      router.push(`/review-queue/${encodeURIComponent(created.itemId)}`)
    } catch {
      const response = await fetch('/api/pm-assistant/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: cleanPrompt,
          quickAction: selectedAction,
          context: {
            dataSource: 'mock',
            jiraWritesEnabled: false
          }
        })
      })
      const data = (await response.json()) as { result?: any }
      if (!data?.result) return
      const created = createUserRequestedReviewItemFromAnalysis(state, {
        prompt: cleanPrompt,
        quickAction: selectedAction,
        result: data.result
      })
      setState(created.state)
      saveReviewState(created.state)
      setPrompt('')
      router.push(`/review-queue/${encodeURIComponent(created.itemId)}`)
    }
  }

  return (
    <main className="space-y-6">
      <div className="u-card">
        <div className="u-kicker">PRODUCT CONTROL PANEL</div>
        <h1 className="u-title mt-2">PM control panel</h1>
        <p className="u-subtitle mt-3 max-w-[95ch]">
          首页现在区分两类入口：一类是你主动 ask PM assistant，一类是系统自动发现的 PM work。所有高影响动作仍然需要你 approve，
          且目前 0 actions executed without approval（{projectDefaults.executedActionsWithoutApproval}）。
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="u-well u-well--soft">
            <div className="u-kicker">PENDING DECISIONS</div>
            <div className="mt-1 font-mono text-2xl leading-8 text-text">{c.pendingDecisions}</div>
          </div>
          <div className="u-well u-well--soft">
            <div className="u-kicker">AUTOMATION INBOX</div>
            <div className="mt-1 font-mono text-2xl leading-8 text-text">{automationItems.length}</div>
          </div>
          <div className="u-well u-well--soft">
            <div className="u-kicker">APPROVAL QUEUE</div>
            <div className="mt-1 font-mono text-2xl leading-8 text-text">{approvalQueue.length}</div>
          </div>
          <div className="u-well u-well--soft">
            <div className="u-kicker">HIGH RISK</div>
            <div className="mt-1 font-mono text-2xl leading-8 text-text">{c.highRisk}</div>
          </div>
        </div>
      </div>

      <section className="u-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="u-kicker">ASK PM ASSISTANT</div>
            <h2 className="mt-2 font-display text-[16px] leading-6 text-text">主动输入 PM 工作需求</h2>
            <p className="u-subtitle mt-2">
              这里模拟你平时直接丢给 Codex 的 PM ask。V0 先 mock，提交后会创建新的 review item，不会写 Jira。
            </p>
          </div>
          <a className="u-btn no-underline" href="/review-queue">
            Open Review Queue
          </a>
        </div>

        <div className="mt-4">
          <textarea
            className="u-input"
            rows={4}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Ask about a Jira ticket, sprint, release, epic, or draft a reply…"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((quickAction) => (
            <button
              key={quickAction.action}
              type="button"
              className={`u-btn ${selectedAction === quickAction.action ? 'u-btn--primary' : ''}`}
              onClick={() => setSelectedAction(quickAction.action)}
            >
              {quickAction.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="font-mono text-xs leading-5 text-muted">
            Creates `origin = user_requested` review item · status = pending · no Jira write in V0
          </div>
          <button className="u-btn u-btn--primary" type="button" onClick={handleAsk} disabled={!prompt.trim()}>
            Ask
          </button>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1.05fr,0.95fr]">
        <section className="u-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="u-kicker">AUTOMATION INBOX</div>
              <h2 className="mt-2 font-display text-[16px] leading-6 text-text">系统自动发现的 PM work</h2>
              <p className="u-subtitle mt-2">只显示 `origin = automation_detected` 的 items，并按 category 聚合。</p>
            </div>
            <span className="u-badge">
              <span className="u-badge__dot" style={{ background: 'rgb(var(--positive) / 1)' }} />
              scan / detect / draft
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {CATEGORY_LABELS.map(({ key, label }) => (
              <a key={key} className="u-well no-underline" href={`/review-queue?tab=${encodeURIComponent(key)}`}>
                <div className="u-kicker">{label.toUpperCase()}</div>
                <div className="mt-2 font-mono text-2xl leading-8 text-text">{automationCategoryCounts[key]}</div>
                <div className="mt-1 font-mono text-xs leading-5 text-muted">automation detected</div>
              </a>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {automationItems.slice(0, 4).map((item) => (
              <a key={item.id} className="block u-well no-underline" href={`/review-queue/${encodeURIComponent(item.id)}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-display text-sm leading-6 text-text">
                      {item.issueKey ? `${item.issueKey} · ` : ''}
                      {item.title}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 font-mono text-xs leading-5 text-muted">
                      <span>{item.category}</span>
                      <span>{originLabel(item.origin)}</span>
                      <span>{executionLabel(item.executionMode)}</span>
                      <span>{item.status}</span>
                    </div>
                  </div>
                  <span className="u-badge">
                    <span className="u-badge__dot" style={{ background: riskDot(item.riskLevel) }} />
                    {item.riskLevel}
                  </span>
                </div>
                <div className="mt-2 text-sm leading-6 text-text">{item.suggestedNextStep}</div>
              </a>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <div className="u-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="u-kicker">APPROVAL QUEUE</div>
                <h2 className="mt-2 font-display text-[16px] leading-6 text-text">需要你确认的动作</h2>
                <p className="u-subtitle mt-2">
                  这里优先显示 `executionMode = needs_approval`，以及当前已有 draft 且仍在 pending / revised_pending_review 的 items。
                </p>
              </div>
              <a className="u-btn u-btn--primary no-underline" href="/review-queue?executionMode=needs_approval">
                Open Approval Queue
              </a>
            </div>

            <div className="mt-4 space-y-3">
              {approvalQueue.slice(0, 5).map((item) => (
                <a key={item.id} className="block u-well no-underline" href={`/review-queue/${encodeURIComponent(item.id)}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-display text-sm leading-6 text-text">{item.title}</div>
                      <div className="mt-1 flex flex-wrap gap-2 font-mono text-xs leading-5 text-muted">
                        <span>{item.category}</span>
                        <span>{executionLabel(item.executionMode)}</span>
                        <span>{item.currentDraftVersionId.replace(`${item.id}-`, '')}</span>
                        <span>{item.status}</span>
                      </div>
                    </div>
                    <span className="u-badge">
                      <span className="u-badge__dot" style={{ background: riskDot(item.riskLevel) }} />
                      {item.riskLevel}
                    </span>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-text">{item.analysisNarrative.split('\n')[1] ?? item.suggestedNextStep}</div>
                </a>
              ))}
            </div>
          </div>

          <div className="u-card u-card--soft">
            <div className="u-kicker">AUTOMATION POLICY</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="u-well">
                <div className="u-kicker">SAFE AUTOMATION</div>
                <div className="mt-2 space-y-1 font-mono text-xs leading-6 text-text">
                  <div>- read Jira</div>
                  <div>- scan comments</div>
                  <div>- detect risks</div>
                  <div>- generate review item</div>
                  <div>- generate draft</div>
                  <div>- refresh analysis</div>
                </div>
              </div>
              <div className="u-well">
                <div className="u-kicker">NEEDS APPROVAL</div>
                <div className="mt-2 space-y-1 font-mono text-xs leading-6 text-text">
                  <div>- post Jira comment</div>
                  <div>- create Jira ticket</div>
                  <div>- move ticket</div>
                  <div>- change priority</div>
                  <div>- assign owner</div>
                  <div>- change release scope</div>
                </div>
              </div>
              <div className="u-well">
                <div className="u-kicker">BLOCKED</div>
                <div className="mt-2 space-y-1 font-mono text-xs leading-6 text-text">
                  <div>- missing context</div>
                  <div>- missing owner</div>
                  <div>- insufficient acceptance criteria</div>
                  <div>- missing model key</div>
                  <div>- Jira write disabled</div>
                </div>
              </div>
            </div>
            <div className="mt-3 font-mono text-xs leading-5 text-muted">
              Last worker scan: {lastWorker.startedAt} · {lastWorker.worker} · {lastWorker.status} · scanned {lastWorker.itemsScanned} · created{' '}
              {lastWorker.reviewItemsCreated}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
