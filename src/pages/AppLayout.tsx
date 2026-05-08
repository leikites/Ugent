import { Outlet } from 'react-router-dom'
import AppTopBar from '@/components/AppTopBar'
import SidebarNav from '@/components/SidebarNav'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <AppTopBar />
      <div className="mx-auto flex max-w-7xl items-start gap-4">
        <SidebarNav />
        <main className="min-w-0 flex-1 px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

