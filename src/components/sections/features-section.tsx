'use client'

import { useTranslations } from 'next-intl'
import { 
  ChartBarIcon,
  FolderIcon,
  CheckCircleIcon,
  CalendarIcon,
  UsersIcon,
  CogIcon,
  ShieldCheckIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

// Features-Section Komponente
export function FeaturesSection() {
  const t = useTranslations()

  // Features-Liste
  const features = [
    {
      icon: ChartBarIcon,
      title: 'Dashboard & Übersicht',
      description: 'Behalten Sie den Überblick über alle Projekte und Aufgaben mit unserem intuitiven Dashboard.',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20'
    },
    {
      icon: FolderIcon,
      title: 'Projektverwaltung',
      description: 'Organisieren Sie Projekte effizient mit strukturierten Workflows und Fortschrittsverfolgung.',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20'
    },
    {
      icon: CheckCircleIcon,
      title: 'Aufgabenverwaltung',
      description: 'Verwalten Sie Aufgaben mit Prioritäten, Deadlines und Zuweisungen an Team-Mitglieder.',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20'
    },
    {
      icon: CalendarIcon,
      title: 'Kalender & Termine',
      description: 'Planen Sie Meetings, Deadlines und wichtige Ereignisse mit dem integrierten Kalender.',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20'
    },
    {
      icon: UsersIcon,
      title: 'Team-Zusammenarbeit',
      description: 'Fördern Sie die Zusammenarbeit mit Chat, Kommentaren und Datei-Sharing.',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-950/20'
    },
    {
      icon: CogIcon,
      title: 'Anpassbare Workflows',
      description: 'Passen Sie Prozesse und Workflows an Ihre spezifischen Anforderungen an.',
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/20'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Sicherheit & Compliance',
      description: 'Enterprise-Grade Sicherheit mit DSGVO-Compliance und rollenbasierter Zugriffskontrolle.',
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20'
    },
    {
      icon: RocketLaunchIcon,
      title: 'API & Integrationen',
      description: 'Umfassende API und Integrationen mit beliebten Tools und Diensten.',
      color: 'from-teal-500 to-teal-600',
      bgColor: 'bg-teal-50 dark:bg-teal-950/20'
    }
  ]

  return (
    <section className="py-20 lg:py-32 bg-white dark:bg-gray-900">
      <div className="container-custom">
        {/* Sektion-Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Alle Funktionen, die Sie brauchen
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Unsere Plattform bietet alles, was moderne Teams für erfolgreiche Projektarbeit benötigen. 
            Von der Planung bis zur Ausführung - alles an einem Ort.
          </p>
        </div>

        {/* Features-Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300 hover:shadow-medium hover:-translate-y-2 bg-white dark:bg-gray-800"
            >
              {/* Icon mit Hintergrund */}
              <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`} />
              </div>

              {/* Feature-Content */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>

              {/* Hover-Effekt */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary-500/5 to-accent-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Zusätzliche Features */}
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Linke Seite - Text */}
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Mehr als nur Projektmanagement
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Unsere Plattform geht über traditionelle Projektmanagement-Tools hinaus. 
              Wir bieten eine ganzheitliche Lösung, die Teams dabei hilft, effizienter zu arbeiten, 
              besser zu kommunizieren und erfolgreicher zu sein.
            </p>
            
            {/* Feature-Liste */}
            <div className="space-y-4">
              {[
                'Echtzeit-Zusammenarbeit mit Live-Updates',
                'Intelligente Automatisierung und Workflows',
                'Umfassende Berichte und Analysen',
                'Mobile App für unterwegs',
                'Offline-Funktionalität',
                'Multi-Cloud-Synchronisation'
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-5 h-5 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircleIcon className="w-3 h-3 text-success-600 dark:text-success-400" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rechte Seite - Visualisierung */}
          <div className="relative">
            <div className="relative z-10 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-3xl p-8 border border-primary-200 dark:border-primary-800">
              <div className="grid grid-cols-2 gap-4">
                {/* Mock-Dashboard-Elemente */}
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-soft">
                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="w-2/3 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-soft">
                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="w-1/2 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-soft">
                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="w-4/5 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-soft">
                  <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="w-1/3 h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
            
            {/* Hintergrund-Elemente */}
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-accent-200 dark:bg-accent-800 rounded-full opacity-20 blur-2xl"></div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-primary-200 dark:bg-primary-800 rounded-full opacity-20 blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
