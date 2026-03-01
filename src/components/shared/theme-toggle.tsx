import { MoonStar, SunMedium } from 'lucide-react'
import { useThemeMode } from '@/hooks/use-theme-mode'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  compact?: boolean
}

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const { themeMode, toggleThemeMode } = useThemeMode()
  const nextMode = themeMode === 'light' ? 'dark' : 'light'

  return (
    <Button
      aria-label={`Switch to ${nextMode} mode`}
      className={cn(!compact && 'min-w-[7.5rem]', className)}
      size="sm"
      variant="outline"
      onClick={toggleThemeMode}
    >
      {themeMode === 'light' ? <MoonStar className="h-3.5 w-3.5" /> : <SunMedium className="h-3.5 w-3.5" />}
      {compact ? null : themeMode === 'light' ? 'Dark mode' : 'Light mode'}
    </Button>
  )
}
