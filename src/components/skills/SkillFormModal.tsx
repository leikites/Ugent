import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AgentInstance, Id, Skill, Workspace } from '@/types/domain'
import StatusBadge from '@/components/StatusBadge'

export type SkillFormValue = {
  scope: 'global' | 'workspace' | 'agent'
  workspaceId?: Id
  agentId?: Id
  name: string
  kind: Skill['kind']
  description: string
  version: string
  enabled: boolean
  source: Skill['source']
  contentText: string
}

export default function SkillFormModal(props: {
  open: boolean
  mode: 'create' | 'edit'
  initial?: Skill | null
  workspaces: Workspace[]
  agents: AgentInstance[]
  defaultScope: 'global' | 'workspace' | 'agent'
  defaultWorkspaceId?: Id | null
  onClose: () => void
  onSubmit: (value: SkillFormValue) => Promise<boolean>
}) {
  const { t } = useTranslation()
  const { open, mode, initial, workspaces, agents, defaultScope, defaultWorkspaceId, onClose, onSubmit } = props

  const [scope, setScope] = useState<SkillFormValue['scope']>('global')
  const [workspaceId, setWorkspaceId] = useState<Id>('')
  const [agentId, setAgentId] = useState<Id>('')
  const [name, setName] = useState('')
  const [kind, setKind] = useState<Skill['kind']>('prompt')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState('0.1.0')
  const [enabled, setEnabled] = useState(true)
  const [sourceType, setSourceType] = useState<Skill['source']['type']>('user')
  const [sourceRef, setSourceRef] = useState<string>('')
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

    if (mode === 'edit' && initial) {
      setScope(initial.scope)
      setWorkspaceId(initial.owner.type === 'workspace' || initial.owner.type === 'agent' ? initial.owner.workspaceId : '')
      setAgentId(initial.owner.type === 'agent' ? initial.owner.agentId : '')
      setName(initial.name)
      setKind(initial.kind)
      setDescription(initial.description)
      setVersion(initial.version)
      setEnabled(initial.enabled)
      setSourceType(initial.source.type)
      setSourceRef(initial.source.ref ?? '')
      setContentText(initial.content.text)
      return
    }

    setScope(defaultScope)
    const ws = defaultWorkspaceId ?? sortedWorkspaces[0]?.id ?? ''
    setWorkspaceId(ws)
    setAgentId(agentsByWorkspace.get(ws)?.[0]?.id ?? '')
    setName('')
    setKind('prompt')
    setDescription('')
    setVersion('0.1.0')
    setEnabled(true)
    setSourceType('user')
    setSourceRef('')
    setContentText('')
  }, [agentsByWorkspace, defaultScope, defaultWorkspaceId, initial, mode, open, sortedWorkspaces])

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

  const title = mode === 'edit' ? t('skills.editTitle') : t('skills.createTitle')
  const canSubmit = Boolean(name.trim() && description.trim() && contentText.trim() && version.trim())

  const agentOptions = scope === 'agent' ? agentsByWorkspace.get(workspaceId) ?? [] : []

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-slate-950">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
          <StatusBadge label={t(`skills.scope.${scope}`)} tone={scope === 'agent' ? 'info' : 'neutral'} />
        </div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('skills.formHint')}</div>

        <div className="mt-4 grid gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('skills.fields.scope')}</div>
              <select
                value={scope}
                disabled={mode === 'edit'}
                onChange={(e) => setScope(e.target.value as SkillFormValue['scope'])}
                className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 disabled:opacity-60 dark:border-white/10 dark:bg-white/5"
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
                disabled={mode === 'edit' || scope === 'global' || sortedWorkspaces.length === 0}
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
                disabled={mode === 'edit' || scope !== 'agent'}
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
                value={kind}
                onChange={(e) => setKind(e.target.value as Skill['kind'])}
                className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
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
              <StatusBadge label={sourceType} tone="neutral" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('skills.fields.sourceType')}</div>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as Skill['source']['type'])}
                className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
              >
                <option value="user">user</option>
                <option value="system">system</option>
                <option value="github">github</option>
                <option value="local">local</option>
              </select>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('skills.fields.sourceRef')}</div>
              <input
                value={sourceRef}
                onChange={(e) => setSourceRef(e.target.value)}
                className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                placeholder={t('skills.fields.sourceRefPlaceholder')}
              />
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
            disabled={!canSubmit || (scope === 'agent' && !agentId)}
            className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            onClick={async () => {
              const ok = await onSubmit({
                scope,
                workspaceId: scope === 'global' ? undefined : workspaceId,
                agentId: scope === 'agent' ? agentId : undefined,
                name,
                kind,
                description,
                version,
                enabled,
                source: { type: sourceType, ref: sourceRef.trim() ? sourceRef.trim() : null },
                contentText,
              })
              if (ok) onClose()
            }}
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
