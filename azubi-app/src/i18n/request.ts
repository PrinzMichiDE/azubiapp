import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

// Verfügbare Sprachen
export const locales = ['de', 'en'] as const
export type Locale = (typeof locales)[number]

// Standardsprache
export const defaultLocale: Locale = 'de'

// Sprachkonfiguration
export const localeConfig = {
  de: {
    name: 'Deutsch',
    flag: '🇩🇪',
  },
  en: {
    name: 'English',
    flag: '🇺🇸',
  },
} as const

// Middleware-Konfiguration
export default getRequestConfig(async ({ locale }) => {
  // Validiere, ob die angeforderte Sprache unterstützt wird
  if (!locales.includes(locale as Locale)) notFound()

  return {
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
