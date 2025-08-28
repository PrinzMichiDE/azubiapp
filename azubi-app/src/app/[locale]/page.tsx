import { useTranslations } from 'next-intl'
import { HeroSection } from '@/components/sections/hero-section'
import { FeaturesSection } from '@/components/sections/features-section'
import { StatsSection } from '@/components/sections/stats-section'
import { CTASection } from '@/components/sections/cta-section'
import { TestimonialsSection } from '@/components/sections/testimonials-section'

// Hauptseite der Anwendung
export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero-Bereich */}
      <HeroSection />
      
      {/* Features-Bereich */}
      <FeaturesSection />
      
      {/* Statistiken */}
      <StatsSection />
      
      {/* Testimonials */}
      <TestimonialsSection />
      
      {/* Call-to-Action */}
      <CTASection />
    </div>
  )
}
