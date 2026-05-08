import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Languages } from 'lucide-react'
import { setLanguage, supportedLanguages, type AppLanguage } from '@/i18n'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
}

export default function LanguageToggle({ className }: Props) {
  const { i18n, t } = useTranslation()

  const current = useMemo(() => {
    return (i18n.language === 'en' ? 'en' : 'zh-CN') as AppLanguage
  }, [i18n.language])

  return (
    <div className={cn('flex items-center gap-2', className)} aria-label={t('common.language')}>
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 backdrop-blur dark:border-white/10 dark:bg-white/5">
        <Languages className="h-4 w-4 text-slate-300" />
        <div className="flex items-center gap-2">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.key}
              type="button"
              onClick={() => void setLanguage(lang.key)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-1 transition',
                current === lang.key
                  ? 'bg-white/10 text-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white',
              )}
            >
              {current === lang.key ? <Check className="h-3.5 w-3.5" /> : null}
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

