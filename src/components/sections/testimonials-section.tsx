'use client'

import { useTranslations } from 'next-intl'
import { StarIcon } from '@heroicons/react/24/solid'

// Testimonials-Section Komponente
export function TestimonialsSection() {
  const t = useTranslations()

  // Testimonials-Liste
  const testimonials = [
    {
      name: 'Sarah Müller',
      role: 'Projektmanagerin',
      company: 'TechCorp GmbH',
      avatar: '👩‍💼',
      rating: 5,
      text: 'Azubi hat unsere Projektarbeit komplett revolutioniert. Die intuitive Benutzeroberfläche und die umfassenden Funktionen haben uns geholfen, unsere Effizienz um 40% zu steigern.',
      logo: '🏢'
    },
    {
      name: 'Michael Schmidt',
      role: 'Team Lead',
      company: 'Innovation Labs',
      avatar: '👨‍💻',
      rating: 5,
      text: 'Als Team Lead schätze ich besonders die Echtzeit-Updates und die Möglichkeit, den Fortschritt aller Projekte auf einen Blick zu sehen. Ein fantastisches Tool!',
      logo: '🔬'
    },
    {
      name: 'Lisa Weber',
      role: 'Produktmanagerin',
      company: 'StartupXYZ',
      avatar: '👩‍🎨',
      rating: 5,
      text: 'Die mehrsprachige Unterstützung war ein wichtiger Faktor für uns. Unser internationales Team kann jetzt nahtlos zusammenarbeiten.',
      logo: '🚀'
    },
    {
      name: 'Thomas Fischer',
      role: 'CTO',
      company: 'Enterprise Solutions',
      avatar: '👨‍🔬',
      rating: 5,
      text: 'Die API-Integration und die Sicherheitsfeatures haben uns überzeugt. Enterprise-Grade Qualität zu einem fairen Preis.',
      logo: '🏛️'
    },
    {
      name: 'Anna Klein',
      role: 'Scrum Master',
      company: 'Agile Teams',
      avatar: '👩‍🏫',
      rating: 5,
      text: 'Perfekt für agile Teams! Die Sprint-Planung und das Backlog-Management sind intuitiv und effizient.',
      logo: '🔄'
    },
    {
      name: 'David Wagner',
      role: 'Geschäftsführer',
      company: 'Digital Agency',
      avatar: '👨‍💼',
      rating: 5,
      text: 'Seit wir Azubi nutzen, haben wir unsere Projektabschlussrate von 65% auf 92% gesteigert. Ein echter Game-Changer!',
      logo: '🎯'
    }
  ]

  return (
    <section className="py-20 lg:py-32 bg-white dark:bg-gray-900">
      <div className="container-custom">
        {/* Sektion-Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Was unsere Kunden sagen
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Überzeugen Sie sich selbst von der Qualität unserer Plattform. 
            Hier sind echte Bewertungen von zufriedenen Kunden.
          </p>
        </div>

        {/* Testimonials-Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-soft border border-gray-200 dark:border-gray-700 hover:shadow-medium hover:-translate-y-2 transition-all duration-300 group"
            >
              {/* Bewertung */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Testimonial-Text */}
              <blockquote className="text-gray-700 dark:text-gray-300 mb-6 italic leading-relaxed">
                "{testimonial.text}"
              </blockquote>

              {/* Kunde-Info */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 rounded-full flex items-center justify-center text-2xl">
                  {testimonial.avatar}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {testimonial.role}
                  </div>
                </div>
                <div className="text-3xl">
                  {testimonial.logo}
                </div>
              </div>

              {/* Unternehmen */}
              <div className="mt-3 text-sm text-gray-500 dark:text-gray-500 font-medium">
                {testimonial.company}
              </div>
            </div>
          ))}
        </div>

        {/* Zusätzliche Statistiken */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              98%
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Kundenempfehlungsrate
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-success-600 dark:text-success-400 mb-2">
              4.9/5
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Durchschnittliche Bewertung
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-accent-600 dark:text-accent-400 mb-2">
              24/7
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Kundensupport
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-warning-600 dark:text-warning-400 mb-2">
              99.9%
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              Plattform-Verfügbarkeit
            </div>
          </div>
        </div>

        {/* Call-to-Action */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-3xl p-8 text-white max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">
              Bereit für den nächsten Schritt?
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Schließen Sie sich tausenden zufriedener Kunden an und transformieren Sie Ihre Projektarbeit.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 shadow-soft">
                Kostenlos starten
              </button>
              <button className="px-8 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-all duration-200">
                Mehr erfahren
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
