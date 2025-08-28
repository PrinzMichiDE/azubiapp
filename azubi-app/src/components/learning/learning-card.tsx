/**
 * Learning Card-Komponente für Lernmodule
 * Learning Card component for learning modules
 */
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { AnimatedCard } from '@/components/ui/animated-card'
import { ProgressRing } from './progress-ring'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  PlayIcon,
  ClockIcon,
  StarIcon,
  LockClosedIcon,
  CheckCircleIcon,
  BookOpenIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'

interface LearningModule {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  estimatedDuration: number // in minutes
  prerequisites: string[]
  skills: string[]
  thumbnail?: string
  rating: number
  enrolledCount: number
  isLocked: boolean
  isCompleted: boolean
  progress: number // 0-100
}

interface LearningCardProps {
  module: LearningModule
  variant?: 'default' | 'compact' | 'featured'
  showProgress?: boolean
  onEnroll?: (moduleId: string) => void
  onContinue?: (moduleId: string) => void
  onViewDetails?: (moduleId: string) => void
  className?: string
}

/**
 * Learning Card für Lernmodule mit Gamification
 * Learning Card for learning modules with gamification
 * 
 * Features:
 * - Responsive Design mit Mobile-First
 * - Gamification-Elemente (Progress, Badges)
 * - Accessibility-konform (WCAG 2.1)
 * - Touch-optimierte Interaktionen
 * - Verschiedene Varianten für verschiedene Kontexte
 * 
 * @param module - Lernmodul-Daten / Learning module data
 * @param variant - Card-Variante / Card variant
 * @param showProgress - Fortschritt anzeigen / Show progress
 * @param onEnroll - Einschreibungs-Callback / Enrollment callback
 * @param onContinue - Fortsetzen-Callback / Continue callback
 * @param onViewDetails - Details-Callback / Details callback
 */
export function LearningCard({
  module,
  variant = 'default',
  showProgress = true,
  onEnroll,
  onContinue,
  onViewDetails,
  className
}: LearningCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
      case 'INTERMEDIATE': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
      case 'ADVANCED': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getActionButton = () => {
    if (module.isLocked) {
      return (
        <Button disabled variant="outline" size="sm" className="w-full">
          <LockClosedIcon className="h-4 w-4 mr-2" />
          Gesperrt
        </Button>
      )
    }

    if (module.isCompleted) {
      return (
        <Button 
          onClick={() => onViewDetails?.(module.id)}
          variant="outline" 
          size="sm" 
          className="w-full"
        >
          <CheckCircleIcon className="h-4 w-4 mr-2" />
          Abgeschlossen
        </Button>
      )
    }

    if (module.progress > 0) {
      return (
        <Button 
          onClick={() => onContinue?.(module.id)}
          variant="default" 
          size="sm" 
          className="w-full"
        >
          <PlayIcon className="h-4 w-4 mr-2" />
          Fortsetzen
        </Button>
      )
    }

    return (
      <Button 
        onClick={() => onEnroll?.(module.id)}
        variant="default" 
        size="sm" 
        className="w-full"
      >
        <BookOpenIcon className="h-4 w-4 mr-2" />
        Starten
      </Button>
    )
  }

  const cardContent = (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Thumbnail/Icon */}
          <div className="flex items-center space-x-3 mb-3">
            <div className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center',
              module.isCompleted 
                ? 'bg-success-100 text-success-600 dark:bg-success-900/20 dark:text-success-400'
                : module.isLocked
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                  : 'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
            )}>
              {module.thumbnail ? (
                <img 
                  src={module.thumbnail} 
                  alt=""
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <BookOpenIcon className="h-6 w-6" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                {module.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {module.category}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
            {module.description}
          </p>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge 
              variant="secondary" 
              className={getDifficultyColor(module.difficulty)}
            >
              {module.difficulty}
            </Badge>
            
            <Badge variant="outline" className="flex items-center space-x-1">
              <ClockIcon className="h-3 w-3" />
              <span>{formatDuration(module.estimatedDuration)}</span>
            </Badge>
            
            {module.rating && (
              <Badge variant="outline" className="flex items-center space-x-1">
                <StarIcon className="h-3 w-3 fill-current text-yellow-500" />
                <span>{module.rating.toFixed(1)}</span>
              </Badge>
            )}
          </div>

          {/* Skills */}
          {module.skills.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Skills:
              </p>
              <div className="flex flex-wrap gap-1">
                {module.skills.slice(0, 3).map((skill, index) => (
                  <span 
                    key={index}
                    className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 px-2 py-1 rounded"
                  >
                    {skill}
                  </span>
                ))}
                {module.skills.length > 3 && (
                  <span className="text-xs bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-2 py-1 rounded">
                    +{module.skills.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
            <div className="flex items-center space-x-1">
              <UserGroupIcon className="h-3 w-3" />
              <span>{module.enrolledCount} Teilnehmer</span>
            </div>
            
            {module.prerequisites.length > 0 && (
              <span>
                {module.prerequisites.length} Voraussetzungen
              </span>
            )}
          </div>
        </div>

        {/* Progress Ring (wenn aktiviert) */}
        {showProgress && (module.progress > 0 || module.isCompleted) && (
          <div className="ml-3 flex-shrink-0">
            <ProgressRing
              progress={module.isCompleted ? 100 : module.progress}
              size="md"
              color={module.isCompleted ? 'success' : 'primary'}
              showPercentage
            />
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        {getActionButton()}
      </div>
    </div>
  )

  // Compact variant
  if (variant === 'compact') {
    return (
      <AnimatedCard
        variant="hover"
        className={cn('max-w-sm', className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onViewDetails?.(module.id)}
      >
        <div className="p-3 flex items-center space-x-3">
          <div className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            module.isCompleted 
              ? 'bg-success-100 text-success-600'
              : 'bg-primary-100 text-primary-600'
          )}>
            <BookOpenIcon className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-white truncate">
              {module.title}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {module.category} • {formatDuration(module.estimatedDuration)}
            </p>
          </div>
          
          {showProgress && module.progress > 0 && (
            <ProgressRing
              progress={module.progress}
              size="sm"
              showPercentage={false}
            />
          )}
        </div>
      </AnimatedCard>
    )
  }

  // Featured variant
  if (variant === 'featured') {
    return (
      <AnimatedCard
        variant="bounce"
        className={cn('max-w-md bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20', className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative overflow-hidden">
          {/* Featured badge */}
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-yellow-500 text-yellow-900 animate-pulse-glow">
              ⭐ Featured
            </Badge>
          </div>
          
          {/* Thumbnail */}
          {module.thumbnail && (
            <div className="h-32 bg-gradient-to-r from-primary-500 to-purple-500">
              <img 
                src={module.thumbnail} 
                alt=""
                className="w-full h-full object-cover opacity-80"
              />
            </div>
          )}
          
          {cardContent}
        </div>
      </AnimatedCard>
    )
  }

  // Default variant
  return (
    <AnimatedCard
      variant="hover"
      className={cn('max-w-sm h-full', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {cardContent}
      
      {/* Hover overlay für zusätzliche Aktionen */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-black/5 dark:bg-white/5 rounded-lg flex items-center justify-center"
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails?.(module.id)}
            className="shadow-lg"
          >
            Details anzeigen
          </Button>
        </motion.div>
      )}
    </AnimatedCard>
  )
}
