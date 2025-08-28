/**
 * Progress Ring-Komponente für Learning Progress
 * Progress Ring component for learning progress
 */
'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ProgressRingProps {
  progress: number // 0-100
  size?: 'sm' | 'md' | 'lg' | 'xl'
  thickness?: 'thin' | 'medium' | 'thick'
  color?: 'primary' | 'success' | 'warning' | 'gamification'
  showPercentage?: boolean
  showLabel?: boolean
  label?: string
  animated?: boolean
  className?: string
}

/**
 * Animierter Progress Ring für Lernfortschritt
 * Animated Progress Ring for learning progress
 * 
 * Features:
 * - Smooth Animationen mit CSS Transitions
 * - Verschiedene Größen und Farben
 * - Gamification-Farben
 * - ARIA-Labels für Accessibility
 * 
 * @param progress - Fortschritt in Prozent (0-100) / Progress in percent (0-100)
 * @param size - Ring-Größe / Ring size
 * @param thickness - Ring-Dicke / Ring thickness
 * @param color - Farb-Theme / Color theme
 * @param showPercentage - Prozentsatz anzeigen / Show percentage
 * @param showLabel - Label anzeigen / Show label
 * @param label - Benutzerdefiniertes Label / Custom label
 * @param animated - Animation aktivieren / Enable animation
 */
export function ProgressRing({
  progress,
  size = 'md',
  thickness = 'medium',
  color = 'primary',
  showPercentage = true,
  showLabel = false,
  label,
  animated = true,
  className
}: ProgressRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  // Animate progress on mount
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setAnimatedProgress(progress)
    }
  }, [progress, animated])

  // Size configurations
  const sizeConfig = {
    sm: { 
      radius: 16, 
      stroke: 2, 
      fontSize: 'text-xs',
      container: 'w-10 h-10'
    },
    md: { 
      radius: 24, 
      stroke: 3, 
      fontSize: 'text-sm',
      container: 'w-14 h-14'
    },
    lg: { 
      radius: 32, 
      stroke: 4, 
      fontSize: 'text-base',
      container: 'w-20 h-20'
    },
    xl: { 
      radius: 48, 
      stroke: 6, 
      fontSize: 'text-lg',
      container: 'w-28 h-28'
    }
  }

  // Thickness adjustments
  const thicknessMultiplier = {
    thin: 0.7,
    medium: 1,
    thick: 1.5
  }

  // Color configurations
  const colorConfig = {
    primary: {
      stroke: 'stroke-primary-500',
      text: 'text-primary-600 dark:text-primary-400'
    },
    success: {
      stroke: 'stroke-success-500',
      text: 'text-success-600 dark:text-success-400'
    },
    warning: {
      stroke: 'stroke-warning-500',
      text: 'text-warning-600 dark:text-warning-400'
    },
    gamification: {
      stroke: 'stroke-gamification-xp',
      text: 'text-gamification-xp'
    }
  }

  const config = sizeConfig[size]
  const adjustedStroke = config.stroke * thicknessMultiplier[thickness]
  const normalizedRadius = config.radius - adjustedStroke * 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDasharray = `${circumference} ${circumference}`
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference

  return (
    <div className={cn(
      'relative inline-flex items-center justify-center',
      config.container,
      className
    )}>
      {/* SVG Ring */}
      <svg
        className="w-full h-full transform -rotate-90"
        width={config.radius * 2}
        height={config.radius * 2}
        role="img"
        aria-labelledby={`progress-${progress}-label`}
      >
        {/* Background circle */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={adjustedStroke}
          r={normalizedRadius}
          cx={config.radius}
          cy={config.radius}
          className="text-gray-200 dark:text-gray-700"
        />
        
        {/* Progress circle */}
        <circle
          fill="transparent"
          strokeWidth={adjustedStroke}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={config.radius}
          cy={config.radius}
          className={cn(
            colorConfig[color].stroke,
            animated && 'transition-all duration-1000 ease-out'
          )}
          style={{
            filter: progress >= 100 ? 'drop-shadow(0 0 8px currentColor)' : undefined
          }}
        />
      </svg>

      {/* Center content */}
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center"
        id={`progress-${progress}-label`}
      >
        {showPercentage && (
          <span className={cn(
            'font-bold leading-none',
            config.fontSize,
            colorConfig[color].text
          )}>
            {Math.round(animatedProgress)}%
          </span>
        )}
        
        {showLabel && label && (
          <span className={cn(
            'text-xs text-gray-600 dark:text-gray-400 leading-none mt-1',
            size === 'sm' && 'hidden' // Hide label on small sizes
          )}>
            {label}
          </span>
        )}
        
        {/* Success indicator for 100% */}
        {progress >= 100 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg 
              className={cn(
                'w-1/2 h-1/2 animate-bounce-in',
                colorConfig[color].text
              )}
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
        )}
      </div>
      
      {/* Screen reader text */}
      <span className="sr-only">
        Fortschritt: {progress}% {label && `von ${label}`} abgeschlossen
      </span>
    </div>
  )
}
