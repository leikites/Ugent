import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowDownUp, FileUp, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SurfaceCard from '@/components/SurfaceCard'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import SkillFormModal, { type SkillFormValue } from '@/components/skills/SkillFormModal'
import SkillImportModal from '@/components/skills/SkillImportModal'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { useCatalogStore } from '@/stores/useCatalogStore'
import type { Skill } from '@/types/domain'

type TabKey = 'global' | 'workspace' | 'agent'

export default function SkillLibrary() {
  const { t, i18n } = useTranslation()
  const token = useAuthStore((s) => s.session?.access_token ?? '')
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId)
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace)

  const status = useCatalogStore((s) => s.status)
  const load = useCatalogStore((s) => s.load)
  const skillsGlobal = useCatalogStore((s) => s.skillsGlobal)
  const skillsWorkspace = useCatalogStore((s) => s.skillsWorkspace)
  const skillsAgent = useCatalogStore((s) => s.skillsAgent)
  const agentInstances = useCatalogStore((s) => s.agentInstances)
  const createSkill = useCatalogStore((s) => s.createSkill)
  const updateSkill = useCatalogStore((s) => s.updateSkill)
  const removeSkill = useCatalogStore((s) => s.removeSkill)

  const [tab, setTab] = useState<TabKey>('global')
  const [modal, setModal] = useState<{ open: boolean; mode: 'create' | 'edit'; initial: Skill | null }>({
    open: false,
    mode: 'create',
    initial: null,
  })

  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => {
    if (!token || !selectedWorkspaceId) return
    if (status === 'idle' || useCatalogStore.getState().workspaceId !== selectedWorkspaceId) {
      void load(token, selectedWorkspaceId)
    }
  }, [load, selectedWorkspaceId, status, token])

  const workspaceName = useMemo(() => {
    return workspaces.find((w) => w.id === selectedWorkspaceId)?.name ?? ''
  }, [selectedWorkspaceId, workspaces])

  const formatDateTime = useMemo(() => {
    const locale = i18n.resolvedLanguage ?? 'zh-CN'
    const dtf = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
    return (value: string) => dtf.format(new Date(value))
  }, [i18n.resolvedLanguage])

  const workspaceMap = useMemo(() => new Map(workspaces.map((w) => [w.id, w])), [workspaces])
  const agentMap = useMemo(() => new Map(agentInstances.map((a) => [a.id, a])), [agentInstances])

  const scopeItems: Array<{ key: TabKey; title: string; count: number }> = [
    { key: 'global', title: t('skills.scope.global'), count: skillsGlobal.length },
    { key: 'workspace', title: t('skills.scope.workspace'), count: skillsWorkspace.length },
    { key: 'agent', title: t('skills.scope.agent'), count: skillsAgent.length },
  ]

  const rows = tab === 'global' ? skillsGlobal : tab === 'workspace' ? skillsWorkspace : skillsAgent

  const usedByCount = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of agentInstances) {
      for (const b of a.skillBindings) {
        m.set(b.skillId, (m.get(b.skillId) ?? 0) + 1)
      }
    }
    return m
  }, [agentInstances])

  const boundCountByScope = useMemo(() => {
    const counts: Record<string, number> = { global: 0, workspace: 0, agent: 0 }
    for (const a of agentInstances) {
      for (const b of a.skillBindings) counts[b.scope] = (counts[b.scope] ?? 0) + 1
    }
    return counts
  }, [agentInstances])

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t('skills.title')}
        subtitle={workspaceName ? `${t('skills.subtitle')} · ${t('agents.currentWorkspace')}: ${workspaceName}` : t('skills.subtitle')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedWorkspaceId ?? ''}
              onChange={(e) => selectWorkspace(e.target.value)}
              className="h-9 rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              onClick={() => setModal({ open: true, mode: 'create', initial: null })}
            >
              <Plus className="h-4 w-4" />
              {t('skills.create')}
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
              onClick={() => setImportOpen(true)}
            >
              <FileUp className="h-4 w-4" />
              {t('skills.importLocal')}
            </button>
          </div>
        }
      />

      <SurfaceCard className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {scopeItems.map((it) => (
              <button
                key={it.key}
                type="button"
                onClick={() => setTab(it.key)}
                className={
                  tab === it.key
                    ? 'inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-900'
                    : 'inline-flex h-9 items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10'
                }
              >
                {it.title}
                <span className="text-xs opacity-80">{it.count}</span>
              </button>
            ))}
          </div>
          <StatusBadge label={status === 'loading' ? t('common.loading') : t('common.ready')} tone={status === 'loading' ? 'neutral' : 'info'} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-3xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('skills.binding.global')}</div>
              <StatusBadge label={String(boundCountByScope.global)} />
            </div>
            <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">{t('skills.binding.globalHint')}</div>
          </div>
          <div className="rounded-3xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('skills.binding.workspace')}</div>
              <StatusBadge label={String(boundCountByScope.workspace)} />
            </div>
            <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">{t('skills.binding.workspaceHint')}</div>
          </div>
          <div className="rounded-3xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('skills.binding.agent')}</div>
              <StatusBadge label={String(boundCountByScope.agent)} tone={boundCountByScope.agent ? 'info' : 'neutral'} />
            </div>
            <div className="mt-2 text-sm text-slate-700 dark:text-slate-200">{t('skills.binding.agentHint')}</div>
          </div>
        </div>
      </SurfaceCard>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('skills.listTitle')}</div>
            <StatusBadge label={t('skills.priorityRule')} tone="info" />
          </div>
          <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
            <div className="grid grid-cols-[1fr_120px_120px_160px_160px_120px_140px] gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
              <div>{t('skills.columns.name')}</div>
              <div>{t('skills.columns.scope')}</div>
              <div>{t('skills.columns.kind')}</div>
              <div>{t('skills.columns.owner')}</div>
              <div>{t('skills.columns.updatedAt')}</div>
              <div>{t('skills.columns.usedBy')}</div>
              <div className="text-right"> </div>
            </div>
            <div className="divide-y divide-black/5 bg-white/40 dark:divide-white/10 dark:bg-white/5">
              {rows.map((s) => (
                <div key={s.id} className="grid grid-cols-[1fr_120px_120px_160px_160px_120px_140px] items-center gap-2 px-4 py-3 text-sm">
                  <Link to={`/app/skills/${s.id}`} className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 truncate font-medium text-slate-900 dark:text-slate-100">{s.name}</div>
                      <StatusBadge label={s.enabled ? t('common.enabled') : t('common.disabled')} tone={s.enabled ? 'success' : 'neutral'} />
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{s.description}</div>
                  </Link>
                  <div>
                    <StatusBadge label={t(`skills.scope.${s.scope}`)} tone={s.scope === 'agent' ? 'info' : 'neutral'} />
                  </div>
                  <div className="text-slate-700 dark:text-slate-200">{t(`skills.kind.${s.kind}`, { defaultValue: s.kind })}</div>
                  <div className="min-w-0 text-slate-700 dark:text-slate-200">
                    {s.owner.type === 'tenant'
                      ? t('skills.owner.tenant')
                      : s.owner.type === 'workspace'
                        ? workspaceMap.get(s.owner.workspaceId)?.name ?? s.owner.workspaceId
                        : agentMap.get(s.owner.agentId)?.name ?? s.owner.agentId}
                  </div>
                  <div className="text-slate-700 dark:text-slate-200">{formatDateTime(s.updatedAt)}</div>
                  <div className="text-slate-700 dark:text-slate-200">{usedByCount.get(s.id) ?? 0}</div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="inline-flex h-9 items-center justify-center rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                      onClick={() => setModal({ open: true, mode: 'edit', initial: s })}
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/15 dark:text-rose-300"
                      onClick={async () => {
                        if (!token) return
                        const ok = window.confirm(t('skills.deleteConfirm'))
                        if (!ok) return
                        await removeSkill(token, s.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              ))}
              {rows.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    title={t('skills.emptyTitle')}
                    description={t('skills.emptyHint')}
                    actions={
                      <button
                        type="button"
                        className="inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                        onClick={() => setModal({ open: true, mode: 'create', initial: null })}
                      >
                        <Plus className="h-4 w-4" />
                        {t('skills.create')}
                      </button>
                    }
                  />
                </div>
              ) : null}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <ArrowDownUp className="h-4 w-4" />
            {t('skills.priorityTitle')}
          </div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('skills.priorityHint')}</div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('skills.overrideExampleTitle')}</div>
                <StatusBadge label={t('skills.scope.agent')} tone="info" />
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('skills.overrideExampleText')}</div>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                <ShieldCheck className="h-4 w-4" />
                {t('skills.futureAccessTitle')}
              </div>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('skills.futureAccessText')}</div>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              {t('skills.futureEngineHint')}
            </div>
          </div>
        </SurfaceCard>
      </div>

      <SkillFormModal
        open={modal.open}
        mode={modal.mode}
        initial={modal.initial}
        workspaces={workspaces}
        agents={agentInstances}
        defaultScope={tab}
        defaultWorkspaceId={selectedWorkspaceId}
        onClose={() => setModal({ open: false, mode: 'create', initial: null })}
        onSubmit={async (value: SkillFormValue) => {
          if (!token) return false
          if (modal.mode === 'edit' && modal.initial) {
            return updateSkill(token, modal.initial.id, {
              name: value.name,
              kind: value.kind,
              description: value.description,
              version: value.version,
              enabled: value.enabled,
              contentText: value.contentText,
              source: value.source,
            })
          }
          return createSkill(token, value)
        }}
      />

      <SkillImportModal
        open={importOpen}
        workspaces={workspaces}
        agents={agentInstances}
        defaultScope={tab}
        defaultWorkspaceId={selectedWorkspaceId}
        onClose={() => setImportOpen(false)}
        onImport={async (value: SkillFormValue) => {
          if (!token) return false
          return createSkill(token, value)
        }}
      />
    </div>
  )
}
