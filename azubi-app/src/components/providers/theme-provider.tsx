'use client'

import { createContext, useContext, useEffect, useState } from 'react'

// Theme-Typen definieren
type Theme = 'dark' | 'light' | 'system'

// Theme-Context definieren
interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'dark' | 'light'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Theme Provider Hook
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// Theme Provider Props
interface ThemeProviderProps {
  children: React.ReactNode
  attribute?: string
  defaultTheme?: Theme
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

// Theme Provider Komponente
export function ThemeProvider({
  children,
  attribute = 'data-theme',
  defaultTheme = 'system',
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  // Lokaler Theme-Zustand
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  
  // Aufgelöster Theme (dark/light)
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('light')

  // Theme anwenden
  useEffect(() => {
    const root = window.document.documentElement

    // Übergänge deaktivieren wenn gewünscht
    if (disableTransitionOnChange) {
      root.classList.add('!transition-none')
    }

    // Theme auf HTML-Element anwenden
    if (theme === 'system' && enableSystem) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      
      root.classList.remove('light', 'dark')
      root.classList.add(systemTheme)
      setResolvedTheme(systemTheme)
      
      // System-Theme-Änderungen überwachen
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? 'dark' : 'light'
        root.classList.remove('light', 'dark')
        root.classList.add(newTheme)
        setResolvedTheme(newTheme)
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      root.classList.remove('light', 'dark')
      root.classList.add(theme)
      setResolvedTheme(theme as 'dark' | 'light')
    }

    // Übergänge wieder aktivieren
    if (disableTransitionOnChange) {
      const timeout = setTimeout(() => {
        root.classList.remove('!transition-none')
      }, 0)
      return () => clearTimeout(timeout)
    }
  }, [theme, enableSystem, disableTransitionOnChange])

  // Theme im localStorage speichern
  useEffect(() => {
    if (theme !== 'system') {
      localStorage.setItem('theme', theme)
    } else {
      localStorage.removeItem('theme')
    }
  }, [theme])

  // Theme aus localStorage beim Laden wiederherstellen
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setTheme(savedTheme)
    }
  }, [])

  // Theme ändern
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
  }

  // Context-Wert
  const value: ThemeContextType = {
    theme,
    setTheme: handleThemeChange,
    resolvedTheme,
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
