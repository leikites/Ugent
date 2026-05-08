import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
  className?: string
}

export default function EmptyState({ title, description, icon, actions, className }: Props) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-black/5 bg-white/60 p-6 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-2xl border border-black/5 bg-white/70 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 dark:text-slate-100">{title}</div>
          {description ? <div className="mt-1 text-sm">{description}</div> : null}
        </div>
      </div>
      {actions ? <div className="mt-4 flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

