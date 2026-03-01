import type { Config } from 'tailwindcss'
import { strathmoreSemanticColors } from './src/theme/strathmore'

export default {
  theme: {
    colors: {
      primaryDark: strathmoreSemanticColors.primaryDark,
      primaryDeep: strathmoreSemanticColors.primaryDeep,
      accentBlue: strathmoreSemanticColors.accentBlue,
      accentGlow: strathmoreSemanticColors.accentGlow,
      surfaceLight: strathmoreSemanticColors.surfaceLight,
      surfaceMuted: strathmoreSemanticColors.surfaceMuted,
      textPrimary: strathmoreSemanticColors.textPrimary,
      textSecondary: strathmoreSemanticColors.textSecondary,
      success: strathmoreSemanticColors.success,
      warning: strathmoreSemanticColors.warning,
      danger: strathmoreSemanticColors.danger,
      brandBlue: strathmoreSemanticColors.brandBlue,
      brandGold: strathmoreSemanticColors.brandGold,
      brandRed: strathmoreSemanticColors.brandRed,
      brandBlack: strathmoreSemanticColors.brandBlack,
      brandWhite: strathmoreSemanticColors.brandWhite,
      surface: strathmoreSemanticColors.surface,
      ink: strathmoreSemanticColors.ink,
      muted: strathmoreSemanticColors.muted,
      border: strathmoreSemanticColors.border,
      sidebarBg: strathmoreSemanticColors.sidebarBg,
      sidebarInk: strathmoreSemanticColors.sidebarInk,
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
