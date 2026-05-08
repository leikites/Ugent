import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AgentTemplate, Id, Workspace } from '@/types/domain'

export type AgentInstanceFormValue = {
  workspaceId: Id
  templateId: Id | null
  name: string
  summary: string
  status: 'active' | 'inactive' | 'draft'
}

export default function AgentInstanceFormModal(props: {
  open: boolean
  workspaces: Workspace[]
  templates: AgentTemplate[]
  defaultWorkspaceId: Id | null
  disabled?: boolean
  onClose: () => void
  onSubmit: (value: AgentInstanceFormValue) => Promise<boolean>
}) {
  const { t } = useTranslation()
  const { open, workspaces, templates, defaultWorkspaceId, disabled, onClose, onSubmit } = props

  const [workspaceId, setWorkspaceId] = useState('')
  const [fromTemplate, setFromTemplate] = useState(true)
  const [templateId, setTemplateId] = useState('')
  const [name, setName] = useState('')
  const [summary, setSummary] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive' | 'draft'>('active')

  useEffect(() => {
    if (!open) return
    setWorkspaceId(defaultWorkspaceId ?? workspaces[0]?.id ?? '')
    setFromTemplate(true)
    setTemplateId('')
    setName('')
    setSummary('')
    setStatus('active')
  }, [defaultWorkspaceId, open, workspaces])

  const canSubmit = Boolean(
    !disabled && workspaceId && name.trim() && summary.trim() && (!fromTemplate || templateId),
  )

  const templateMap = useMemo(() => new Map(templates.map((t) => [t.id, t])), [templates])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-slate-950">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('agents.createInstanceTitle')}</div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('agents.createInstanceHint')}</div>

        <div className="mt-4 grid gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('agents.fields.workspace')}</div>
            <select
              value={workspaceId}
              onChange={(e) => setWorkspaceId(e.target.value)}
              className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input type="radio" checked={fromTemplate} onChange={() => setFromTemplate(true)} className="h-4 w-4" />
              {t('agents.fromTemplate')}
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="radio"
                checked={!fromTemplate}
                onChange={() => {
                  setFromTemplate(false)
                  setTemplateId('')
                }}
                className="h-4 w-4"
              />
              {t('agents.fromScratch')}
            </label>
          </div>

          {fromTemplate ? (
            <div>
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('agents.fields.template')}</div>
              <select
                value={templateId}
                onChange={(e) => {
                  const id = e.target.value
                  setTemplateId(id)
                  const tpl = templateMap.get(id)
                  if (tpl && !name.trim()) setName(tpl.name)
                  if (tpl && !summary.trim()) setSummary(tpl.summary)
                }}
                className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
              >
                <option value="">{t('agents.fields.templatePlaceholder')}</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.scope === 'system' ? `[${t('agents.badge.system')}]` : `[${t('agents.badge.custom')}]`} {tpl.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('agents.fields.name')}</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
              placeholder={t('agents.fields.namePlaceholder')}
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('agents.fields.summary')}</div>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
              placeholder={t('agents.fields.summaryPlaceholder')}
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('common.status')}</div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive' | 'draft')}
              className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
            >
              <option value="active">{t('agents.enabled')}</option>
              <option value="inactive">{t('agents.disabled')}</option>
              <option value="draft">{t('agents.draft')}</option>
            </select>
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
            className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            disabled={!canSubmit}
            onClick={async () => {
              const ok = await onSubmit({
                workspaceId,
                templateId: fromTemplate ? templateId : null,
                name,
                summary,
                status,
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

