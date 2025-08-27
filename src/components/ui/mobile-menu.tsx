'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from './language-switcher'
import { ThemeToggle } from './theme-toggle'

// Mobile Menu Props
interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  navigation: Array<{
    name: string
    href: string
    icon: any
  }>
  t: any
}

// Mobile Menu Komponente
export function MobileMenu({ isOpen, onClose, navigation, t }: MobileMenuProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Mobile Menu */}
      <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-large z-50 lg:hidden transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Menü
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Menü schließen"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-4 space-y-2">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={onClose}
                className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
            {/* Theme und Sprache */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('common.theme')}
              </span>
              <ThemeToggle />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('common.language')}
              </span>
              <LanguageSwitcher />
            </div>

            {/* Anmelden/Registrieren */}
            <div className="space-y-3 pt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={onClose}
              >
                {t('auth.signIn')}
              </Button>
              <Button 
                className="w-full"
                onClick={onClose}
              >
                {t('auth.signUp')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
