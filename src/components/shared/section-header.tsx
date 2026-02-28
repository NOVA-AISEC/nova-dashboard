import type { ReactNode } from 'react'

interface SectionHeaderProps {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-surfaceMuted/20 pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="space-y-3">
        <p className="eyebrow">{eyebrow}</p>
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">
            {title}
          </h1>
          <p className="max-w-3xl text-sm text-textSecondary sm:text-base">
            {description}
          </p>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  )
}
