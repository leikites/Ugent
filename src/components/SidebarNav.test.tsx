import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n, { setLanguage } from '@/i18n'
import SidebarNav from '@/components/SidebarNav'

describe('SidebarNav', () => {
  beforeEach(async () => {
    await setLanguage('zh-CN')
  })

  it('renders primary navigation items', () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/app/dashboard' }]}>
        <I18nextProvider i18n={i18n}>
          <SidebarNav />
        </I18nextProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('总览')).toBeInTheDocument()
    expect(screen.getByText('命令中心')).toBeInTheDocument()
    expect(screen.getByText('Workspace')).toBeInTheDocument()
    expect(screen.getByText('智能体')).toBeInTheDocument()
    expect(screen.getByText('技能')).toBeInTheDocument()
    expect(screen.getByText('工作流')).toBeInTheDocument()
    expect(screen.getByText('执行')).toBeInTheDocument()
    expect(screen.getByText('审核')).toBeInTheDocument()
    expect(screen.getByText('设置')).toBeInTheDocument()
  })
})
