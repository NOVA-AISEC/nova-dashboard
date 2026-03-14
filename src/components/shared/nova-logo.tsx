import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

type NovaLogoProps = ComponentPropsWithoutRef<'img'>

export function NovaLogo({ className, alt = 'NOVA Security Operations', ...props }: NovaLogoProps) {
  return (
    <img
      alt={alt}
      className={cn('h-auto w-full object-contain', className)}
      src="/logo.png"
      {...props}
    />
  )
}
