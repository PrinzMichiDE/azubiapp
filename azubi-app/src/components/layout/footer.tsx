'use client'

import { useTranslations } from 'next-intl'
import { 
  HeartIcon,
  GlobeAltIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'

// Footer-Komponente
export function Footer() {
  const t = useTranslations()
  const currentYear = new Date().getFullYear()

  // Footer-Links
  const footerLinks = {
    product: [
      { name: t('navigation.dashboard'), href: '/dashboard' },
      { name: t('navigation.projects'), href: '/projects' },
      { name: t('navigation.tasks'), href: '/tasks' },
      { name: t('navigation.calendar'), href: '/calendar' },
      { name: t('navigation.reports'), href: '/reports' },
    ],
    company: [
      { name: 'Über uns', href: '/about' },
      { name: 'Karriere', href: '/careers' },
      { name: 'Presse', href: '/press' },
      { name: 'Blog', href: '/blog' },
      { name: 'Partner', href: '/partners' },
    ],
    support: [
      { name: 'Hilfe-Center', href: '/help' },
      { name: 'Dokumentation', href: '/docs' },
      { name: 'API-Referenz', href: '/api' },
      { name: 'Community', href: '/community' },
      { name: 'Status', href: '/status' },
    ],
    legal: [
      { name: 'Datenschutz', href: '/privacy' },
      { name: 'Nutzungsbedingungen', href: '/terms' },
      { name: 'Cookie-Richtlinie', href: '/cookies' },
      { name: 'Impressum', href: '/imprint' },
      { name: 'AGB', href: '/agb' },
    ],
  }

  // Social Media Links
  const socialLinks = [
    { name: 'Twitter', href: 'https://twitter.com/azubi', icon: '🐦' },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/azubi', icon: '💼' },
    { name: 'GitHub', href: 'https://github.com/azubi', icon: '🐙' },
    { name: 'YouTube', href: 'https://youtube.com/@azubi', icon: '📺' },
  ]

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="container-custom">
        {/* Haupt-Footer-Bereich */}
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Logo und Beschreibung */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">A</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Azubi
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                Eine moderne, mehrsprachige Projektmanagement-Plattform mit intuitiver 
                Benutzeroberfläche und umfassenden Funktionen für Teams aller Größen.
              </p>
              
              {/* Kontakt-Informationen */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <GlobeAltIcon className="h-4 w-4" />
                  <span>www.azubi.de</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <PhoneIcon className="h-4 w-4" />
                  <span>+49 (0) 123 456789</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <EnvelopeIcon className="h-4 w-4" />
                  <span>info@azubi.de</span>
                </div>
              </div>
            </div>

            {/* Produkt-Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                Produkt
              </h3>
              <ul className="space-y-2">
                {footerLinks.product.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Unternehmen-Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                Unternehmen
              </h3>
              <ul className="space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support-Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                Support
              </h3>
              <ul className="space-y-2">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Rechtliche Links */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                Rechtliches
              </h3>
              <ul className="space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Unterer Footer-Bereich */}
        <div className="py-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>© {currentYear} Azubi. Alle Rechte vorbehalten.</span>
              <span>•</span>
              <span>Mit</span>
              <HeartIcon className="h-4 w-4 text-red-500" />
              <span>aus Deutschland</span>
            </div>

            {/* Social Media Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                  aria-label={social.name}
                >
                  <span className="text-lg">{social.icon}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
