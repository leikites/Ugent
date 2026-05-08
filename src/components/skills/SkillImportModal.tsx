import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileUp, Puzzle } from 'lucide-react'
import type { AgentInstance, Id, Skill, Workspace } from '@/types/domain'
import StatusBadge from '@/components/StatusBadge'
import type { SkillFormValue } from '@/components/skills/SkillFormModal'

type ImportKind = 'skill' | 'mcp'

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function baseName(filename: string) {
  const last = filename.split('/').pop() ?? filename
  const dot = last.lastIndexOf('.')
  return dot > 0 ? last.slice(0, dot) : last
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return Boolean(x) && typeof x === 'object' && !Array.isArray(x)
}

function normalizeText(v: unknown) {
  return String(v ?? '').trim()
}

function toSkillKind(v: unknown): Skill['kind'] | null {
  const s = normalizeText(v)
  if (s === 'prompt' || s === 'checklist' || s === 'format' || s === 'tool') return s
  return null
}

function toScope(v: unknown): SkillFormValue['scope'] | null {
  const s = normalizeText(v)
  if (s === 'global' || s === 'workspace' || s === 'agent') return s
  return null
}

function extractTextContent(v: unknown): string {
  if (typeof v === 'string') return v
  if (isRecord(v) && typeof v.text === 'string') return v.text
  return ''
}

function guessMcpConfig(obj: unknown): Record<string, unknown> | null {
  if (!isRecord(obj)) return null
  const hasCommand = typeof obj.command === 'string'
  const hasArgs = Array.isArray(obj.args)
  const hasTransport = typeof obj.transport === 'string'
  const hasServers = isRecord(obj.mcpServers)
  if (hasServers || hasCommand || hasArgs || hasTransport) return obj
  return null
}

