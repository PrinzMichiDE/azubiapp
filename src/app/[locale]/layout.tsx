import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales } from '@/i18n'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { AuthProvider } from '@/contexts/AuthContext'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ToastProvider, Toaster } from '@/components/ui/toaster'
import '../globals.css'

// Inter Schriftart konfigurieren
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

// Metadaten für die Anwendung
export const metadata: Metadata = {
  title: {
    default: 'Azubi - Moderne Projektmanagement-Plattform',
    template: '%s | Azubi'
  },
  description: 'Eine moderne, mehrsprachige Projektmanagement-Plattform mit intuitiver Benutzeroberfläche und umfassenden Funktionen.',
  keywords: ['Projektmanagement', 'Aufgabenverwaltung', 'Teamarbeit', 'Produktivität', 'Deutsch', 'Englisch'],
  authors: [{ name: 'Azubi Team' }],
  creator: 'Azubi Team',
  publisher: 'Azubi',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
    languages: {
      'de': '/de',
      'en': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    alternateLocale: 'en_US',
    url: '/',
    title: 'Azubi - Moderne Projektmanagement-Plattform',
    description: 'Eine moderne, mehrsprachige Projektmanagement-Plattform mit intuitiver Benutzeroberfläche und umfassenden Funktionen.',
    siteName: 'Azubi',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Azubi - Projektmanagement-Plattform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Azubi - Moderne Projektmanagement-Plattform',
    description: 'Eine moderne, mehrsprachige Projektmanagement-Plattform mit intuitiver Benutzeroberfläche und umfassenden Funktionen.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-code',
  },
}

// Layout-Props definieren
interface LocaleLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

// Layout-Komponente
export default async function LocaleLayout({
  children,
  params: { locale }
}: LocaleLayoutProps) {
  // Validiere, ob die angeforderte Sprache unterstützt wird
  if (!locales.includes(locale as 'de' | 'en')) {
    notFound()
  }

  // Lade die Nachrichten für die aktuelle Sprache
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* NextIntl Provider für Internationalisierung */}
        <NextIntlClientProvider messages={messages}>
          {/* Theme Provider für Dark/Light Mode */}
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* React Query Provider für API-Zustandsverwaltung */}
            <QueryProvider>
              {/* Auth Provider für Authentifizierung */}
              <AuthProvider>
                {/* Toast Provider für Benachrichtigungen */}
                <ToastProvider>
                {/* Hauptcontainer */}
                <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                  {/* Header mit Navigation */}
                  <Header />
                  
                  {/* Hauptinhalt */}
                  <main className="flex-1">
                    {children}
                  </main>
                  
                  {/* Footer */}
                  <Footer />
                </div>
                
                {/* Toast-Benachrichtigungen */}
                <Toaster />
                </ToastProvider>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}

// Statische Generierung für alle unterstützten Sprachen
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}
