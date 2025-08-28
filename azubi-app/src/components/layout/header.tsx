'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth, usePermissions } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/providers/theme-provider'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Bars3Icon, 
  XMarkIcon,
  HomeIcon,
  ChartBarIcon,
  FolderIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentChartBarIcon,
  UsersIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'

// Header-Komponente
export function Header() {
  const t = useTranslations()
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const { resolvedTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  // Navigation-Items für authentifizierte Benutzer
  const { isAdmin } = usePermissions()
  const authenticatedNavigation = [
    {
      name: t('navigation.dashboard'),
      href: '/dashboard',
      icon: ChartBarIcon,
    },
    {
      name: t('navigation.projects'),
      href: '/projects',
      icon: FolderIcon,
    },
    {
      name: t('navigation.tasks'),
      href: '/tasks',
      icon: CheckCircleIcon,
    },
    {
      name: t('navigation.timeTracking'),
      href: '/time-tracking',
      icon: ClockIcon,
    },
    {
      name: t('navigation.reports'),
      href: '/reports',
      icon: DocumentChartBarIcon,
    },
    {
      name: t('navigation.team'),
      href: '/team',
      icon: UsersIcon,
    },
    ...(isAdmin() ? [{
      name: 'Admin Center',
      href: '/admin',
      icon: Cog6ToothIcon,
    }] : [])
  ]

  // Navigation-Items für nicht authentifizierte Benutzer
  const publicNavigation = [
    {
      name: t('navigation.home'),
      href: '/',
      icon: HomeIcon,
    },
    {
      name: t('navigation.features'),
      href: '#features',
      icon: CheckCircleIcon,
    },
    {
      name: t('navigation.pricing'),
      href: '#pricing',
      icon: DocumentChartBarIcon,
    }
  ]

  const navigation = isAuthenticated ? authenticatedNavigation : publicNavigation

  // Logout-Handler
  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Logout-Fehler:', error)
    }
  }

  // Profile-Menu schließen bei Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isProfileMenuOpen && !target.closest('.profile-menu')) {
        setIsProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isProfileMenuOpen])

  return (
    <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Azubi
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Language Switcher */}
            <LanguageSwitcher />

            {isAuthenticated ? (
              <>
                {/* Benachrichtigungen */}
                <Link href="/notifications">
                  <Button variant="ghost" size="sm" className="relative">
                    <BellIcon className="h-5 w-5" />
                    {/* Notification Badge */}
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
                  </Button>
                </Link>

                {/* Benutzer-Menu */}
                <div className="relative profile-menu">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 p-2 rounded-md transition-colors"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.firstName || user.username}
                        className="h-6 w-6 rounded-full"
                      />
                    ) : (
                      <UserCircleIcon className="h-6 w-6" />
                    )}
                    <span className="text-sm font-medium hidden sm:block">
                      {user?.firstName || user?.username}
                    </span>
                  </button>

                  {/* Dropdown-Menu */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user?.firstName && user?.lastName 
                              ? `${user.firstName} ${user.lastName}`
                              : user?.username
                            }
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user?.email}
                          </p>
                        </div>
                        
                        <Link
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <UserCircleIcon className="h-4 w-4 mr-2" />
                          Profil
                        </Link>
                        
                        <Link
                          href="/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          <Cog6ToothIcon className="h-4 w-4 mr-2" />
                          Einstellungen
                        </Link>
                        
                        <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                        
                        <button
                          onClick={() => {
                            setIsProfileMenuOpen(false)
                            handleLogout()
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                          Abmelden
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Anmelden/Registrieren Buttons für nicht authentifizierte Benutzer */
              <div className="flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    {t('auth.signIn')}
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">
                    {t('auth.signUp')}
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              
              {isAuthenticated && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserCircleIcon className="h-4 w-4" />
                    <span>Profil</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                    <span>Einstellungen</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleLogout()
                    }}
                    className="flex items-center space-x-2 w-full text-left text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    <span>Abmelden</span>
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}