import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, PencilLine, Trash2 } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SurfaceCard from '@/components/SurfaceCard'
import StatusBadge from '@/components/StatusBadge'
import SkillFormModal, { type SkillFormValue } from '@/components/skills/SkillFormModal'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useCatalogStore } from '@/stores/useCatalogStore'
import type { Skill } from '@/types/domain'

export default function SkillDetail() {
  const { t, i18n } = useTranslation()
  const token = useAuthStore((s) => s.session?.access_token ?? '')
  const { skillId = '' } = useParams()

  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId)
  const workspaces = useWorkspaceStore((s) => s.workspaces)

  const status = useCatalogStore((s) => s.status)
  const load = useCatalogStore((s) => s.load)
  const skillsGlobal = useCatalogStore((s) => s.skillsGlobal)
  const skillsWorkspace = useCatalogStore((s) => s.skillsWorkspace)
  const skillsAgent = useCatalogStore((s) => s.skillsAgent)
  const agents = useCatalogStore((s) => s.agentInstances)
  const updateSkill = useCatalogStore((s) => s.updateSkill)
  const removeSkill = useCatalogStore((s) => s.removeSkill)

  const [editOpen, setEditOpen] = useState(false)

  useEffect(() => {
    if (!token || !selectedWorkspaceId) return
    if (status === 'idle' || useCatalogStore.getState().workspaceId !== selectedWorkspaceId) {
      void load(token, selectedWorkspaceId)
    }
  }, [load, selectedWorkspaceId, status, token])

  const skill: Skill | null = useMemo(() => {
    const all = [...skillsGlobal, ...skillsWorkspace, ...skillsAgent]
    return all.find((s) => s.id === skillId) ?? null
  }, [skillId, skillsAgent, skillsGlobal, skillsWorkspace])

  const workspaceName = useMemo(() => {
    if (!skill) return ''
    const owner = skill.owner
    if (!('workspaceId' in owner)) return ''
    return workspaces.find((w) => w.id === owner.workspaceId)?.name ?? ''
  }, [skill, workspaces])

  const agentName = useMemo(() => {
    if (!skill) return ''
    const owner = skill.owner
    if (!('agentId' in owner)) return ''
    return agents.find((a) => a.id === owner.agentId)?.name ?? ''
  }, [agents, skill])

  const usedByAgents = useMemo(() => {
    if (!skill) return []
    return agents
      .filter((a) => a.skillBindings.some((b) => b.skillId === skill.id))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [agents, skill])

  const formatDateTime = useMemo(() => {
    const locale = i18n.resolvedLanguage ?? 'zh-CN'
    const dtf = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
    return (value: string) => dtf.format(new Date(value))
  }, [i18n.resolvedLanguage])

  const ownerLabel = useMemo(() => {
    if (!skill) return '-'
    if (skill.owner.type === 'tenant') return t('skills.owner.tenant')
    if (skill.owner.type === 'workspace') return workspaceName || skill.owner.workspaceId
    return agentName ? `${agentName} · ${workspaceName}` : skill.owner.agentId
  }, [agentName, skill, t, workspaceName])

  const canEdit = Boolean(skill && !skill.archivedAt)

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={skill ? skill.name : t('skills.detailTitle')}
        subtitle={skill ? `${t('skills.detailSubtitle')} · ${t(`skills.scope.${skill.scope}`)}` : t('common.loading')}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to="/app/skills"
              className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            >
              {t('skills.backToLibrary')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              disabled={!canEdit}
              className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
              onClick={() => setEditOpen(true)}
            >
              <PencilLine className="h-4 w-4" />
              {t('common.edit')}
            </button>
            <button
              type="button"
              disabled={!canEdit}
              className="inline-flex h-9 items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/15 disabled:opacity-60 dark:text-rose-300"
              onClick={async () => {
                if (!token || !skill) return
                const ok = window.confirm(t('skills.deleteConfirm'))
                if (!ok) return
                await removeSkill(token, skill.id)
              }}
            >
              <Trash2 className="h-4 w-4" />
              {t('common.delete')}
            </button>
          </div>
        }
      />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('skills.metaTitle')}</div>
            {skill ? (
              <div className="flex items-center gap-2">
                <StatusBadge label={t(`skills.scope.${skill.scope}`)} tone={skill.scope === 'agent' ? 'info' : 'neutral'} />
                <StatusBadge label={skill.enabled ? t('common.enabled') : t('common.disabled')} tone={skill.enabled ? 'success' : 'neutral'} />
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('skills.fields.description')}</div>
              <div className="mt-2 text-sm text-slate-900 dark:text-slate-100">{skill?.description ?? '-'}</div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('skills.fields.owner')}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{ownerLabel}</div>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('skills.fields.updatedAt')}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {skill ? formatDateTime(skill.updatedAt) : '-'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('skills.fields.kind')}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {skill ? t(`skills.kind.${skill.kind}`, { defaultValue: skill.kind }) : '-'}
                </div>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('skills.fields.version')}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{skill?.version ?? '-'}</div>
              </div>
              <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="text-xs text-slate-500 dark:text-slate-400">{t('skills.fields.sourceType')}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{skill?.source.type ?? '-'}</div>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('skills.usageTitle')}</div>
            <StatusBadge label={String(usedByAgents.length)} tone={usedByAgents.length ? 'info' : 'neutral'} />
          </div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('skills.usageHint')}</div>

          <div className="mt-4 grid gap-2">
            {usedByAgents.map((a) => (
              <Link
                key={a.id}
                to={`/app/agents/instances/${a.id}`}
                className="rounded-2xl border border-black/5 bg-white/60 p-3 text-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 truncate font-medium text-slate-900 dark:text-slate-100">{a.name}</div>
                  <StatusBadge label={a.enabled ? t('agents.enabled') : t('agents.disabled')} tone={a.enabled ? 'success' : 'neutral'} />
                </div>
                <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">{a.summary}</div>
              </Link>
            ))}
            {usedByAgents.length === 0 ? (
              <div className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                {t('skills.usageEmpty')}
              </div>
            ) : null}
          </div>
        </SurfaceCard>
      </div>

      <SurfaceCard className="mt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('skills.contentTitle')}</div>
          {skill ? <StatusBadge label={`${t('skills.fields.sourceRef')}: ${skill.source.ref ?? '-'}`} tone="neutral" /> : null}
        </div>
        <div className="mt-4 rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono text-xs text-slate-800 dark:text-slate-100">
            {skill?.content.text ?? '-'}
          </pre>
        </div>
      </SurfaceCard>

      <SkillFormModal
        open={editOpen}
        mode="edit"
        initial={skill}
        workspaces={workspaces}
        agents={agents}
        defaultScope="global"
        defaultWorkspaceId={selectedWorkspaceId}
        onClose={() => setEditOpen(false)}
        onSubmit={async (value: SkillFormValue) => {
          if (!token || !skill) return false
          return updateSkill(token, skill.id, {
            name: value.name,
            kind: value.kind,
            description: value.description,
            version: value.version,
            enabled: value.enabled,
            contentText: value.contentText,
            source: value.source,
          })
        }}
      />
    </div>
  )
}
