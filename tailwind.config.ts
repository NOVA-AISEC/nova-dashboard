import type { Config } from 'tailwindcss'

function cssColorVariable(name: string) {
  return `rgb(var(${name}) / <alpha-value>)`
}

export default {
  theme: {
    colors: {
      primaryDark: cssColorVariable('--color-primary-dark'),
      primaryDeep: cssColorVariable('--color-primary-deep'),
      accentBlue: cssColorVariable('--color-accent-blue'),
      accentGlow: cssColorVariable('--color-accent-glow'),
      surfaceLight: cssColorVariable('--color-surface-light'),
      surfaceMuted: cssColorVariable('--color-surface-muted'),
      textPrimary: cssColorVariable('--color-text-primary'),
      textSecondary: cssColorVariable('--color-text-secondary'),
      success: cssColorVariable('--color-success'),
      warning: cssColorVariable('--color-warning'),
      danger: cssColorVariable('--color-danger'),
      brandBlue: cssColorVariable('--color-brand-blue'),
      brandGold: cssColorVariable('--color-brand-gold'),
      brandRed: cssColorVariable('--color-brand-red'),
      brandBlack: cssColorVariable('--color-brand-black'),
      brandWhite: cssColorVariable('--color-brand-white'),
      surface: cssColorVariable('--color-surface'),
      ink: cssColorVariable('--color-ink'),
      muted: cssColorVariable('--color-muted'),
      border: cssColorVariable('--color-border'),
      sidebarBg: cssColorVariable('--color-sidebar-bg'),
      sidebarInk: cssColorVariable('--color-sidebar-ink'),
      transparent: 'transparent',
      current: 'currentColor',
    },
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
    },
  },
} satisfies Config
