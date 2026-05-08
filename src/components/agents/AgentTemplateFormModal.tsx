import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AgentTemplate, Id, Skill } from '@/types/domain'
import StatusBadge from '@/components/StatusBadge'

export type AgentTemplateFormValue = {
  name: string
  summary: string
  responsibilities: string
  defaultPrompt: string
  defaultEnabled: boolean
  recommendedSkillIds: Id[]
}

export default function AgentTemplateFormModal(props: {
  open: boolean
  mode: 'create' | 'edit'
  initial?: AgentTemplate | null
  skills: Skill[]
  onClose: () => void
  onSubmit: (value: AgentTemplateFormValue) => Promise<boolean>
}) {
  const { t } = useTranslation()
  const { open, mode, initial, skills, onClose, onSubmit } = props

  const [name, setName] = useState('')
  const [summary, setSummary] = useState('')
  const [responsibilities, setResponsibilities] = useState('')
  const [prompt, setPrompt] = useState('')
  const [defaultEnabled, setDefaultEnabled] = useState(true)
  const [skillIds, setSkillIds] = useState<Id[]>([])

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && initial) {
      setName(initial.name)
      setSummary(initial.summary)
      setResponsibilities(initial.responsibilities)
      setPrompt(initial.defaultPrompt)
      setDefaultEnabled(initial.defaultEnabled)
      setSkillIds(initial.recommendedSkillIds)
      return
    }

    setName('')
    setSummary('')
    setResponsibilities('')
    setPrompt('')
    setDefaultEnabled(true)
    setSkillIds([])
  }, [initial, mode, open])

  const canSubmit = Boolean(name.trim() && summary.trim() && responsibilities.trim() && prompt.trim())
  const title = mode === 'edit' ? t('agents.editTemplateTitle') : t('agents.createTemplateTitle')

  const skillList = useMemo(() => skills.slice().sort((a, b) => a.name.localeCompare(b.name)), [skills])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-3xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-slate-950">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('agents.templateFormHint')}</div>

        <div className="mt-4 grid gap-3">
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
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('agents.fields.responsibilities')}</div>
            <textarea
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              rows={4}
              className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
              placeholder={t('agents.fields.responsibilitiesPlaceholder')}
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('agents.defaultPrompt')}</div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={6}
              className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
              placeholder={t('agents.fields.promptPlaceholder')}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={defaultEnabled}
                onChange={(e) => setDefaultEnabled(e.target.checked)}
                className="h-4 w-4 rounded border border-black/20"
              />
              {t('agents.fields.defaultEnabled')}
            </label>
            <StatusBadge label={`${t('agents.recommendedSkills')}: ${skillIds.length}`} tone="neutral" />
          </div>

          <div className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-white/5">
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('agents.fields.recommendedSkills')}</div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {skillList.map((s) => {
                const checked = skillIds.includes(s.id)
                return (
                  <label
                    key={s.id}
                    className="flex items-start gap-2 rounded-2xl border border-black/5 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setSkillIds((cur) => {
                          if (e.target.checked) return Array.from(new Set([...cur, s.id]))
                          return cur.filter((id) => id !== s.id)
                        })
                      }}
                      className="mt-0.5 h-4 w-4 rounded border border-black/20"
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-900 dark:text-slate-100">{s.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-600 dark:text-slate-300">{s.description}</span>
                    </span>
                  </label>
                )
              })}
            </div>
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
                name,
                summary,
                responsibilities,
                defaultPrompt: prompt,
                defaultEnabled,
                recommendedSkillIds: skillIds,
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

