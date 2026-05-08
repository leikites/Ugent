import { useTranslation } from 'react-i18next'
import { KeyRound, RotateCcw, Shield, SlidersHorizontal, Users } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import SurfaceCard from '@/components/SurfaceCard'
import { resetMockDb } from '@/mocks/mockDb'

export default function Settings() {
  const { t } = useTranslation()

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SurfaceCard>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="h-4 w-4" />
            {t('settings.general')}
          </div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('settings.generalHint')}</div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm dark:border-white/10 dark:bg-white/5">
              <div className="text-xs text-slate-500 dark:text-slate-400">{t('settings.tenant')}</div>
              <div className="mt-2 font-semibold text-slate-900 dark:text-slate-100">UuuGent Demo Tenant</div>
            </div>
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              {t('settings.generalComingSoon')}
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4" />
            {t('settings.members')}
          </div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('settings.membersHint')}</div>
          <div className="mt-4 rounded-2xl border border-black/5 bg-white/60 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            {t('settings.membersComingSoon')}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Shield className="h-4 w-4" />
            {t('settings.rbac')}
          </div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('settings.rbacHint')}</div>
          <div className="mt-4 rounded-2xl border border-black/5 bg-white/60 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            {t('settings.rbacComingSoon')}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <KeyRound className="h-4 w-4" />
            {t('settings.secrets')}
          </div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('settings.secretsHint')}</div>
          <div className="mt-4 rounded-2xl border border-black/5 bg-white/60 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            {t('settings.secretsComingSoon')}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <RotateCcw className="h-4 w-4" />
            {t('settings.demo')}
          </div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('settings.demoHint')}</div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/15 dark:text-rose-300"
              onClick={() => {
                const ok = window.confirm(t('settings.resetConfirm'))
                if (!ok) return
                resetMockDb()
                try {
                  localStorage.removeItem('selected_workspace_id')
                } catch {
                  void 0
                }
                window.location.reload()
              }}
            >
              {t('settings.resetDemo')}
            </button>
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}
