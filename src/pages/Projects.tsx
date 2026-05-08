import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Plus, Server } from 'lucide-react'
import SurfaceCard from '@/components/SurfaceCard'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'
import { getJson, postJson } from '@/utils/api'

type HealthResponse = { success: boolean; message: string }

type ProjectRow = {
  id: string
  workspace_id: string
  name: string
  created_at: string
  updated_at: string
}

type ProjectsResponse =
  | { success: true; projects: ProjectRow[] }
  | { success: false; error: string }

type CreateProjectResponse =
  | { success: true; project: ProjectRow }
  | { success: false; error: string }

export default function Projects() {
  const { t, i18n } = useTranslation()
  const token = useAuthStore((s) => s.session?.access_token ?? '')
  const wsStatus = useWorkspaceStore((s) => s.status)
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId)
  const loadDashboard = useWorkspaceStore((s) => s.loadDashboard)

  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [projectsStatus, setProjectsStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [projectsError, setProjectsError] = useState<string | null>(null)
  const [name, setName] = useState('')

  const [health, setHealth] = useState<'loading' | 'ok' | 'fail'>('loading')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await getJson<HealthResponse>('/api/health')
        if (cancelled) return
        setHealth(res?.success ? 'ok' : 'fail')
      } catch {
        if (cancelled) return
        setHealth('fail')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!token) return
    if (wsStatus === 'idle') void loadDashboard(token)
  }, [loadDashboard, token, wsStatus])

  useEffect(() => {
    if (!token || !selectedWorkspaceId) return
    let cancelled = false
    setProjectsStatus('loading')
    setProjectsError(null)
    void (async () => {
      try {
        const res = await getJson<ProjectsResponse>(`/api/projects?workspaceId=${encodeURIComponent(selectedWorkspaceId)}`, {
          token,
        })
        if (cancelled) return
        if (res.success === false) {
          setProjectsStatus('error')
          setProjectsError(res.error)
          return
        }
        setProjects(res.projects)
        setProjectsStatus('ready')
      } catch {
        if (cancelled) return
        setProjectsStatus('error')
        setProjectsError('network_error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedWorkspaceId, token])

  const healthUi = useMemo(() => {
    if (health === 'loading') return { label: t('common.loading'), cls: 'text-slate-500 dark:text-slate-400' }
    if (health === 'ok') return { label: t('projects.backendOk'), cls: 'text-emerald-600 dark:text-emerald-400' }
    return { label: t('projects.backendFail'), cls: 'text-rose-600 dark:text-rose-400' }
  }, [health, t])

  const formatDateTime = useMemo(() => {
    const locale = i18n.resolvedLanguage ?? 'zh-CN'
    const dtf = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
    return (value: string) => dtf.format(new Date(value))
  }, [i18n.resolvedLanguage])

  const workspaceName = useMemo(() => {
    return workspaces.find((w) => w.id === selectedWorkspaceId)?.name ?? ''
  }, [selectedWorkspaceId, workspaces])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <SurfaceCard>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">{t('projects.title')}</div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {workspaceName ? `${t('nav.dashboard')}: ${workspaceName}` : t('project.empty')}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 w-52 rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                placeholder={t('projects.namePlaceholder')}
              />
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                disabled={!token || !selectedWorkspaceId || !name.trim()}
                onClick={async () => {
                  if (!token || !selectedWorkspaceId) return
                  const res = await postJson<CreateProjectResponse>('/api/projects', {
                    workspaceId: selectedWorkspaceId,
                    name,
                  }, token)
                  if (res.success === true) {
                    setProjects((prev) => [res.project, ...prev])
                    setName('')
                  } else {
                    setProjectsError(res.error)
                  }
                }}
              >
                <Plus className="h-4 w-4" />
                {t('common.create')}
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
            <div className="grid grid-cols-[1fr_140px_160px_120px] gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
              <div>{t('nav.projects')}</div>
              <div>{t('common.role')}</div>
              <div>{t('common.updatedAt')}</div>
              <div className="text-right"> </div>
            </div>
            <div className="divide-y divide-black/5 bg-white/40 dark:divide-white/10 dark:bg-white/5">
              {projectsStatus === 'loading' ? (
                <div className="px-4 py-4 text-sm text-slate-600 dark:text-slate-300">{t('common.loading')}</div>
              ) : null}
              {projectsStatus === 'error' ? (
                <div className="px-4 py-4 text-sm text-rose-600 dark:text-rose-400">{projectsError ?? 'error'}</div>
              ) : null}
              {projects.map((p) => (
                <div key={p.id} className="grid grid-cols-[1fr_140px_160px_120px] items-center gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{p.name}</div>
                    <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{p.id}</div>
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-200">{t('roles.owner')}</div>
                  <div className="text-sm text-slate-700 dark:text-slate-200">{formatDateTime(p.updated_at)}</div>
                  <div className="flex justify-end">
                    <Link
                      to={`/projects/${p.id}`}
                      className="inline-flex h-9 items-center gap-2 rounded-2xl border border-black/5 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                    >
                      {t('projects.open')}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('projects.backendStatus')}</div>
            <Server className="h-4 w-4 text-slate-500 dark:text-slate-300" />
          </div>
          <div className="mt-3 rounded-2xl border border-black/5 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-white/5">
            <div className={healthUi.cls}>{healthUi.label}</div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">GET /api/health</div>
          </div>
          <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            {t('projects.comingSoonNote')}
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}
