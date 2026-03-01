/*
 * Replace hexes with exact values sampled from Strathmore website/brand guide.
 */
export const STRATHMORE = {
  blue: '#02338D', // TODO confirm against official Strathmore Blue
  gold: '#CC9C4A', // TODO confirm against official Strathmore gold
  red: '#970400', // TODO confirm against official Strathmore red
  black: '#0B0D10',
  white: '#FFFFFF',
  offwhite: '#F6F2EA',
  ink: '#101318',
  muted: '#5B616B',
  border: '#D8D2C8',
  navy2: '#081F42', // helper for sidebar depth
} as const

export const strathmoreSemanticColors = {
  primaryDark: STRATHMORE.offwhite,
  primaryDeep: STRATHMORE.white,
  accentBlue: STRATHMORE.blue,
  accentGlow: STRATHMORE.gold,
  surfaceLight: STRATHMORE.white,
  surfaceMuted: STRATHMORE.border,
  textPrimary: STRATHMORE.ink,
  textSecondary: STRATHMORE.muted,
  success: STRATHMORE.blue,
  warning: STRATHMORE.gold,
  danger: STRATHMORE.red,
  brandBlue: STRATHMORE.blue,
  brandGold: STRATHMORE.gold,
  brandRed: STRATHMORE.red,
  brandBlack: STRATHMORE.black,
  brandWhite: STRATHMORE.white,
  surface: STRATHMORE.offwhite,
  ink: STRATHMORE.ink,
  muted: STRATHMORE.muted,
  border: STRATHMORE.border,
  sidebarBg: STRATHMORE.navy2,
  sidebarInk: STRATHMORE.offwhite,
} as const

export const strathmoreCssVariables = {
  '--brand-blue': STRATHMORE.blue,
  '--brand-gold': STRATHMORE.gold,
  '--brand-red': STRATHMORE.red,
  '--brand-black': STRATHMORE.black,
  '--brand-white': STRATHMORE.white,
  '--surface': STRATHMORE.offwhite,
  '--ink': STRATHMORE.ink,
  '--muted': STRATHMORE.muted,
  '--border': STRATHMORE.border,
  '--sidebar-bg': STRATHMORE.navy2,
  '--sidebar-ink': STRATHMORE.offwhite,
  '--ring': 'var(--brand-gold)',
  '--link': 'var(--brand-blue)',
} as const

export function applyStrathmoreTheme(target: HTMLElement = document.documentElement) {
  for (const [name, value] of Object.entries(strathmoreCssVariables)) {
    target.style.setProperty(name, value)
  }
}
