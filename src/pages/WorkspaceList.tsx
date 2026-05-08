import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, PencilLine, Search, Trash2 } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SurfaceCard from '@/components/SurfaceCard'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { useAuthStore } from '@/stores/useAuthStore'
import { useWorkspaceStore } from '@/stores/useWorkspaceStore'

export default function WorkspaceList() {
  const { t, i18n } = useTranslation()
  const token = useAuthStore((s) => s.session?.access_token ?? '')
  const wsStatus = useWorkspaceStore((s) => s.status)
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const selectedWorkspaceId = useWorkspaceStore((s) => s.selectedWorkspaceId)
  const loadDashboard = useWorkspaceStore((s) => s.loadDashboard)
  const selectWorkspace = useWorkspaceStore((s) => s.selectWorkspace)
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace)
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace)
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace)

  const [query, setQuery] = useState('')

  const [editOpen, setEditOpen] = useState(false)
  const [editId, setEditId] = useState('')
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editArchived, setEditArchived] = useState(false)

  const [createOpen, setCreateOpen] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')

  const [deleteOpen, setDeleteOpen] = useState(false)

  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('new') !== '1') return
    setCreateOpen(true)
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (!token) return
    if (wsStatus === 'idle') void loadDashboard(token)
  }, [loadDashboard, token, wsStatus])

  const formatDateTime = useMemo(() => {
    const locale = i18n.resolvedLanguage ?? 'zh-CN'
    const dtf = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
    return (value: string) => dtf.format(new Date(value))
  }, [i18n.resolvedLanguage])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return workspaces
    return workspaces.filter((w) => `${w.name} ${w.description}`.toLowerCase().includes(q))
  }, [query, workspaces])

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={t('workspaces.title')}
        subtitle={t('workspaces.subtitle')}
        actions={
          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4" />
            {t('workspaces.create')}
          </button>
        }
      />
      <SurfaceCard className="mt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workspaces.list')}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('workspaces.listHint')}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 w-56 rounded-2xl border border-black/10 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                placeholder={t('workspaces.searchPlaceholder')}
              />
            </div>
            <StatusBadge label={wsStatus === 'loading' ? t('common.loading') : t('common.ready')} tone={wsStatus === 'loading' ? 'neutral' : 'info'} />
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
          <div className="grid grid-cols-[1fr_160px_120px_120px_120px_120px] gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">
            <div>{t('workspaces.columns.name')}</div>
            <div>{t('workspaces.columns.status')}</div>
            <div>{t('workspaces.columns.updatedAt')}</div>
            <div>{t('dashboard.columns.agents')}</div>
            <div>{t('dashboard.columns.workflows')}</div>
            <div className="text-right"> </div>
          </div>
          <div className="divide-y divide-black/5 bg-white/40 dark:divide-white/10 dark:bg-white/5">
            {filtered.map((w) => (
              <div key={w.id} className="grid grid-cols-[1fr_160px_120px_120px_120px_120px] items-center gap-2 px-4 py-3 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className={
                        w.id === selectedWorkspaceId
                          ? 'inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300'
                          : 'inline-flex items-center rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
                      }
                      onClick={() => selectWorkspace(w.id)}
                    >
                      {w.id === selectedWorkspaceId ? t('workspaces.current') : t('workspaces.switch')}
                    </button>
                    <div className="truncate font-medium text-slate-900 dark:text-slate-100">{w.name}</div>
                  </div>
                  <div className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{w.description || t('workspaces.noDescription')}</div>
                </div>
                <div>
                  <StatusBadge
                    label={w.archivedAt ? t('workspaces.archived') : t('workspaces.active')}
                    tone={w.archivedAt ? 'neutral' : 'info'}
                  />
                </div>
                <div className="text-slate-700 dark:text-slate-200">{formatDateTime(w.updatedAt)}</div>
                <div className="text-slate-700 dark:text-slate-200">{w.metrics.agents}</div>
                <div className="text-slate-700 dark:text-slate-200">{w.metrics.workflows}</div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                    onClick={() => {
                      setEditId(w.id)
                      setEditName(w.name)
                      setEditDesc(w.description)
                      setEditArchived(Boolean(w.archivedAt))
                      setEditOpen(true)
                    }}
                  >
                    <PencilLine className="h-4 w-4" />
                  </button>
                  <Link
                    to={`/app/workspaces/${w.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  >
                    {t('workspaces.open')}
                  </Link>
                </div>
              </div>
            ))}
            {filtered.length === 0 ? (
              <div className="p-4">
                {workspaces.length === 0 ? (
                  <EmptyState
                    title={t('dashboard.empty.noWorkspacesTitle')}
                    description={t('dashboard.empty.noWorkspacesBody')}
                    actions={
                      <button
                        type="button"
                        className="inline-flex h-9 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                        onClick={() => setCreateOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                        {t('dashboard.empty.noWorkspacesCta')}
                      </button>
                    }
                  />
                ) : (
                  <EmptyState title={t('workspaces.empty')} description={t('workspaces.listHint')} />
                )}
              </div>
            ) : null}
          </div>
        </div>
      </SurfaceCard>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-slate-950">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workspaces.createTitle')}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('workspaces.createHint')}</div>

            <div className="mt-4 grid gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('workspaces.fields.name')}</div>
                <input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                  placeholder={t('workspace.namePlaceholder')}
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('workspaces.fields.description')}</div>
                <textarea
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                  placeholder={t('workspaces.descriptionPlaceholder')}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                onClick={() => setCreateOpen(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                disabled={!token || !createName.trim()}
                onClick={async () => {
                  if (!token) return
                  const ok = await createWorkspace(token, { name: createName, description: createDesc })
                  if (ok) {
                    setCreateOpen(false)
                    setCreateName('')
                    setCreateDesc('')
                  }
                }}
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-slate-950">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workspaces.editTitle')}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('workspaces.editHint')}</div>

            <div className="mt-4 grid gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('workspaces.fields.name')}</div>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-2 h-10 w-full rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                  placeholder={t('workspace.namePlaceholder')}
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{t('workspaces.fields.description')}</div>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                  placeholder={t('workspaces.descriptionPlaceholder')}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={editArchived}
                  onChange={(e) => setEditArchived(e.target.checked)}
                  className="h-4 w-4 rounded border border-black/20"
                />
                {t('workspaces.fields.archived')}
              </label>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/15 disabled:opacity-50 dark:text-rose-200"
                disabled={!token || !editId || workspaces.length <= 1}
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                {t('workspaces.delete')}
              </button>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                  onClick={() => setEditOpen(false)}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                  disabled={!token || !editId || !editName.trim()}
                  onClick={async () => {
                    if (!token || !editId) return
                    const ok = await updateWorkspace(token, editId, {
                      name: editName,
                      description: editDesc,
                      archived: editArchived,
                    })
                    if (ok) setEditOpen(false)
                  }}
                >
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {deleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-black/10 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-slate-950">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('workspaces.deleteTitle')}</div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t('workspaces.deleteHint')}</div>

            <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-800 dark:text-rose-200">
              {t('workspaces.deleteWarning', { name: editName || '' })}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-2xl border border-black/10 bg-white px-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
                onClick={() => setDeleteOpen(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-2xl bg-rose-600 px-3 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-50"
                disabled={!token || !editId || workspaces.length <= 1}
                onClick={async () => {
                  if (!token || !editId) return
                  const ok = await deleteWorkspace(token, editId)
                  if (ok) {
                    setDeleteOpen(false)
                    setEditOpen(false)
                    setEditId('')
                    setEditName('')
                    setEditDesc('')
                    setEditArchived(false)
                  }
                }}
              >
                {t('workspaces.deleteConfirm')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
