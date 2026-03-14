/*
 * Replace hexes with exact values sampled from Strathmore website/brand guide.
 */
export const STRATHMORE = {
  blue: '#003A8C',
  gold: '#F2C230',
  red: '#B1121B',
  black: '#0B0D10',
  white: '#FFFFFF',
  offwhite: '#F4F7FF',
  ink: '#0B1730',
  muted: '#56657F',
  border: '#C5D0E3',
  navy2: '#001F54',
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
  sidebarAlt: string
  sidebarInk: string
  sidebarBorder: string
  sidebarHover: string
  sidebarActive: string
  sidebarAccent: string
  sidebarNotification: string
  sidebarNotificationInk: string
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
  sidebarBg: STRATHMORE.blue,
  sidebarAlt: STRATHMORE.navy2,
  sidebarInk: STRATHMORE.offwhite,
  sidebarBorder: '#365EAF',
  sidebarHover: '#0A4DB8',
  sidebarActive: '#145FCC',
  sidebarAccent: STRATHMORE.offwhite,
  sidebarNotification: STRATHMORE.red,
  sidebarNotificationInk: STRATHMORE.white,
}

const darkSemanticColors: SemanticPalette = {
  primaryDark: '#07142D',
  primaryDeep: '#0D2148',
  accentBlue: STRATHMORE.blue,
  accentGlow: STRATHMORE.gold,
  surfaceLight: '#F4F7FF',
  surfaceMuted: '#2D4777',
  textPrimary: '#F4F7FF',
  textSecondary: '#C7D4EC',
  success: STRATHMORE.blue,
  warning: STRATHMORE.gold,
  danger: STRATHMORE.red,
  brandBlue: STRATHMORE.blue,
  brandGold: STRATHMORE.gold,
  brandRed: STRATHMORE.red,
  brandBlack: STRATHMORE.black,
  brandWhite: STRATHMORE.white,
  surface: '#061126',
  ink: '#F4F7FF',
  muted: '#C7D4EC',
  border: '#28416D',
  sidebarBg: '#04102A',
  sidebarAlt: '#082050',
  sidebarInk: '#F4F7FF',
  sidebarBorder: '#28416D',
  sidebarHover: '#0E347A',
  sidebarActive: '#1452B5',
  sidebarAccent: '#F2C230',
  sidebarNotification: STRATHMORE.red,
  sidebarNotificationInk: STRATHMORE.white,
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
    '--sidebar-alt': palette.sidebarAlt,
    '--sidebar-ink': palette.sidebarInk,
    '--sidebar-border': palette.sidebarBorder,
    '--sidebar-hover': palette.sidebarHover,
    '--sidebar-active': palette.sidebarActive,
    '--sidebar-accent': palette.sidebarAccent,
    '--sidebar-notification': palette.sidebarNotification,
    '--sidebar-notification-ink': palette.sidebarNotificationInk,
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
    '--color-sidebar-alt': hexToRgbChannels(palette.sidebarAlt),
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
