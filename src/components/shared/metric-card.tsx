import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string
  delta: string
  tone: 'accent' | 'ink' | 'success' | 'warning'
}

const toneClasses: Record<MetricCardProps['tone'], string> = {
  accent: 'border-t-accentBlue',
  ink: 'border-t-surfaceMuted',
  success: 'border-t-success',
  warning: 'border-t-warning',
}

const toneIcons = {
  accent: ArrowUpRight,
  ink: ArrowRight,
  success: ArrowUpRight,
  warning: ArrowDownRight,
} satisfies Record<MetricCardProps['tone'], typeof ArrowRight>

export function MetricCard({ label, value, delta, tone }: MetricCardProps) {
  const Icon = toneIcons[tone]

  return (
    <Card className={cn('border-t-4 bg-primaryDeep', toneClasses[tone])}>
      <CardHeader className="pb-1">
        <p className="eyebrow">{label}</p>
        <CardTitle className="text-4xl tracking-[-0.06em]">{value}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2 text-sm text-textSecondary">
        <Icon className="h-4 w-4" />
        <span>{delta}</span>
      </CardContent>
    </Card>
  )
}
