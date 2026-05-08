import { Outlet, useParams } from 'react-router-dom'
import SurfaceCard from '@/components/SurfaceCard'
import ProjectSidebar from '@/components/ProjectSidebar'

export default function ProjectLayout() {
  const { projectId } = useParams()

  return (
    <div className="mx-auto flex max-w-6xl items-start gap-4 px-4 py-6">
      <ProjectSidebar />
      <main className="min-w-0 flex-1">
        <SurfaceCard className="mb-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">Project</div>
          <div className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{projectId}</div>
        </SurfaceCard>
        <Outlet />
      </main>
    </div>
  )
}

