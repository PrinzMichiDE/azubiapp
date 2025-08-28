/**
 * Animated Card-Komponente mit Framer Motion
 * Animated Card component with Framer Motion
 */
'use client'

import { motion, HTMLMotionProps, Variants } from 'framer-motion'
import { forwardRef, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AnimatedCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  variant?: 'default' | 'hover' | 'press' | 'focus' | 'bounce' | 'slide'
  delay?: number
  duration?: number
  className?: string
}

// Animation variants für verschiedene Interaktionen
const cardVariants: Record<string, Variants> = {
  default: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  },
  hover: {
    initial: { scale: 1 },
    whileHover: { 
      scale: 1.02,
      y: -2,
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
    whileTap: { scale: 0.98 }
  },
  press: {
    whileTap: { 
      scale: 0.95,
      transition: { duration: 0.1 }
    }
  },
  focus: {
    whileFocus: {
      scale: 1.01,
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    }
  },
  bounce: {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20
      }
    }
  },
  slide: {
    initial: { x: -100, opacity: 0 },
    animate: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    },
    exit: { x: 100, opacity: 0 }
  }
}

/**
 * Animated Card mit konfigurierbaren Animationen
 * Animated Card with configurable animations
 * 
 * Features:
 * - Verschiedene Animation-Varianten
 * - Touch-optimierte Interaktionen
 * - Performance-optimierte Animationen
 * - WCAG-konforme Focus-States
 * 
 * @param children - Karteninhalt / Card content
 * @param variant - Animation-Variante / Animation variant
 * @param delay - Animation-Verzögerung / Animation delay
 * @param duration - Animation-Dauer / Animation duration
 * @param className - Zusätzliche CSS-Klassen / Additional CSS classes
 */
export const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ children, variant = 'default', delay = 0, duration = 0.3, className, ...props }, ref) => {
    const animations = cardVariants[variant] || cardVariants.default

    return (
      <motion.div
        ref={ref}
        className={cn(
          // Base card styles
          'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700',
          'shadow-sm transition-colors duration-200',
          // Focus and accessibility
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          // Touch optimization
          'cursor-pointer select-none',
          className
        )}
        variants={animations}
        initial="initial"
        animate="animate"
        exit="exit"
        whileHover="whileHover"
        whileTap="whileTap"
        whileFocus="whileFocus"
        transition={{
          duration,
          delay,
          ease: 'easeOut'
        }}
        // Accessibility
        role="article"
        tabIndex={0}
        {...props}
      >
        {children}
      </motion.div>
    )
  }
)

AnimatedCard.displayName = 'AnimatedCard'
