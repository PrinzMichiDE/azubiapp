'use client'

import { useTranslations } from 'next-intl'
import { 
  UsersIcon,
  FolderIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

// Stats-Section Komponente
export function StatsSection() {
  const t = useTranslations()

  // Statistiken
  const stats = [
    {
      icon: UsersIcon,
      value: '50,000+',
      label: 'Aktive Benutzer',
      description: 'Weltweit vertrauen uns Teams',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20'
    },
    {
      icon: FolderIcon,
      value: '100,000+',
      label: 'Projekte erstellt',
      description: 'Erfolgreich abgeschlossen',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20'
    },
    {
      icon: CheckCircleIcon,
      value: '2M+',
      label: 'Aufgaben erledigt',
      description: 'Mit unserer Plattform',
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20'
    },
    {
      icon: ClockIcon,
      value: '99.9%',
      label: 'Uptime',
      description: 'Zuverlässiger Service',
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20'
    }
  ]

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-950">
      <div className="container-custom">
        {/* Sektion-Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Vertraut von Teams weltweit
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Unsere Plattform hat sich als unverzichtbares Tool für erfolgreiche Teams etabliert. 
            Sehen Sie selbst, was wir erreicht haben.
          </p>
        </div>

        {/* Statistiken-Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="text-center group"
            >
              {/* Icon mit Hintergrund */}
              <div className={`w-16 h-16 rounded-2xl ${stat.bgColor} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className={`w-8 h-8 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
              </div>

              {/* Statistik-Wert */}
              <div className="mb-3">
                <span className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  {stat.value}
                </span>
              </div>

              {/* Statistik-Label */}
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {stat.label}
              </h3>

              {/* Statistik-Beschreibung */}
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        {/* Zusätzliche Statistiken */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Wachstum */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-soft border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📈</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Wachstum
                </h3>
                <p className="text-success-600 dark:text-success-400 font-medium">
                  +150% pro Jahr
                </p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Unsere Benutzerbasis wächst kontinuierlich, was die Qualität und Zuverlässigkeit unserer Plattform bestätigt.
            </p>
          </div>

          {/* Kundenzufriedenheit */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-soft border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Zufriedenheit
                </h3>
                <p className="text-primary-600 dark:text-primary-400 font-medium">
                  4.9/5 Sterne
                </p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Über 95% unserer Kunden empfehlen uns weiter und sind mit der Plattform sehr zufrieden.
            </p>
          </div>

          {/* Support */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-soft border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-accent-100 dark:bg-accent-900/30 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🛠️</span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Support
                </h3>
                <p className="text-accent-600 dark:text-accent-400 font-medium">
                  &lt; 2 Min
                </p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Unser Support-Team antwortet durchschnittlich in weniger als 2 Minuten auf alle Anfragen.
            </p>
          </div>
        </div>

        {/* Call-to-Action */}
        <div className="text-center mt-16">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-soft border border-gray-200 dark:border-gray-700 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Werden Sie Teil unserer Erfolgsgeschichte
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Schließen Sie sich tausenden von Teams an, die bereits erfolgreich mit unserer Plattform arbeiten.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors duration-200 shadow-soft hover:shadow-glow">
                Jetzt kostenlos testen
              </button>
              <button className="px-8 py-3 border-2 border-primary-600 text-primary-600 rounded-lg font-semibold hover:bg-primary-600 hover:text-white transition-all duration-200">
                Demo anfordern
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
