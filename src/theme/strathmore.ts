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

export type ThemeMode = 'light' | 'dark'

type SemanticPalette = {
  primaryDark: string
  primaryDeep: string
  accentBlue: string
  accentGlow: string
  surfaceLight: string
  surfaceMuted: string
  textPrimary: string
  textSecondary: string
  success: string
  warning: string
  danger: string
  brandBlue: string
  brandGold: string
  brandRed: string
  brandBlack: string
  brandWhite: string
  surface: string
  ink: string
  muted: string
  border: string
  sidebarBg: string
  sidebarInk: string
}

const lightSemanticColors: SemanticPalette = {
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
}

const darkSemanticColors: SemanticPalette = {
  primaryDark: '#101722',
  primaryDeep: '#162033',
  accentBlue: STRATHMORE.blue,
  accentGlow: STRATHMORE.gold,
  surfaceLight: STRATHMORE.offwhite,
  surfaceMuted: '#2D3951',
  textPrimary: STRATHMORE.offwhite,
  textSecondary: '#C5BFB4',
  success: STRATHMORE.blue,
  warning: STRATHMORE.gold,
  danger: STRATHMORE.red,
  brandBlue: STRATHMORE.blue,
  brandGold: STRATHMORE.gold,
  brandRed: STRATHMORE.red,
  brandBlack: STRATHMORE.black,
  brandWhite: STRATHMORE.white,
  surface: STRATHMORE.black,
  ink: STRATHMORE.offwhite,
  muted: '#C5BFB4',
  border: '#2A354B',
  sidebarBg: '#061731',
  sidebarInk: STRATHMORE.offwhite,
}

export const strathmoreThemeModes: Record<ThemeMode, SemanticPalette> = {
  light: lightSemanticColors,
  dark: darkSemanticColors,
}

export const strathmoreSemanticColors = strathmoreThemeModes.light

export const THEME_STORAGE_KEY = 'nova-theme-mode'
export const THEME_CHANGE_EVENT = 'nova-theme-mode-change'

function hexToRgbChannels(hex: string) {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map((part) => `${part}${part}`).join('')
    : normalized

  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)

  return `${red} ${green} ${blue}`
}

function buildThemeVariables(mode: ThemeMode) {
  const palette = strathmoreThemeModes[mode]

  return {
    '--brand-blue': STRATHMORE.blue,
    '--brand-gold': STRATHMORE.gold,
    '--brand-red': STRATHMORE.red,
    '--brand-black': STRATHMORE.black,
    '--brand-white': STRATHMORE.white,
    '--surface': palette.surface,
    '--ink': palette.ink,
    '--muted': palette.muted,
    '--border': palette.border,
    '--sidebar-bg': palette.sidebarBg,
    '--sidebar-ink': palette.sidebarInk,
    '--primary-dark': palette.primaryDark,
    '--primary-deep': palette.primaryDeep,
    '--surface-light': palette.surfaceLight,
    '--surface-muted': palette.surfaceMuted,
    '--text-primary': palette.textPrimary,
    '--text-secondary': palette.textSecondary,
    '--success': palette.success,
    '--warning': palette.warning,
    '--danger': palette.danger,
    '--ring': STRATHMORE.gold,
    '--link': STRATHMORE.blue,
    '--color-primary-dark': hexToRgbChannels(palette.primaryDark),
    '--color-primary-deep': hexToRgbChannels(palette.primaryDeep),
    '--color-accent-blue': hexToRgbChannels(palette.accentBlue),
    '--color-accent-glow': hexToRgbChannels(palette.accentGlow),
    '--color-surface-light': hexToRgbChannels(palette.surfaceLight),
    '--color-surface-muted': hexToRgbChannels(palette.surfaceMuted),
    '--color-text-primary': hexToRgbChannels(palette.textPrimary),
    '--color-text-secondary': hexToRgbChannels(palette.textSecondary),
    '--color-success': hexToRgbChannels(palette.success),
    '--color-warning': hexToRgbChannels(palette.warning),
    '--color-danger': hexToRgbChannels(palette.danger),
    '--color-brand-blue': hexToRgbChannels(palette.brandBlue),
    '--color-brand-gold': hexToRgbChannels(palette.brandGold),
    '--color-brand-red': hexToRgbChannels(palette.brandRed),
    '--color-brand-black': hexToRgbChannels(palette.brandBlack),
    '--color-brand-white': hexToRgbChannels(palette.brandWhite),
    '--color-surface': hexToRgbChannels(palette.surface),
    '--color-ink': hexToRgbChannels(palette.ink),
    '--color-muted': hexToRgbChannels(palette.muted),
    '--color-border': hexToRgbChannels(palette.border),
    '--color-sidebar-bg': hexToRgbChannels(palette.sidebarBg),
    '--color-sidebar-ink': hexToRgbChannels(palette.sidebarInk),
  } as const
}

export const strathmoreCssVariables = buildThemeVariables('light')

export function getStoredThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'dark' ? 'dark' : 'light'
}

export function setStoredThemeMode(mode: ThemeMode) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, mode)
  window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_CHANGE_EVENT, { detail: mode }))
}

export function applyStrathmoreTheme(
  mode: ThemeMode = 'light',
  target: HTMLElement = document.documentElement,
) {
  target.dataset.theme = mode
  target.style.colorScheme = mode

  for (const [name, value] of Object.entries(buildThemeVariables(mode))) {
    target.style.setProperty(name, value)
  }
}
