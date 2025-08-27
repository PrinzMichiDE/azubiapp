import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n'

export default createMiddleware({
  // Verfügbare Sprachen
  locales,
  // Standardsprache
  defaultLocale,
  // Lokalisierung für alle Pfade außer API und statische Dateien
  localePrefix: 'as-needed',
})

export const config = {
  // Matcher für alle Pfade außer API, statische Dateien und Next.js interne Pfade
  matcher: [
    // Alle Pfade außer denen, die mit /api, /_next, /_vercel beginnen
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
