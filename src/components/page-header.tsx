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
        'product-page-header flex flex-col gap-5 pb-3 lg:flex-row lg:items-center lg:justify-between',
        isInverse ? 'border-surfaceLight/15' : 'border-surfaceMuted/20',
      )}
    >
      <div className="min-w-0 space-y-2.5">
        <p className={cn('eyebrow uppercase text-[9px]', isInverse && 'text-surfaceMuted')}>{eyebrow}</p>
        <div className="space-y-1.5">
          <h1
            className={cn(
              'font-display text-[28px] font-semibold tracking-[-0.04em]',
              isInverse ? 'text-surfaceLight' : 'text-ink',
            )}
          >
            {title}
          </h1>
          <p
            className={cn(
              'max-w-2xl text-xs leading-relaxed',
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
