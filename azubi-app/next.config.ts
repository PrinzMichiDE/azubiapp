import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  // Optimierte Performance-Einstellungen
  experimental: {
    optimizePackageImports: ['lucide-react', '@headlessui/react'],
  },
  // Bildoptimierung
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  // Umgebungsvariablen
          env: {
          NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:8080',
        },
}

export default withNextIntl(nextConfig)
