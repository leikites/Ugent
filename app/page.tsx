'use client'

import { useEffect, useMemo, useState } from 'react'
import { counts, loadReviewState, projectDefaults, saveReviewState, workerRuns } from './amigoMock'

export default function HomePage() {
  const [state] = useState(() => loadReviewState())
  useEffect(() => {
    saveReviewState(state)
  }, [state])

  const items = state.items
  const c = useMemo(() => counts(items), [items])

  const todayReview = items.filter((i) => i.status === 'pending' || i.status === 'revised_pending_review').slice(0, 4)
  const commentsNeedingResponse = items.filter((i) => i.type === 'comment_reply').slice(0, 3)
  const sprintReleaseRisks = items
    .filter((i) => i.type === 'sprint_risk' || i.type === 'release_risk')
    .slice(0, 3)
  const draftsWaitingApproval = items
    .filter((i) => (i.status === 'pending' || i.status === 'revised_pending_review') && i.draftVersions.length > 0)
    .slice(0, 3)
  const lastWorker = workerRuns[0]

  return (
    <main>
      <div className="u-card">
        <div className="u-kicker">PM COCKPIT</div>
        <h1 className="u-title mt-2">Today’s PM Review</h1>
        <p className="u-subtitle mt-3 max-w-[80ch]">
          這裡只做 read-only 與 draft。所有高影響動作都需要你 approve，且目前 0 actions executed without approval（
          {projectDefaults.executedActionsWithoutApproval}）。
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="u-well u-well--soft">
            <div className="u-kicker">PENDING DECISIONS</div>
            <div className="mt-1 font-mono text-2xl leading-8 text-text">{c.pendingDecisions}</div>
          </div>
          <div className="u-well u-well--soft">
            <div className="u-kicker">COMMENTS NEED REPLY</div>
            <div className="mt-1 font-mono text-2xl leading-8 text-text">{c.jiraCommentsNeedingResponse}</div>
          </div>
          <div className="u-well u-well--soft">
            <div className="u-kicker">HIGH RISK</div>
            <div className="mt-1 font-mono text-2xl leading-8 text-text">{c.highRisk}</div>
          </div>
          <div className="u-well u-well--soft">
            <div className="u-kicker">DRAFTS WAITING</div>
            <div className="mt-1 font-mono text-2xl leading-8 text-text">{c.draftActionsWaitingApproval}</div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr,0.8fr]">
        <section className="u-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="u-kicker">TODAY’S PM REVIEW</div>
              <h2 className="mt-2 font-display text-[16px] leading-6 text-text">待你確認的項目</h2>
              <p className="u-subtitle mt-2">Approve / Reject / Needs revision / Snooze</p>
            </div>
            <a className="u-btn u-btn--primary no-underline" href="/review-queue">
              Open Review Queue
            </a>
          </div>

          <div className="mt-4 space-y-3">
            {todayReview.map((it) => (
              <a
                key={it.id}
                className="block u-well no-underline"
                href={`/review-queue?selected=${encodeURIComponent(it.id)}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-display text-sm leading-6 text-text">
                      {it.issueKey ? `${it.issueKey} · ` : ''}
                      {it.title}
                    </div>
                    <div className="mt-1 font-mono text-xs leading-5 text-muted">
                      {it.source} · {it.type} · {it.riskLevel} · {it.status}
                    </div>
                  </div>
                  <span className="u-badge">
                    <span className="u-badge__dot" style={{ background: 'rgb(var(--accent) / 1)' }} />
                    pending
                  </span>
                </div>
                <div className="mt-2 text-sm leading-6 text-text">{it.whyItMatters}</div>
              </a>
            ))}
          </div>
        </section>

        <aside className="space-y-5">
          <div className="u-card u-card--soft">
            <div className="u-kicker">JIRA COMMENTS</div>
            <h2 className="mt-2 font-display text-[16px] leading-6 text-text">需要回覆的留言</h2>
            <div className="mt-4 space-y-3">
              {commentsNeedingResponse.map((it) => (
                <a
                  key={it.id}
                  className="block u-well no-underline"
                  href={`/review-queue?selected=${encodeURIComponent(it.id)}`}
                >
                  <div className="font-display text-sm leading-6 text-text">
                    {it.issueKey ? `${it.issueKey} · ` : ''}
                    {it.title}
                  </div>
                  <div className="mt-1 font-mono text-xs leading-5 text-muted">{it.createdAt}</div>
                </a>
              ))}
            </div>
          </div>

          <div className="u-card u-card--soft">
            <div className="u-kicker">SPRINT / RELEASE RISKS</div>
            <h2 className="mt-2 font-display text-[16px] leading-6 text-text">風險提醒</h2>
            <div className="mt-4 space-y-3">
              {sprintReleaseRisks.map((it) => (
                <a
                  key={it.id}
                  className="block u-well no-underline"
                  href={`/review-queue?selected=${encodeURIComponent(it.id)}`}
                >
                  <div className="font-display text-sm leading-6 text-text">{it.title}</div>
                  <div className="mt-1 font-mono text-xs leading-5 text-muted">
                    {it.type} · {it.riskLevel}
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="u-card u-card--soft">
            <div className="u-kicker">DRAFT ACTIONS</div>
            <h2 className="mt-2 font-display text-[16px] leading-6 text-text">等待批准的草稿</h2>
            <div className="mt-4 space-y-3">
              {draftsWaitingApproval.map((it) => (
                <a
                  key={it.id}
                  className="block u-well no-underline"
                  href={`/review-queue?selected=${encodeURIComponent(it.id)}`}
                >
                  <div className="font-display text-sm leading-6 text-text">{it.title}</div>
                  <div className="mt-1 font-mono text-xs leading-5 text-muted">
                    {it.currentDraftVersionId.replace(`${it.id}-`, '')} · draft
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="u-card u-card--soft">
            <div className="u-kicker">WORKER STATUS</div>
            <h2 className="mt-2 font-display text-[16px] leading-6 text-text">Last scan</h2>
            <div className="mt-4 u-well">
              <div className="font-mono text-xs leading-5 text-muted">{lastWorker.startedAt}</div>
              <div className="mt-1 text-sm leading-6 text-text">
                {lastWorker.worker} · {lastWorker.status} · scanned {lastWorker.itemsScanned} · created{' '}
                {lastWorker.reviewItemsCreated}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
