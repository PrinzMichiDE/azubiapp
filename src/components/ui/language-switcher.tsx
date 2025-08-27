'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { locales, localeConfig } from '@/i18n'
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

// Language Switcher Komponente
export function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()

  // Dropdown schließen wenn außerhalb geklickt wird
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sprache wechseln
  const switchLanguage = (locale: string) => {
    setIsOpen(false)
    
    // Aktuelle Route ohne Locale-Prefix extrahieren
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/'
    
    // Neue Route mit neuem Locale
    const newPath = locale === 'de' ? pathWithoutLocale : `/${locale}${pathWithoutLocale}`
    
    router.push(newPath)
  }

  // Aktuelle Sprache
  const currentLanguage = localeConfig[currentLocale as keyof typeof localeConfig]

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Language Switcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
        aria-label="Sprache wechseln"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <GlobeAltIcon className="w-4 h-4" />
        <span className="hidden sm:block">{currentLanguage.name}</span>
        <span className="sm:hidden">{currentLanguage.flag}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-large border border-gray-200 dark:border-gray-700 py-2 z-50">
          {locales.map((locale) => {
            const language = localeConfig[locale]
            const isActive = locale === currentLocale
            
            return (
              <button
                key={locale}
                onClick={() => switchLanguage(locale)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left text-sm transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span className="font-medium">{language.name}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-primary-600 dark:bg-primary-400 rounded-full"></div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
