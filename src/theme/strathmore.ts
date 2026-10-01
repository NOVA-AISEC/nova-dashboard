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
  "primaryDark": "#f8f9fa",
  "primaryDeep": "#ffffff",
  "accentBlue": "#eb743b",
  "accentGlow": "#eb743b",
  "surfaceLight": "#ffffff",
  "surfaceMuted": "#e8e9ed",
  "textPrimary": "#252a34",
  "textSecondary": "#777e8b",
  "success": "#359679",
  "warning": "#d79645",
  "danger": "#dc5856",
  "brandBlue": "#003A8C",
  "brandGold": "#F2C230",
  "brandRed": "#B1121B",
  "brandBlack": "#0B0D10",
  "brandWhite": "#FFFFFF",
  "surface": "#f7f8fa",
  "ink": "#252a34",
  "muted": "#777e8b",
  "border": "#e8e9ed",
  "sidebarBg": "#20242c",
  "sidebarAlt": "#292e37",
  "sidebarInk": "#b6bac3",
  "sidebarBorder": "#343943",
  "sidebarHover": "#2c323c",
  "sidebarActive": "#45342e",
  "sidebarAccent": "#f39a6a",
  "sidebarNotification": "#f29c80",
  "sidebarNotificationInk": "#513631"
}

const darkSemanticColors: SemanticPalette = {
  "primaryDark": "#222730",
  "primaryDeep": "#1c2027",
  "accentBlue": "#ef8b59",
  "accentGlow": "#ef8b59",
  "surfaceLight": "#e7e9ee",
  "surfaceMuted": "#30353e",
  "textPrimary": "#e7e9ee",
  "textSecondary": "#939aa7",
  "success": "#359679",
  "warning": "#d79645",
  "danger": "#dc5856",
  "brandBlue": "#003A8C",
  "brandGold": "#F2C230",
  "brandRed": "#B1121B",
  "brandBlack": "#0B0D10",
  "brandWhite": "#FFFFFF",
  "surface": "#15191f",
  "ink": "#e7e9ee",
  "muted": "#939aa7",
  "border": "#30353e",
  "sidebarBg": "#20242c",
  "sidebarAlt": "#292e37",
  "sidebarInk": "#b6bac3",
  "sidebarBorder": "#343943",
  "sidebarHover": "#2c323c",
  "sidebarActive": "#45342e",
  "sidebarAccent": "#f39a6a",
  "sidebarNotification": "#f29c80",
  "sidebarNotificationInk": "#513631"
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
    '--ring': palette.accentGlow,
    '--link': palette.accentBlue,
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
