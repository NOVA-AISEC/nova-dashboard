import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap border text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-primary bg-primary text-primary-foreground hover:bg-primary/92',
        secondary:
          'border-brand-gold/40 bg-secondary text-secondary-foreground hover:border-brand-gold hover:bg-severity-high-bg',
        outline:
          'border-brand-gold/55 bg-transparent text-foreground hover:border-brand-gold hover:bg-severity-high-bg hover:text-foreground',
        ghost: 'border-transparent bg-transparent text-foreground hover:bg-status-info-bg',
        danger:
          'border-destructive bg-destructive text-white hover:bg-destructive/90',
      },
      size: {
        default: 'h-11 px-4.5',
        sm: 'h-8.5 px-3 text-[10px]',
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
