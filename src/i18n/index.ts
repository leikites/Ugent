import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { resources } from './resources'

export type AppLanguage = 'zh-CN' | 'en'

export const supportedLanguages: Array<{ key: AppLanguage; label: string }> = [
  { key: 'zh-CN', label: '中文' },
  { key: 'en', label: 'English' },
]

const STORAGE_KEY = 'app_language'

function getInitialLanguage(): AppLanguage {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'zh-CN' || saved === 'en') return saved
  return 'zh-CN'
}

void i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false,
    },
  })

export function setLanguage(lang: AppLanguage) {
  localStorage.setItem(STORAGE_KEY, lang)
  return i18n.changeLanguage(lang)
}

export default i18n

