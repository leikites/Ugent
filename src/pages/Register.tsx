import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import SurfaceCard from '@/components/SurfaceCard'
import { useAuthStore } from '@/stores/useAuthStore'

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const init = useAuthStore((s) => s.init)
  const status = useAuthStore((s) => s.status)
  const error = useAuthStore((s) => s.error)
  const signUp = useAuthStore((s) => s.signUp)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [clientError, setClientError] = useState<string | null>(null)

  useEffect(() => {
    void init()
  }, [init])

  const from = useMemo(() => {
    const state = location.state as { from?: string } | null
    return state?.from ?? '/app/dashboard'
  }, [location.state])

  useEffect(() => {
    if (status === 'authenticated') navigate(from, { replace: true })
  }, [from, navigate, status])

  const errorText = useMemo(() => {
    const code = clientError ?? error
    if (!code) return ''
    const key = `login.error.${code}`
    const translated = t(key)
    return translated === key ? code : translated
  }, [clientError, error, t])

  return (
    <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-10">
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-black/5 bg-white/70 p-8 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('app.name')}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">{t('register.title')}</div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('register.subtitle')}</div>

          <div className="mt-6 grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{t('login.username')}</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10 rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                placeholder="my_team_user"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">{t('login.usernameHint')}</span>
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{t('login.password')}</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                placeholder="••••••••"
                type="password"
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">{t('login.passwordHint')}</span>
            </label>

            <label className="grid gap-1">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{t('login.confirmPassword')}</span>
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-10 rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:border-slate-400 dark:border-white/10 dark:bg-white/5"
                placeholder="••••••••"
                type="password"
              />
            </label>

            {errorText ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-700 dark:text-rose-200">
                {errorText}
              </div>
            ) : null}

            <button
              type="button"
              disabled={status === 'loading'}
              className="mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              onClick={async () => {
                setClientError(null)
                if (password !== confirmPassword) {
                  setClientError('password_mismatch')
                  return
                }
                const ok = await signUp(username, password)
                if (ok) navigate(from, { replace: true })
              }}
            >
              {status === 'loading' ? t('common.loading') : t('register.create')}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex items-center justify-end">
              <button
                type="button"
                disabled={status === 'loading'}
                className="text-xs font-semibold text-indigo-700 transition hover:text-indigo-600 dark:text-indigo-300 dark:hover:text-indigo-200"
                onClick={() => {
                  navigate('/login')
                }}
              >
                {t('register.goLogin')}
              </button>
            </div>
          </div>
        </div>

        <SurfaceCard className="p-8">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('register.miniGuide')}</div>
          <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('register.miniGuideHint')}</div>
          <div className="mt-6 grid gap-3">
            <div className="rounded-2xl border border-black/5 bg-white/60 p-4 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              {t('register.miniGuideSteps')}
            </div>
          </div>
        </SurfaceCard>
      </div>
    </div>
  )
}

