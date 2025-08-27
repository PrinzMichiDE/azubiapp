import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility-Funktion zum Zusammenführen von CSS-Klassen
 * Kombiniert clsx und tailwind-merge für optimale Klassenzusammenführung
 * 
 * @param inputs - CSS-Klassen als Strings, Arrays oder Objekte
 * @returns Zusammengeführte CSS-Klassen als String
 * 
 * @example
 * cn('px-2 py-1', 'bg-red-500', { 'text-white': true, 'rounded': false })
 * // => 'px-2 py-1 bg-red-500 text-white'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Verzögerung für asynchrone Operationen
 * 
 * @param ms - Verzögerung in Millisekunden
 * @returns Promise, der nach der angegebenen Zeit aufgelöst wird
 * 
 * @example
 * await delay(1000) // 1 Sekunde warten
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generiert eine zufällige ID
 * 
 * @param length - Länge der ID (Standard: 8)
 * @returns Zufällige ID als String
 * 
 * @example
 * generateId() // => 'a1b2c3d4'
 * generateId(16) // => 'a1b2c3d4e5f6g7h8'
 */
export function generateId(length: number = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Formatiert einen Datumswert
 * 
 * @param date - Datum als Date, String oder Number
 * @param locale - Locale für die Formatierung (Standard: 'de-DE')
 * @param options - Formatierungsoptionen
 * @returns Formatierter Datumsstring
 * 
 * @example
 * formatDate(new Date()) // => '27.08.2025'
 * formatDate(new Date(), 'en-US') // => '8/27/2025'
 */
export function formatDate(
  date: Date | string | number,
  locale: string = 'de-DE',
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = new Date(date)
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...options,
  }
  
  return new Intl.DateTimeFormat(locale, defaultOptions).format(dateObj)
}

/**
 * Formatiert eine Zahl
 * 
 * @param number - Zu formatierende Zahl
 * @param locale - Locale für die Formatierung (Standard: 'de-DE')
 * @param options - Formatierungsoptionen
 * @returns Formatierter Zahlenstring
 * 
 * @example
 * formatNumber(1234.56) // => '1.234,56'
 * formatNumber(1234.56, 'en-US') // => '1,234.56'
 */
export function formatNumber(
  number: number,
  locale: string = 'de-DE',
  options: Intl.NumberFormatOptions = {}
): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }
  
  return new Intl.NumberFormat(locale, defaultOptions).format(number)
}

/**
 * Formatiert eine Währung
 * 
 * @param amount - Betrag
 * @param currency - Währungscode (Standard: 'EUR')
 * @param locale - Locale für die Formatierung (Standard: 'de-DE')
 * @returns Formatierter Währungsstring
 * 
 * @example
 * formatCurrency(1234.56) // => '1.234,56 €'
 * formatCurrency(1234.56, 'USD', 'en-US') // => '$1,234.56'
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'de-DE'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Kürzt einen Text auf die angegebene Länge
 * 
 * @param text - Zu kürzender Text
 * @param maxLength - Maximale Länge
 * @param suffix - Suffix für gekürzten Text (Standard: '...')
 * @returns Gekürzter Text
 * 
 * @example
 * truncateText('Dies ist ein langer Text', 20) // => 'Dies ist ein langer...'
 */
export function truncateText(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - suffix.length) + suffix
}

/**
 * Validiert eine E-Mail-Adresse
 * 
 * @param email - Zu validierende E-Mail-Adresse
 * @returns true wenn gültig, false wenn ungültig
 * 
 * @example
 * isValidEmail('test@example.com') // => true
 * isValidEmail('invalid-email') // => false
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Entfernt HTML-Tags aus einem String
 * 
 * @param html - HTML-String
 * @returns Bereinigter Text ohne HTML-Tags
 * 
 * @example
 * stripHtml('<p>Text mit <strong>HTML</strong></p>') // => 'Text mit HTML'
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

/**
 * Debounce-Funktion für häufige Aufrufe
 * 
 * @param func - Zu debouncende Funktion
 * @param wait - Wartezeit in Millisekunden
 * @returns Debounced-Funktion
 * 
 * @example
 * const debouncedSearch = debounce(searchFunction, 300)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle-Funktion für häufige Aufrufe
 * 
 * @param func - Zu throttlende Funktion
 * @param limit - Zeitlimit in Millisekunden
 * @returns Throttled-Funktion
 * 
 * @example
 * const throttledScroll = throttle(scrollFunction, 100)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
