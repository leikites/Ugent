import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AgentInstance, Id, Skill } from '@/types/domain'
import StatusBadge from '@/components/StatusBadge'

export default function AgentSkillBindingsModal(props: {
  open: boolean
  agent: AgentInstance
  skills: Skill[]
  onClose: () => void
  onSubmit: (skillIds: Id[]) => Promise<boolean>
}) {
  const { t } = useTranslation()
  const { open, agent, skills, onClose, onSubmit } = props

  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Id[]>([])

  useEffect(() => {
    if (!open) return
    setSelected(agent.skillBindings.map((b) => b.skillId))
    setQuery('')
  }, [agent.skillBindings, open])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = skills.filter((s) => !s.archivedAt)
    if (!q) return rows
    return rows.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.kind.toLowerCase().includes(q))
  }, [query, skills])

  const grouped = useMemo(() => {
    return {
      agent: filtered.filter((s) => s.scope === 'agent'),
      workspace: filtered.filter((s) => s.scope === 'workspace'),
      global: filtered.filter((s) => s.scope === 'global'),
    }
  }, [filtered])

  const toggle = (skillId: Id, checked: boolean) => {
    setSelected((cur) => {
      if (checked) return Array.from(new Set([...cur, skillId]))
      return cur.filter((id) => id !== skillId)
    })
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-slate-950">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('skills.manageBindingsTitle')}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('skills.manageBindingsHint', { agent: agent.name })}</div>
          </div>
          <StatusBadge label={`${t('skills.boundCount')}: ${selected.length}`} tone="neutral" />
        </div>

        <div className="mt-4 grid gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
            placeholder={t('common.search')}
          />

          <div className="grid gap-3">
            {(['agent', 'workspace', 'global'] as const).map((scope) => (
              <div key={scope} className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t(`skills.scope.${scope}`)}</div>
                  <StatusBadge label={String(grouped[scope].length)} tone={scope === 'agent' ? 'info' : 'neutral'} />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {grouped[scope].map((s) => {
                    const checked = selected.includes(s.id)
                    return (
                      <label
                        key={s.id}
                        className="flex items-start gap-2 rounded-2xl border border-black/5 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/5"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => toggle(s.id, e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border border-black/20"
                        />
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="truncate font-medium text-slate-900 dark:text-slate-100">{s.name}</span>
                            <StatusBadge label={t(`skills.kind.${s.kind}`, { defaultValue: s.kind })} tone="neutral" />
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-slate-600 dark:text-slate-300">{s.description}</span>
                        </span>
                      </label>
                    )
                  })}
                  {grouped[scope].length === 0 ? (
                    <div className="text-sm text-slate-600 dark:text-slate-300">{t('skills.empty')}</div>
                  ) : null}
                </div>
              </div>
            ))}
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
            onClick={async () => {
              const ok = await onSubmit(selected)
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

