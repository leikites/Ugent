import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import i18n, { setLanguage } from '@/i18n'
import LanguageToggle from '@/components/LanguageToggle'

describe('LanguageToggle', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to zh-CN when no saved language', async () => {
    await setLanguage('zh-CN')
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>,
    )
    expect(screen.getByText('中文')).toBeInTheDocument()
  })

  it('switches to English and persists', async () => {
    const user = userEvent.setup()
    await setLanguage('zh-CN')
    render(
      <I18nextProvider i18n={i18n}>
        <LanguageToggle />
      </I18nextProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'English' }))
    expect(localStorage.getItem('app_language')).toBe('en')
  })
})

