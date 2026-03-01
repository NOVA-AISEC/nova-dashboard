import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'flex h-11 w-full border border-surfaceMuted bg-primaryDeep px-4 text-sm text-textPrimary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentGlow',
        className,
      )}
      {...props}
    />
  )
}
