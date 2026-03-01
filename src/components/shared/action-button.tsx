import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ActionButtonProps = Omit<Parameters<typeof Button>[0], 'variant' | 'size'> & {
  intent?: 'action' | 'neutral' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const intentVariants = {
  action: 'action',
  neutral: 'outline',
  danger: 'danger',
} as const

const sizeVariants = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
} as const

export function ActionButton({
  children,
  disabled,
  intent = 'action',
  loading = false,
  size = 'md',
  ...props
}: ActionButtonProps) {
  return (
    <Button
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      size={sizeVariants[size]}
      variant={intentVariants[intent]}
      {...props}
    >
      {loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : null}
      {children}
    </Button>
  )
}
