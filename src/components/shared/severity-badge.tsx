import type { HTMLAttributes } from 'react'
import { Badge } from '@/components/ui/badge'
import type { ActionSignalTone } from '@/lib/action-gradient'
import { cn } from '@/lib/utils'

interface SeverityBadgeProps extends HTMLAttributes<HTMLDivElement> {
  tone?: ActionSignalTone
}

const toneClasses: Record<ActionSignalTone, string> = {
  normal: 'severity-badge-normal',
  elevated: 'severity-badge-elevated',
  critical: 'severity-badge-critical',
}

export function SeverityBadge({
  className,
  tone = 'normal',
  ...props
}: SeverityBadgeProps) {
  return <Badge className={cn(toneClasses[tone], className)} {...props} />
}