export default function SkillImportModal(props: {
  open: boolean
  workspaces: Workspace[]
  agents: AgentInstance[]
  defaultScope: 'global' | 'workspace' | 'agent'
  defaultWorkspaceId?: Id | null
  onClose: () => void
  onImport: (value: SkillFormValue) => Promise<boolean>
}) {
  const { t } = useTranslation()
  const { open, workspaces, agents, defaultScope, defaultWorkspaceId, onClose, onImport } = props

  const [kind, setKind] = useState<ImportKind>('skill')
  const [fileName, setFileName] = useState('')
  const [raw, setRaw] = useState('')
  const [error, setError] = useState<string | null>(null)

  const [scope, setScope] = useState<SkillFormValue['scope']>('global')
  const [workspaceId, setWorkspaceId] = useState<Id>('')
  const [agentId, setAgentId] = useState<Id>('')
  const [name, setName] = useState('')
  const [skillKind, setSkillKind] = useState<Skill['kind']>('prompt')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState('0.1.0')
  const [enabled, setEnabled] = useState(true)
  const [contentText, setContentText] = useState('')

  const sortedWorkspaces = useMemo(() => workspaces.slice().sort((a, b) => a.name.localeCompare(b.name)), [workspaces])
  const agentsByWorkspace = useMemo(() => {
    const m = new Map<Id, AgentInstance[]>()
    for (const a of agents) {
      const cur = m.get(a.workspaceId) ?? []
      cur.push(a)
      m.set(a.workspaceId, cur)
    }
    for (const [, v] of m.entries()) v.sort((a, b) => a.name.localeCompare(b.name))
    return m
  }, [agents])

  useEffect(() => {
    if (!open) return
    setKind('skill')
    setFileName('')
    setRaw('')
    setError(null)

    setScope(defaultScope)
    const ws = defaultWorkspaceId ?? sortedWorkspaces[0]?.id ?? ''
    setWorkspaceId(ws)
    setAgentId(agentsByWorkspace.get(ws)?.[0]?.id ?? '')
    setName('')
    setSkillKind('prompt')
    setDescription('')
    setVersion('0.1.0')
    setEnabled(true)
    setContentText('')
  }, [agentsByWorkspace, defaultScope, defaultWorkspaceId, open, sortedWorkspaces])

  useEffect(() => {
    if (!open) return
    if (scope !== 'agent') return
    const list = agentsByWorkspace.get(workspaceId) ?? []
    if (list.length === 0) {
      setAgentId('')
      return
    }
    if (!list.some((a) => a.id === agentId)) setAgentId(list[0].id)
  }, [agentId, agentsByWorkspace, open, scope, workspaceId])

  const agentOptions = scope === 'agent' ? agentsByWorkspace.get(workspaceId) ?? [] : []

  const canImport = Boolean(name.trim() && description.trim() && contentText.trim() && version.trim() && (scope !== 'agent' || agentId))

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-slate-950">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('skills.importLocalTitle')}</div>
          <StatusBadge label={kind === 'mcp' ? 'MCP' : t('skills.importLocalSkill')} tone={kind === 'mcp' ? 'info' : 'neutral'} />
        </div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('skills.importLocalHint')}</div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setKind('skill')
              setError(null)
              setSkillKind('prompt')
            }}
            className={
              kind === 'skill'
                ? 'inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-900'
                : 'inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10'
            }
          >
            <FileUp className="h-4 w-4" />
            {t('skills.importLocalSkill')}
          </button>
          <button
            type="button"
            onClick={() => {
              setKind('mcp')
              setError(null)
              setSkillKind('tool')
              setDescription(t('skills.importLocalMcpDefaultDesc'))
            }}
            className={
              kind === 'mcp'
                ? 'inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-900'
                : 'inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10'
            }
          >
            <Puzzle className="h-4 w-4" />
            {t('skills.importLocalMcp')}
          </button>
        </div>

        <div className="mt-4 grid gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('skills.fields.scope')}</div>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as SkillFormValue['scope'])}
                className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
              >
                <option value="global">{t('skills.scope.global')}</option>
                <option value="workspace">{t('skills.scope.workspace')}</option>
                <option value="agent">{t('skills.scope.agent')}</option>
              </select>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('skills.fields.owner')}</div>
              <select
                value={workspaceId}
                disabled={scope === 'global' || sortedWorkspaces.length === 0}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 disabled:opacity-60 dark:border-white/10 dark:bg-white/5"
              >
                {scope === 'global' ? <option value="">{t('skills.owner.tenant')}</option> : null}
                {scope !== 'global'
                  ? sortedWorkspaces.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))
                  : null}
              </select>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('skills.fields.agent')}</div>
              <select
                value={agentId}
                disabled={scope !== 'agent'}
                onChange={(e) => setAgentId(e.target.value)}
                className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 disabled:opacity-60 dark:border-white/10 dark:bg-white/5"
              >
                {scope !== 'agent' ? <option value="">-</option> : null}
                {scope === 'agent'
                  ? agentOptions.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))
                  : null}
              </select>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('skills.importLocalFile')}</div>
            <input
              type="file"
              accept={kind === 'mcp' ? '.json,application/json' : '.json,.md,.txt,application/json,text/plain,text/markdown'}
              className="mt-2 block w-full text-sm text-slate-700 file:mr-3 file:rounded-2xl file:border file:border-black/10 file:bg-white/80 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-slate-800 dark:text-slate-200 dark:file:border-white/10 dark:file:bg-white/5 dark:file:text-slate-100"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (!f) return
                setError(null)
                setFileName(f.name)
                const text = await f.text()
                setRaw(text)

                const json = safeJsonParse(text)
                const inferredBase = baseName(f.name)

                if (kind === 'mcp') {
                  const cfg = guessMcpConfig(json)
                  if (!cfg) {
                    setError(t('skills.importLocalMcpInvalid'))
                    setName(inferredBase)
                    setSkillKind('tool')
                    setContentText(text.trim())
                    return
                  }
                  const maybeName = normalizeText(cfg.name ?? cfg.serverName ?? '')
                  setName(maybeName || inferredBase)
                  setSkillKind('tool')
                  setVersion(normalizeText(cfg.version) || '0.1.0')
                  setEnabled(true)
                  setDescription(t('skills.importLocalMcpDefaultDesc'))
                  setContentText(JSON.stringify(cfg, null, 2))
                  return
                }

                if (isRecord(json)) {
                  const scopeFromFile = toScope(json.scope)
                  const kindFromFile = toSkillKind(json.kind)
                  const contentFromFile = extractTextContent(json.content ?? json.contentText ?? json.text)

                  setName(normalizeText(json.name) || inferredBase)
                  setDescription(normalizeText(json.description) || t('skills.importLocalSkillDefaultDesc'))
                  setVersion(normalizeText(json.version) || '0.1.0')
                  setEnabled(typeof json.enabled === 'boolean' ? json.enabled : true)
                  setSkillKind(kindFromFile ?? 'prompt')
                  setScope(scopeFromFile ?? defaultScope)
                  setContentText(contentFromFile || text.trim())
                  return
                }

                setName(inferredBase)
                setDescription(t('skills.importLocalSkillDefaultDesc'))
                setVersion('0.1.0')
                setEnabled(true)
                setSkillKind('prompt')
                setContentText(text.trim())
              }}
            />
            {fileName ? <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('skills.importLocalSelected', { name: fileName })}</div> : null}
            {error ? <div className="mt-2 text-xs font-semibold text-rose-700 dark:text-rose-300">{error}</div> : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('skills.fields.name')}</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                placeholder={t('skills.fields.namePlaceholder')}
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('skills.fields.kind')}</div>
              <select
                value={skillKind}
                disabled={kind === 'mcp'}
                onChange={(e) => setSkillKind(e.target.value as Skill['kind'])}
                className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 disabled:opacity-60 dark:border-white/10 dark:bg-white/5"
              >
                <option value="prompt">{t('skills.kind.prompt')}</option>
                <option value="checklist">{t('skills.kind.checklist')}</option>
                <option value="format">{t('skills.kind.format')}</option>
                <option value="tool">{t('skills.kind.tool')}</option>
              </select>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('skills.fields.description')}</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
              placeholder={t('skills.fields.descriptionPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('skills.fields.version')}</div>
              <input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                placeholder="0.1.0"
              />
            </div>
            <div className="flex items-end justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border border-black/20"
                />
                {t('skills.fields.enabled')}
              </label>
              <StatusBadge label="local" tone="neutral" />
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('skills.fields.content')}</div>
            <textarea
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              rows={8}
              className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-white px-3 py-2 font-mono text-xs outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
              placeholder={t('skills.fields.contentPlaceholder')}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            onClick={onClose}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={!canImport}
            className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            onClick={async () => {
              const sourceRef = fileName ? fileName : kind === 'mcp' ? 'mcp' : 'local'
              const ok = await onImport({
                scope,
                workspaceId: scope === 'global' ? undefined : workspaceId,
                agentId: scope === 'agent' ? agentId : undefined,
                name,
                kind: kind === 'mcp' ? 'tool' : skillKind,
                description,
                version,
                enabled,
                source: { type: 'local', ref: sourceRef },
                contentText: contentText.trim() ? contentText.trim() : raw,
              })
              if (ok) onClose()
            }}
          >
            {t('skills.importLocalConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}

