import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'flex min-h-32 w-full rounded-lg border border-surfaceMuted/70 bg-primaryDeep/95 px-4 py-3.5 text-sm text-textPrimary shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] placeholder:text-textSecondary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentGlow',
        className,
      )}
      {...props}
    />
  )
}
