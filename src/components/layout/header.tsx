'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useTheme } from '@/components/providers/theme-provider'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { MobileMenu } from '@/components/ui/mobile-menu'
import { Button } from '@/components/ui/button'
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  ChartBarIcon,
  FolderIcon,
  CheckCircleIcon,
  CalendarIcon,
  DocumentChartBarIcon,
  UsersIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

// Header-Komponente
export function Header() {
  const t = useTranslations()
  const { resolvedTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Navigation-Items
  const navigation = [
    { name: t('navigation.home'), href: '/', icon: HomeIcon },
    { name: t('navigation.dashboard'), href: '/dashboard', icon: ChartBarIcon },
    { name: t('navigation.projects'), href: '/projects', icon: FolderIcon },
    { name: t('navigation.tasks'), href: '/tasks', icon: CheckCircleIcon },
    { name: t('navigation.calendar'), href: '/calendar', icon: CalendarIcon },
    { name: t('navigation.reports'), href: '/reports', icon: DocumentChartBarIcon },
    { name: t('navigation.users'), href: '/users', icon: UsersIcon },
    { name: t('navigation.administration'), href: '/admin', icon: Cog6ToothIcon },
  ]

  // Mobile Menu schließen
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="bg-white dark:bg-gray-800 shadow-soft border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo und Markenname */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Azubi
              </h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Sprachauswahl */}
            <LanguageSwitcher />
            
            {/* Theme-Toggle */}
            <ThemeToggle />
            
            {/* Anmelden/Registrieren Buttons */}
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                {t('auth.signIn')}
              </Button>
              <Button variant="primary" size="sm">
                {t('auth.signUp')}
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menü öffnen"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
        navigation={navigation}
        t={t}
      />
    </header>
  )
}
