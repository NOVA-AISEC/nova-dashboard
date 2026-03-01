import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface LiveIndicatorDotProps extends HTMLAttributes<HTMLSpanElement> {
  label?: string
}

export function LiveIndicatorDot({
  className,
  label,
  ...props
}: LiveIndicatorDotProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-textSecondary',
        className,
      )}
      {...props}
    >
      <span aria-hidden="true" className="live-indicator-dot" />
      {label ? <span>{label}</span> : null}
    </span>
  )
}
