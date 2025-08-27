'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { 
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

// CTA-Section Komponente
export function CTASection() {
  const t = useTranslations()

  // Vorteile der kostenlosen Testversion
  const benefits = [
    '14 Tage kostenlos testen',
    'Alle Premium-Features inklusive',
    'Unbegrenzte Projekte und Aufgaben',
    'Vollständiger Kundensupport',
    'Keine Kreditkarte erforderlich',
    'Jederzeit kündbar'
  ]

  // Vertrauens-Indikatoren
  const trustIndicators = [
    {
      icon: ShieldCheckIcon,
      text: 'DSGVO-konform',
      color: 'text-success-600 dark:text-success-400'
    },
    {
      icon: StarIcon,
      text: '4.9/5 Bewertung',
      color: 'text-warning-600 dark:text-warning-400'
    },
    {
      icon: CheckCircleIcon,
      text: '99.9% Uptime',
      color: 'text-primary-600 dark:text-primary-400'
    }
  ]

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 text-white">
      <div className="container-custom">
        <div className="text-center max-w-4xl mx-auto">
          {/* Haupt-Überschrift */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Bereit, Ihre Projektarbeit zu transformieren?
          </h2>
          
          <p className="text-xl text-gray-300 mb-12 leading-relaxed">
            Schließen Sie sich über 50.000 Teams an, die bereits erfolgreich mit Azubi arbeiten. 
            Starten Sie noch heute und erleben Sie den Unterschied.
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button 
              size="lg" 
              className="group px-8 py-4 text-lg font-semibold bg-white text-gray-900 hover:bg-gray-100 shadow-soft hover:shadow-glow transform hover:-translate-y-1 transition-all duration-300"
            >
              Kostenlos starten
              <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg font-semibold border-white text-white hover:bg-white hover:text-gray-900 group"
            >
              Demo anfordern
            </Button>
          </div>

          {/* Vorteile der kostenlosen Testversion */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-12 border border-white/20">
            <h3 className="text-2xl font-bold mb-6 text-white">
              Was ist in der kostenlosen Testversion enthalten?
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircleIcon className="w-5 h-5 text-success-400 flex-shrink-0" />
                  <span className="text-gray-200">{benefit}</span>
                </div>
              ))}
            </div>

            <p className="text-gray-300 text-sm">
              * Nach der Testversion können Sie jederzeit zu einem unserer erschwinglichen Pläne wechseln
            </p>
          </div>

          {/* Vertrauens-Indikatoren */}
          <div className="flex flex-wrap justify-center items-center gap-8 mb-12">
            {trustIndicators.map((indicator, index) => (
              <div key={index} className="flex items-center space-x-2">
                <indicator.icon className={`w-5 h-5 ${indicator.color}`} />
                <span className="text-gray-300 font-medium">{indicator.text}</span>
              </div>
            ))}
          </div>

          {/* Zusätzliche Informationen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-400 mb-2">
                &lt; 2 Min
              </div>
              <div className="text-gray-300">
                Setup-Zeit
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent-400 mb-2">
                24/7
              </div>
              <div className="text-gray-300">
                Kundensupport
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-success-400 mb-2">
                100%
              </div>
              <div className="text-gray-300">
                Datensicherheit
              </div>
            </div>
          </div>

          {/* Kontakt-Informationen */}
          <div className="mt-16 pt-8 border-t border-white/20">
            <p className="text-gray-400 mb-4">
              Haben Sie Fragen? Unser Team hilft Ihnen gerne weiter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
              <a 
                href="mailto:support@azubi.de" 
                className="text-primary-400 hover:text-primary-300 transition-colors duration-200"
              >
                support@azubi.de
              </a>
              <span className="text-gray-500">•</span>
              <a 
                href="tel:+49123456789" 
                className="text-primary-400 hover:text-primary-300 transition-colors duration-200"
              >
                +49 (0) 123 456789
              </a>
              <span className="text-gray-500">•</span>
              <a 
                href="/contact" 
                className="text-primary-400 hover:text-primary-300 transition-colors duration-200"
              >
                Kontaktformular
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Hintergrund-Elemente */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full mix-blend-multiply filter blur-xl animate-bounce-gentle"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-accent-500/20 rounded-full mix-blend-multiply filter blur-xl animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-success-500/20 rounded-full mix-blend-multiply filter blur-xl animate-bounce-gentle" style={{ animationDelay: '2s' }}></div>
      </div>
    </section>
  )
}
