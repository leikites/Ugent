import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import StatusBadge from '@/components/StatusBadge'
import SurfaceCard from '@/components/SurfaceCard'
import type { AgentTemplate, Id } from '@/types/domain'

export default function CustomTemplatesPanel(props: {
  templates: AgentTemplate[]
  onEdit: (templateId: Id) => void
}) {
  const { t } = useTranslation()
  const { templates, onEdit } = props

  return (
    <SurfaceCard className="mt-4">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('agents.templates.custom')}</div>
        <StatusBadge label={`${templates.length}`} tone="neutral" />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {templates.map((tpl) => (
          <div key={tpl.id} className="rounded-3xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between gap-2">
              <Link to={`/app/agents/templates/${tpl.id}`} className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {tpl.name}
              </Link>
              <div className="flex items-center gap-2">
                <StatusBadge label={t('agents.badge.custom')} tone="neutral" />
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-2xl border border-black/10 bg-white px-3 text-xs font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                  onClick={() => onEdit(tpl.id)}
                >
                  {t('common.edit')}
                </button>
              </div>
            </div>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{tpl.summary}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge label={`${t('agents.recommendedSkills')}: ${tpl.recommendedSkillIds.length}`} />
              <StatusBadge label={tpl.defaultEnabled ? t('agents.defaultEnabled') : t('agents.defaultDisabled')} tone={tpl.defaultEnabled ? 'success' : 'neutral'} />
            </div>
          </div>
        ))}
        {templates.length === 0 ? (
          <div className="rounded-3xl border border-black/5 bg-white/60 p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            {t('agents.customEmptyHint')}
          </div>
        ) : null}
      </div>
    </SurfaceCard>
  )
}

