import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function CreateWorkflowModal(props: {
  open: boolean
  onClose: () => void
  onStartBuild: (value: { name: string; description: string }) => void
}) {
  const { t } = useTranslation()
  const { open, onClose, onStartBuild } = props

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  useEffect(() => {
    if (!open) return
    setName('')
    setDesc('')
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-slate-950">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workflows.createTitle')}</div>
        <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('workflows.createHint')}</div>

        <div className="mt-4 grid gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('workflows.fields.name')}</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
              placeholder={t('workflows.fields.namePlaceholder')}
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('workflows.fields.description')}</div>
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
              placeholder={t('workflows.fields.descriptionPlaceholder')}
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
            className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            disabled={!name.trim() || !desc.trim()}
            onClick={() => onStartBuild({ name, description: desc })}
          >
            {t('workflows.startBuild')}
          </button>
        </div>
      </div>
    </div>
  )
}

