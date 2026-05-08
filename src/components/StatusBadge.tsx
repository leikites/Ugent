import { cn } from '@/lib/utils'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

type Props = {
  label: string
  tone?: Tone
  className?: string
}

const toneCls: Record<Tone, string> = {
  neutral: 'border-black/10 bg-white/70 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200',
  success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400/20 dark:text-emerald-300',
  warning: 'border-amber-500/20 bg-amber-500/10 text-amber-800 dark:border-amber-400/20 dark:text-amber-300',
  danger: 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:border-rose-400/20 dark:text-rose-300',
  info: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:border-indigo-400/20 dark:text-indigo-300',
}

export default function StatusBadge({ label, tone = 'neutral', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
        toneCls[tone],
        className,
      )}
    >
      {label}
    </span>
  )
}

