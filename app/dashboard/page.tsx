'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { counts, loadReviewState, projectDefaults, saveReviewState, seedReviewState, workerRuns } from '../amigoMock'

export default function DashboardPage() {
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

  const items = state.items
  const c = useMemo(() => counts(items), [items])

  const pending = items.filter((i) => i.status === 'pending' || i.status === 'revised_pending_review').slice(0, 6)
  const highRisk = items.filter((i) => i.riskLevel === 'high' || i.riskLevel === 'critical')
  const commentsNeedingReply = items.filter(
    (i) => i.type === 'comment_reply' && (i.status === 'pending' || i.status === 'revised_pending_review')
  )
  const sprintRisks = items.filter((i) => i.type === 'sprint_risk')
  const releaseRisks = items.filter((i) => i.type === 'release_risk')
  const draftActions = items.filter((i) => (i.status === 'pending' || i.status === 'revised_pending_review') && i.draftVersions.length > 0)
  const lastScan = workerRuns[0]

  return (
    <main className="space-y-6">
      <div className="u-card">
        <div className="u-kicker">DASHBOARD</div>
        <h1 className="u-title mt-2">PM overview</h1>
        <p className="u-subtitle mt-3 max-w-[90ch]">
          一眼看到今天要你處理的決策、需要回覆的 Jira comment、以及 sprint/release 的風險。所有動作都是 draft，且
          {` ${projectDefaults.executedActionsWithoutApproval} actions executed without approval.`}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="u-card">
          <div className="u-kicker">PENDING REVIEW ITEMS</div>
          <div className="mt-1 font-mono text-3xl leading-9 text-text">{c.pendingDecisions}</div>
        </div>
        <div className="u-card">
          <div className="u-kicker">HIGH RISK ITEMS</div>
          <div className="mt-1 font-mono text-3xl leading-9 text-text">{highRisk.length}</div>
        </div>
        <div className="u-card">
          <div className="u-kicker">COMMENTS NEEDING REPLY</div>
          <div className="mt-1 font-mono text-3xl leading-9 text-text">{commentsNeedingReply.length}</div>
        </div>
        <div className="u-card">
          <div className="u-kicker">DRAFT ACTIONS (NOT EXECUTED)</div>
          <div className="mt-1 font-mono text-3xl leading-9 text-text">{draftActions.length}</div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr,0.85fr]">
        <div className="u-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="u-kicker">TODAY</div>
              <h2 className="mt-2 font-display text-[16px] leading-6 text-text">Pending decisions</h2>
              <p className="u-subtitle mt-2">只顯示最需要你處理的 6 個。</p>
            </div>
            <a className="u-btn u-btn--primary no-underline" href="/review-queue">
              Open Queue
            </a>
          </div>

          <div className="mt-4 space-y-3">
            {pending.map((it) => (
              <a
                key={it.id}
                className="block u-well no-underline"
                href={`/review-queue/${encodeURIComponent(it.id)}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-display text-sm leading-6 text-text">
                      {it.issueKey ? `${it.issueKey} · ` : ''}
                      {it.title}
                    </div>
                    <div className="mt-1 font-mono text-xs leading-5 text-muted">
                      {it.source} · {it.type} · {it.riskLevel}
                    </div>
                  </div>
                  <span className="u-badge">
                    <span className="u-badge__dot" style={{ background: 'rgb(var(--accent) / 1)' }} />
                    pending
                  </span>
                </div>
                <div className="mt-2 text-sm leading-6 text-text">{it.suggestedNextStep}</div>
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="u-card u-card--soft">
            <div className="u-kicker">SPRINT / RELEASE RISKS</div>
            <div className="mt-2 grid gap-3">
              <div className="u-well">
                <div className="font-display text-sm leading-6 text-text">Sprint planning risks</div>
                <div className="mt-1 font-mono text-xs leading-5 text-muted">{sprintRisks.length} items</div>
              </div>
              <div className="u-well">
                <div className="font-display text-sm leading-6 text-text">Release readiness risks</div>
                <div className="mt-1 font-mono text-xs leading-5 text-muted">{releaseRisks.length} items</div>
              </div>
            </div>
          </div>

          <div className="u-card u-card--soft">
            <div className="u-kicker">WORKER</div>
            <div className="mt-2 u-well">
              <div className="font-display text-sm leading-6 text-text">Last scan</div>
              <div className="mt-1 font-mono text-xs leading-5 text-muted">{lastScan.startedAt}</div>
              <div className="mt-2 text-sm leading-6 text-text">
                scanned {lastScan.itemsScanned} · created {lastScan.reviewItemsCreated}
              </div>
            </div>
          </div>

          <div className="u-card u-card--soft">
            <div className="u-kicker">GUARDRAIL</div>
            <div className="mt-2 u-well">
              <div className="font-display text-sm leading-6 text-text">
                {projectDefaults.executedActionsWithoutApproval} actions executed without approval
              </div>
              <div className="mt-1 font-mono text-xs leading-5 text-muted">
                V0：不允許真實 Jira 寫入，所有 action 只產生 draft
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
