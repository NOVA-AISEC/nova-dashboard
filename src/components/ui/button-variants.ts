import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap border text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'btn-primary',
        secondary: 'btn-secondary',
        outline: 'btn-outline',
        ghost: 'btn-ghost',
        danger: 'btn-danger',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-2.5 text-[10px]',
        lg: 'h-11 px-4.5',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)
