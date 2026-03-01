import { useEffect, useState } from 'react'
import {
  applyStrathmoreTheme,
  getStoredThemeMode,
  setStoredThemeMode,
  THEME_CHANGE_EVENT,
  type ThemeMode,
} from '@/theme/strathmore'

export function useThemeMode() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getStoredThemeMode())

  useEffect(() => {
    applyStrathmoreTheme(themeMode)
    setStoredThemeMode(themeMode)
  }, [themeMode])

  useEffect(() => {
    function syncThemeMode(event?: Event) {
      if (event instanceof CustomEvent) {
        setThemeMode(event.detail as ThemeMode)
        return
      }

      setThemeMode(getStoredThemeMode())
    }

    window.addEventListener(THEME_CHANGE_EVENT, syncThemeMode)
    window.addEventListener('storage', syncThemeMode)

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, syncThemeMode)
      window.removeEventListener('storage', syncThemeMode)
    }
  }, [])

  return {
    themeMode,
    setThemeMode,
    toggleThemeMode() {
      setThemeMode((current) => (current === 'light' ? 'dark' : 'light'))
    },
  }
}
