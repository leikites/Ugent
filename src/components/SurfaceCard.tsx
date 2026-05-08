import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  children: ReactNode
}

export default function SurfaceCard({ className, children }: Props) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-black/5 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5',
        className,
      )}
    >
      {children}
    </div>
  )
}
