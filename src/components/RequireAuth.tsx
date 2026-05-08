import { useEffect, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/useAuthStore'

type Props = {
  children: ReactNode
}

export default function RequireAuth({ children }: Props) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const status = useAuthStore((s) => s.status)
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    void init()
  }, [init])

  if (status === 'loading') {
    return <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-600 dark:text-slate-300">{t('common.loading')}</div>
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: pathname }} />
  }

  return <>{children}</>
}
