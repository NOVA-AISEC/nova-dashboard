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
        'flex h-11 w-full border border-surfaceMuted bg-primaryDark px-4 text-sm text-surfaceLight placeholder:text-textSecondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accentGlow',
        className,
      )}
      type={type}
      {...props}
    />
  )
}
