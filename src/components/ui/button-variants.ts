import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap border text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
        secondary:
          'border-border bg-secondary text-secondary-foreground hover:bg-[#d4ccb8]',
        outline:
          'border-border bg-transparent text-foreground hover:bg-foreground hover:text-background',
        ghost: 'border-transparent bg-transparent text-foreground hover:bg-muted',
        danger:
          'border-destructive bg-destructive text-white hover:bg-destructive/90',
      },
      size: {
        default: 'h-11 px-4',
        sm: 'h-9 px-3 text-[10px]',
        lg: 'h-12 px-5',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)
