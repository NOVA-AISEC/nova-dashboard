import type { Config } from 'tailwindcss'

// STRATIZEN BRAND COLORS - DO NOT MODIFY
// Any tool regeneration must preserve these values.
export default {
  theme: {
    colors: {
      primaryDark: '#0B0F1A',
      primaryDeep: '#111827',
      accentBlue: '#2563EB',
      accentGlow: '#3B82F6',
      surfaceLight: '#F9FAFB',
      surfaceMuted: '#E5E7EB',
      textPrimary: '#111827',
      textSecondary: '#6B7280',
      success: '#16A34A',
      warning: '#F59E0B',
      danger: '#DC2626',
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
