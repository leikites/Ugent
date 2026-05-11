import { projectDefaults } from '../amigoMock'
import { getRevisionModelStatus } from '../../lib/revisionModel'

export default async function SettingsPage() {
  const modelStatus = getRevisionModelStatus()

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
        <div className="u-kicker">JIRA READ-ONLY CONNECTION</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="u-kicker">Base URL</div>
            <input className="u-input mt-2" placeholder="https://your-domain.atlassian.net" />
          </div>
          <div>
            <div className="u-kicker">Auth</div>
            <input className="u-input mt-2" placeholder="(read-only) token not stored" />
          </div>
          <div className="sm:col-span-2">
            <div className="u-kicker">Mode</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="u-badge">
                <span className="u-badge__dot" style={{ background: 'rgb(var(--muted) / 1)' }} />
                read-only
              </span>
              <span className="u-badge">
                <span className="u-badge__dot" style={{ background: 'rgb(var(--muted) / 1)' }} />
                no writes
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="u-card">
        <div className="u-kicker">PROJECT DEFAULTS</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="u-kicker">Project key</div>
            <input className="u-input mt-2" defaultValue={projectDefaults.projectKey} />
          </div>
          <div>
            <div className="u-kicker">Timezone</div>
            <input className="u-input mt-2" placeholder="Asia/Taipei" />
          </div>
        </div>
      </section>

      <section className="u-card">
        <div className="u-kicker">APPROVAL GATES</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-px bg-surface2 px-4 py-3 shadow-inset">
            <div className="font-display text-sm leading-6 text-text">All high-impact actions require approval</div>
            <div className="mt-1 font-mono text-xs leading-5 text-muted">enabled</div>
          </div>
          <div className="rounded-px bg-surface2 px-4 py-3 shadow-inset">
            <div className="font-display text-sm leading-6 text-text">Execute without approval</div>
            <div className="mt-1 font-mono text-xs leading-5 text-muted">disabled</div>
          </div>
        </div>
        <div className="mt-4 rounded-px bg-surface px-4 py-3 shadow-inset">
          <div className="u-kicker">GUARDRAIL</div>
          <div className="mt-2 font-display text-sm leading-6 text-text">
            {projectDefaults.executedActionsWithoutApproval} actions executed without approval
          </div>
        </div>
      </section>

      <section className="u-card">
        <div className="u-kicker">MODEL PROFILE</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="u-kicker">Assistant profile</div>
            <input className="u-input mt-2" placeholder="PM assistant (draft-first)" />
          </div>
          <div>
            <div className="u-kicker">Output mode</div>
            <input className="u-input mt-2" placeholder="structured review item + draft reply/action" />
          </div>
        </div>
        <div className="mt-4 rounded-px bg-surface px-4 py-3 shadow-inset">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="u-kicker">REVISION MODEL STATUS</div>
              <div className="mt-2 font-display text-sm leading-6 text-text">
                {modelStatus.provider} · {modelStatus.model}
              </div>
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
              <div className="u-kicker">Base URL</div>
              <div className="mt-2 font-mono text-xs leading-6 text-text">{modelStatus.baseUrl}</div>
            </div>
            <div>
              <div className="u-kicker">Auth Source</div>
              <div className="mt-2 font-mono text-xs leading-6 text-text">{modelStatus.authSource}</div>
            </div>
            <div>
              <div className="u-kicker">Scope</div>
              <div className="mt-2 font-mono text-xs leading-6 text-text">draft revision only</div>
            </div>
            <div>
              <div className="u-kicker">Guardrail</div>
              <div className="mt-2 font-mono text-xs leading-6 text-text">Jira writes disabled · local approval only</div>
            </div>
          </div>
          <div className="mt-3 font-mono text-xs leading-5 text-muted">{modelStatus.detail}</div>
        </div>
      </section>

      <section className="u-card">
        <div className="u-kicker">WORKER SCHEDULE</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <div className="u-kicker">Cadence</div>
            <input className="u-input mt-2" placeholder="every 30 minutes" />
          </div>
          <div>
            <div className="u-kicker">Quiet hours</div>
            <input className="u-input mt-2" placeholder="00:00 - 08:00" />
          </div>
        </div>
      </section>

      <section className="u-card u-card--soft">
        <div className="u-kicker">DISABLED WRITE ACTIONS</div>
        <div className="mt-4 grid gap-2">
          {['create_issue', 'edit_issue', 'post_comment', 'set_priority', 'move_sprint', 'assign_owner'].map((a) => (
            <div key={a} className="rounded-px bg-surface px-4 py-3 shadow-inset">
              <div className="font-mono text-xs leading-6 text-text">{a}</div>
              <div className="mt-1 font-mono text-xs leading-5 text-muted">disabled (draft only)</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
