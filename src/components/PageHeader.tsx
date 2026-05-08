import type { ReactNode } from 'react'

type Props = {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export default function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</div>
        {subtitle ? <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{subtitle}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}

