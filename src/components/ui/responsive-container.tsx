/**
 * Responsive Container Component für mobile-first Design
 * Mobile-First Responsive Container Component for mobile-first design
 */
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'fullwidth' | 'narrow' | 'wide'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * Responsive Container-Komponente mit Mobile-First Ansatz
 * Responsive Container component with mobile-first approach
 * 
 * Features:
 * - Mobile-First Design (min. 320px width support)
 * - Touch-optimierte Mindestabstände
 * - WCAG-konforme Abstände
 * 
 * @param children - Inhalt des Containers / Container content
 * @param className - Zusätzliche CSS-Klassen / Additional CSS classes
 * @param variant - Container-Variante / Container variant
 * @param padding - Innenabstand / Inner padding
 */
export function ResponsiveContainer({ 
  children, 
  className,
  variant = 'default',
  padding = 'md'
}: ResponsiveContainerProps) {
  const baseClasses = 'w-full mx-auto'
  
  const variantClasses = {
    default: 'max-w-7xl',
    fullwidth: 'max-w-full',
    narrow: 'max-w-4xl',
    wide: 'max-w-screen-2xl'
  }
  
  const paddingClasses = {
    none: '',
    sm: 'px-4 py-2 md:px-6 md:py-3 lg:px-8 lg:py-4',
    md: 'px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8',
    lg: 'px-4 py-6 md:px-8 md:py-8 lg:px-12 lg:py-12',
    xl: 'px-4 py-8 md:px-12 md:py-12 lg:px-16 lg:py-16'
  }

  return (
    <div className={cn(
      baseClasses,
      variantClasses[variant],
      paddingClasses[padding],
      // Mobile-First responsive design
      'min-w-0', // Verhindert Overflow
      className
    )}>
      {children}
    </div>
  )
}
