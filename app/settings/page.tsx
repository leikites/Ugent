import { projectDefaults } from '../amigoMock'
import { getPmAssistantModelStatus, getRevisionModelStatus } from '../../lib/revisionModel'

export default async function SettingsPage() {
  const modelStatus = getRevisionModelStatus()
  const askModelStatus = getPmAssistantModelStatus()

  return (
    <main className="space-y-6">
      <div className="u-card">
        <div className="u-kicker">SETTINGS</div>
        <h1 className="u-title mt-2">Read-only + approval gates</h1>
        <p className="u-subtitle mt-3 max-w-[95ch]">
          Jira writes 仍然 disabled；approval 只更新 local state。V1 只新增 DeepSeek draft revision，不改動 Jira guardrail。
        </p>
      </div>

      <section className="u-card">
        <div className="u-kicker">SYSTEM STATUS</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="u-well">
            <div className="u-kicker">Data source</div>
            <div className="mt-2 font-display text-sm leading-6 text-text">Mock data</div>
            <div className="mt-1 font-mono text-xs leading-5 text-muted">Current V1 demo still runs on local mock review items</div>
          </div>
          <div className="u-well">
            <div className="u-kicker">Draft revision</div>
            <div className="mt-2 font-display text-sm leading-6 text-text">
              {modelStatus.available ? 'DeepSeek / mock fallback' : 'unavailable / mock fallback'}
            </div>
            <div className="mt-1 font-mono text-xs leading-5 text-muted">Model route: /api/revise-draft</div>
          </div>
          <div className="u-well">
            <div className="u-kicker">Jira</div>
            <div className="mt-2 font-display text-sm leading-6 text-text">Jira reads: not connected</div>
            <div className="mt-1 font-mono text-xs leading-5 text-muted">Jira writes: disabled</div>
          </div>
          <div className="u-well">
            <div className="u-kicker">Approval guardrail</div>
            <div className="mt-2 font-display text-sm leading-6 text-text">approval only updates local state</div>
            <div className="mt-1 font-mono text-xs leading-5 text-muted">
              {projectDefaults.executedActionsWithoutApproval} actions executed without approval
            </div>
          </div>
        </div>
      </section>

      <section className="u-card">
        <div className="u-kicker">REVISION MODEL STATUS</div>
        <div className="mt-4 rounded-px bg-surface px-4 py-3 shadow-inset">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-display text-sm leading-6 text-text">
                {modelStatus.provider} · {modelStatus.model}
              </div>
              <div className="mt-1 font-mono text-xs leading-5 text-muted">{modelStatus.detail}</div>
            </div>
            <span className="u-badge">
              <span
                className="u-badge__dot"
                style={{ background: modelStatus.available ? 'rgb(var(--positive) / 1)' : 'rgb(var(--accent-2) / 1)' }}
              />
              {modelStatus.available ? 'configured' : 'fallback mode'}
            </span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="u-kicker">API key configured</div>
              <div className="mt-2 font-mono text-xs leading-6 text-text">{modelStatus.available ? 'yes' : 'no'}</div>
            </div>
            <div>
              <div className="u-kicker">Auth source</div>
              <div className="mt-2 font-mono text-xs leading-6 text-text">{modelStatus.authSource}</div>
            </div>
            <div>
              <div className="u-kicker">Base URL</div>
              <div className="mt-2 font-mono text-xs leading-6 text-text">{modelStatus.baseUrl}</div>
            </div>
            <div>
              <div className="u-kicker">Scope</div>
              <div className="mt-2 font-mono text-xs leading-6 text-text">draft revision only</div>
            </div>
          </div>
        </div>
      </section>

      <section className="u-card">
        <div className="u-kicker">ASK ANALYSIS MODEL STATUS</div>
        <div className="mt-4 rounded-px bg-surface px-4 py-3 shadow-inset">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-display text-sm leading-6 text-text">
                {askModelStatus.provider} · {askModelStatus.model}
              </div>
              <div className="mt-1 font-mono text-xs leading-5 text-muted">Model route: /api/pm-assistant/analyze</div>
            </div>
            <span className="u-badge">
              <span
                className="u-badge__dot"
                style={{ background: askModelStatus.enabled ? 'rgb(var(--positive) / 1)' : 'rgb(var(--accent-2) / 1)' }}
              />
              {askModelStatus.enabled ? 'model-backed' : 'fallback mode'}
            </span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="u-kicker">API key configured</div>
              <div className="mt-2 font-mono text-xs leading-6 text-text">{askModelStatus.enabled ? 'yes' : 'no'}</div>
            </div>
            <div>
              <div className="u-kicker">Auth source</div>
              <div className="mt-2 font-mono text-xs leading-6 text-text">{askModelStatus.authSource}</div>
            </div>
            <div>
              <div className="u-kicker">Base URL</div>
              <div className="mt-2 font-mono text-xs leading-6 text-text">{askModelStatus.baseUrl}</div>
            </div>
            <div>
              <div className="u-kicker">Guardrail</div>
              <div className="mt-2 font-mono text-xs leading-6 text-text">Jira writes disabled · local approval only</div>
            </div>
          </div>
          <div className="mt-3 font-mono text-xs leading-5 text-muted">{askModelStatus.detail}</div>
        </div>
      </section>

      <section className="u-card">
        <div className="u-kicker">AUTOMATION POLICY</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="u-well">
            <div className="u-kicker">Safe auto enabled</div>
            <div className="mt-2 space-y-1 font-mono text-xs leading-6 text-text">
              <div>- scan</div>
              <div>- detect</div>
              <div>- draft</div>
            </div>
          </div>
          <div className="u-well">
            <div className="u-kicker">Approval required</div>
            <div className="mt-2 space-y-1 font-mono text-xs leading-6 text-text">
              <div>- write actions</div>
              <div>- ticket creation</div>
              <div>- owner assignment</div>
            </div>
          </div>
          <div className="u-well">
            <div className="u-kicker">Blocked actions</div>
            <div className="mt-2 space-y-1 font-mono text-xs leading-6 text-text">
              <div>- create_issue</div>
              <div>- post_comment</div>
              <div>- move_ticket</div>
              <div>- change_priority</div>
              <div>- assign_owner</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
