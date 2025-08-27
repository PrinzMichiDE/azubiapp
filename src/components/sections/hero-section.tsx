'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { 
  ArrowRightIcon,
  PlayIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

// Hero-Section Komponente
export function HeroSection() {
  const t = useTranslations()

  // Features-Liste
  const features = [
    'Mehrsprachige Unterstützung (DE/EN)',
    'Moderne, intuitive Benutzeroberfläche',
    'Responsive Design für alle Geräte',
    'Dark/Light Mode',
    'Echtzeit-Updates',
    'Umfassende API-Integration'
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-950">
      {/* Hintergrund-Elemente */}
      <div className="absolute inset-0">
        {/* Dekorative Kreise */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 dark:bg-primary-800 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-bounce-gentle"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-accent-200 dark:bg-accent-800 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-success-200 dark:bg-success-800 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-bounce-gentle" style={{ animationDelay: '2s' }}></div>
        
        {/* Grid-Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center py-20 lg:py-32">
          {/* Haupt-Überschrift */}
          <div className="max-w-4xl mx-auto mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Moderne{' '}
              <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Projektmanagement
              </span>{' '}
              Plattform
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
              Eine intuitive, mehrsprachige Lösung für Teams aller Größen. 
              Verwalten Sie Projekte, Aufgaben und Zusammenarbeit mit modernster Technologie.
            </p>
          </div>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="group px-8 py-4 text-lg font-semibold shadow-soft hover:shadow-glow transform hover:-translate-y-1 transition-all duration-300"
            >
              Kostenlos starten
              <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg font-semibold group"
            >
              <PlayIcon className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              Demo ansehen
            </Button>
          </div>

          {/* Features-Liste */}
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CheckCircleIcon className="h-5 w-5 text-success-500 flex-shrink-0" />
                  <span className="text-sm font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Vertrauens-Indikatoren */}
          <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Vertraut von über 10.000+ Teams weltweit
            </p>
            
            {/* Logo-Grid */}
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="w-24 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 font-semibold text-sm">LOGO 1</span>
              </div>
              <div className="w-24 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 font-semibold text-sm">LOGO 2</span>
              </div>
              <div className="w-24 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 font-semibold text-sm">LOGO 3</span>
              </div>
              <div className="w-24 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                <span className="text-gray-500 dark:text-gray-400 font-semibold text-sm">LOGO 4</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll-Indikator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-gray-400 dark:border-gray-500 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-gray-400 dark:bg-gray-500 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  )
}
