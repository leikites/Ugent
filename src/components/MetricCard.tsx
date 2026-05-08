import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  label: string
  value: string | number
  hint?: string
  icon?: ReactNode
  className?: string
}

export default function MetricCard({ label, value, hint, icon, className }: Props) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
        {icon ? <div className="text-slate-500 dark:text-slate-300">{icon}</div> : null}
      </div>
      <div className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</div> : null}
    </div>
  )
}

