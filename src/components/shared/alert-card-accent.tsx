import type { HTMLAttributes } from 'react'
import type { ActionSignalTone } from '@/lib/action-gradient'
import { cn } from '@/lib/utils'

interface AlertCardAccentProps extends HTMLAttributes<HTMLDivElement> {
  tone?: ActionSignalTone
}

const cardClasses: Record<ActionSignalTone, string> = {
  normal: '',
  elevated: 'alert-accent-elevated',
  critical: 'alert-accent-critical',
}

export function AlertCardAccent({
  className,
  tone = 'normal',
  ...props
}: AlertCardAccentProps) {
  return (
    <div
      className={cn('alert-accent-card', cardClasses[tone], className)}
      {...props}
    />
  )
}
