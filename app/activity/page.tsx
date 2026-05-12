'use client'

import { useEffect, useRef, useState } from 'react'
import { loadReviewState, saveReviewState, seedReviewState, workerRuns } from '../amigoMock'

function statusDot(status: 'ok' | 'warn' | 'error') {
  if (status === 'ok') return 'rgb(var(--positive) / 1)'
  if (status === 'warn') return 'rgb(var(--accent-2) / 1)'
  return 'rgb(var(--danger) / 1)'
}

function workerLabel(worker: (typeof workerRuns)[number]['worker']) {
  if (worker === 'jira_sync_worker') return 'jira sync worker'
  if (worker === 'comment_analyzer') return 'comment analyzer'
  if (worker === 'sprint_risk_analyzer') return 'sprint risk analyzer'
  return 'release readiness checker'
}

export default function ActivityPage() {
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

  const typeLabel: Record<string, string> = {
    worker_event: 'worker_event',
    user_feedback: 'user_feedback',
    draft_revision: 'draft_revision',
    user_decision: 'user_decision',
    approval: 'approval',
    user_request: 'user_request'
  }

  return (
    <main className="space-y-6">
      <div className="u-card">
        <div className="u-kicker">ACTIVITY LOG</div>
        <h1 className="u-title mt-2">Worker timeline</h1>
        <p className="u-subtitle mt-3 max-w-[95ch]">
          這裡顯示 worker 的掃描/分析結果摘要。所有 Jira 互動皆為 read-only；所有寫入動作只會生成 draft，不會執行。
        </p>
      </div>

      <div className="u-card u-card--soft">
        <div className="u-kicker">EVENTS</div>
        <div className="mt-3 space-y-2">
          {state.activityEvents.length ? (
            state.activityEvents.slice(0, 20).map((e) => (
              <div key={e.id} className="u-well u-well--soft">
                <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs leading-5 text-muted">
                  <div>{e.createdAt}</div>
                  <div>
                    {typeLabel[e.type] ?? e.type}
                    {e.itemId ? ` · ${e.itemId}` : ''}
                    {e.versionId ? ` · ${e.versionId}` : ''}
                  </div>
                </div>
                <div className="mt-1 text-sm leading-6 text-text">{e.message}</div>
              </div>
            ))
          ) : (
            <div className="font-mono text-xs leading-6 text-muted">No events yet.</div>
          )}
        </div>
      </div>

      <div className="u-card u-card--soft">
        <div className="grid grid-cols-[1.2fr,120px,110px,110px,140px] gap-0 border-b border-border bg-surface px-4 py-3">
          <div className="u-kicker">WORKER</div>
          <div className="u-kicker">STARTED</div>
          <div className="u-kicker">DURATION</div>
          <div className="u-kicker">STATUS</div>
          <div className="u-kicker">OUTPUT</div>
        </div>

        <div className="divide-y divide-border">
          {workerRuns.map((r) => (
            <div key={r.id} className="grid grid-cols-[1.2fr,120px,110px,110px,140px] gap-0 px-4 py-3">
              <div className="min-w-0">
                <div className="font-display text-sm leading-6 text-text">{workerLabel(r.worker)}</div>
                <div className="mt-1 font-mono text-xs leading-5 text-muted">{r.id}</div>
                {r.errors.length ? (
                  <div className="mt-2 rounded-px bg-surface px-3 py-2 shadow-inset">
                    <div className="u-kicker">ERRORS</div>
                    <div className="mt-1 space-y-1">
                      {r.errors.map((e) => (
                        <div key={e} className="font-mono text-xs leading-6 text-text">
                          - {e}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="font-mono text-xs leading-6 text-text">{r.startedAt.split(' ')[1]}</div>
              <div className="font-mono text-xs leading-6 text-text">{r.durationSec}s</div>
              <div>
                <span className="u-badge">
                  <span className="u-badge__dot" style={{ background: statusDot(r.status) }} />
                  {r.status}
                </span>
              </div>
              <div className="space-y-1">
                <div className="font-mono text-xs leading-6 text-text">scanned {r.itemsScanned}</div>
                <div className="font-mono text-xs leading-6 text-text">created {r.reviewItemsCreated}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
