'use client'

import { useTheme } from '@/components/providers/theme-provider'
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'

// Theme Toggle Komponente
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  // Theme wechseln
  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  // Icon basierend auf aktuellem Theme
  const getThemeIcon = () => {
    if (theme === 'system') {
      return ComputerDesktopIcon
    } else if (theme === 'dark') {
      return MoonIcon
    } else {
      return SunIcon
    }
  }

  // Tooltip-Text
  const getTooltipText = () => {
    if (theme === 'system') {
      return `System (${resolvedTheme === 'dark' ? 'Dark' : 'Light'})`
    } else if (theme === 'dark') {
      return 'Dark Mode'
    } else {
      return 'Light Mode'
    }
  }

  const ThemeIcon = getThemeIcon()

  return (
    <button
      onClick={cycleTheme}
      className="p-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      aria-label={`Theme wechseln zu ${theme === 'light' ? 'Dark' : theme === 'dark' ? 'System' : 'Light'} Mode`}
      title={getTooltipText()}
    >
      <ThemeIcon className="w-5 h-5" />
    </button>
  )
}
