import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageHeader from '@/components/PageHeader'
import SurfaceCard from '@/components/SurfaceCard'
import StatusBadge from '@/components/StatusBadge'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useCatalogStore } from '@/stores/useCatalogStore'

export default function AgentTemplateDetail() {
  const { t } = useTranslation()
  const token = useAuthStore((s) => s.session?.access_token ?? '')
  const { templateId = '' } = useParams()

  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId)
  const status = useCatalogStore((s) => s.status)
  const load = useCatalogStore((s) => s.load)
  const systemTemplates = useCatalogStore((s) => s.systemTemplates)
  const customTemplates = useCatalogStore((s) => s.customTemplates)
  const skillsGlobal = useCatalogStore((s) => s.skillsGlobal)
  const skillsWorkspace = useCatalogStore((s) => s.skillsWorkspace)

  useEffect(() => {
    if (!token || !selectedWorkspaceId) return
    if (status === 'idle' || useCatalogStore.getState().workspaceId !== selectedWorkspaceId) {
      void load(token, selectedWorkspaceId)
    }
  }, [load, selectedWorkspaceId, status, token])

  const template = useMemo(() => {
    return [...systemTemplates, ...customTemplates].find((x) => x.id === templateId) ?? null
  }, [customTemplates, systemTemplates, templateId])

  const recommended = useMemo(() => {
    const map = new Map([...skillsGlobal, ...skillsWorkspace].map((s) => [s.id, s]))
    return (template?.recommendedSkillIds ?? []).map((id) => map.get(id)).filter(Boolean)
  }, [skillsGlobal, skillsWorkspace, template])

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={template ? template.name : t('agents.templateDetailTitle')}
        subtitle={template ? template.summary : t('common.loading')}
      />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('agents.templateDefinition')}</div>
            <StatusBadge
              label={
                template?.scope === 'system' ? t('agents.badge.system') : template?.scope === 'custom' ? t('agents.badge.custom') : t('common.loading')
              }
              tone={template?.scope === 'system' ? 'info' : 'neutral'}
            />
          </div>
          <div className="mt-3 grid gap-3">
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              {t('agents.templateDefinitionHint')}
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('agents.fields.responsibilities')}</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{template?.responsibilities ?? ''}</div>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('agents.defaultPrompt')}</div>
              <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{template?.defaultPrompt ?? ''}</div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('agents.recommendedSkills')}</div>
            <StatusBadge label={`${recommended.length}`} tone="neutral" />
          </div>
          <div className="mt-4 grid gap-2">
            {recommended.map((s) => (
              <div key={s.id} className="rounded-2xl border border-black/5 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{s.name}</div>
                  <StatusBadge label={t(`skills.kind.${s.kind}`, { defaultValue: s.kind })} tone="neutral" />
                </div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{s.description}</div>
              </div>
            ))}
            {recommended.length === 0 ? (
              <div className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                {t('agents.noRecommendedSkills')}
              </div>
            ) : null}
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}
