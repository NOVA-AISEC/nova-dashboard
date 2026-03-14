import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  eyebrow: string
  subtitle: string
  actions?: ReactNode
  meta?: ReactNode
  tone?: 'default' | 'inverse'
}

export function PageHeader({
  title,
  eyebrow,
  subtitle,
  actions,
  meta,
  tone = 'default',
}: PageHeaderProps) {
  const isInverse = tone === 'inverse'

  return (
    <header
      className={cn(
        'flex flex-col gap-5 border-b pb-5 lg:flex-row lg:items-end lg:justify-between',
        isInverse ? 'border-surfaceLight/15' : 'border-surfaceMuted/20',
      )}
    >
      <div className="min-w-0 space-y-2.5">
        <p className={cn('eyebrow', isInverse && 'text-surfaceMuted')}>{eyebrow}</p>
        <div className="space-y-1.5">
          <h1
            className={cn(
              'font-display text-3xl font-bold tracking-[-0.05em] sm:text-4xl',
              isInverse ? 'text-surfaceLight' : 'text-ink',
            )}
          >
            {title}
          </h1>
          <p
            className={cn(
              'max-w-3xl text-sm sm:text-[15px]',
              isInverse ? 'text-surfaceMuted' : 'text-textSecondary',
            )}
          >
            {subtitle}
          </p>
        </div>
        {meta ? <div className="flex flex-wrap gap-2.5">{meta}</div> : null}
      </div>

      {actions ? (
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap lg:justify-end">
          {actions}
        </div>
      ) : null}
    </header>
  )
}
