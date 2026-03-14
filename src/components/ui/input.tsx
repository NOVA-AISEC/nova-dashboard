import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Input({
  className,
  type = 'text',
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'flex h-12 w-full rounded-lg border border-surfaceMuted/70 bg-primaryDeep/95 px-4 text-sm text-textPrimary shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] placeholder:text-textSecondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentGlow',
        className,
      )}
      type={type}
      {...props}
    />
  )
}
