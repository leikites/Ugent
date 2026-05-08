import { useTranslation } from 'react-i18next'
import { Shield, KeyRound } from 'lucide-react'
import SurfaceCard from '@/components/SurfaceCard'

export default function ProjectSettings() {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-1 gap-4">
      <SurfaceCard>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Shield className="h-4 w-4" />
          {t('settings.rbac')}
        </div>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('common.comingSoon')}</div>
      </SurfaceCard>
      <SurfaceCard>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <KeyRound className="h-4 w-4" />
          {t('settings.secrets')}
        </div>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t('common.comingSoon')}</div>
      </SurfaceCard>
    </div>
  )
}
