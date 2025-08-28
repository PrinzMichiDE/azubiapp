/**
 * Microlearning Card für kurze Lerneinheiten
 * Microlearning Card for short learning units
 */
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProgressRing } from './progress-ring'
import {
  PlayIcon,
  PauseIcon,
  ClockIcon,
  BookOpenIcon,
  CheckCircleIcon,
  StarIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'

interface MicrolearningModule {
  id: string
  title: string
  description: string
  type: 'video' | 'quiz' | 'reading' | 'interactive' | 'flashcards'
  duration: number // in minutes
  difficulty: 'easy' | 'medium' | 'hard'
  points: number
  progress: number // 0-100
  isCompleted: boolean
  isBookmarked: boolean
  thumbnail?: string
  tags: string[]
}

interface MicrolearningCardProps {
  module: MicrolearningModule
  variant?: 'default' | 'compact' | 'detailed'
  onStart?: (moduleId: string) => void
  onContinue?: (moduleId: string) => void
  onBookmark?: (moduleId: string) => void
  className?: string
}

/**
 * Microlearning Card für mobile-optimierte, kurze Lerneinheiten
 * Microlearning Card for mobile-optimized, short learning units
 * 
 * Features:
 * - Kurze Lerneinheiten (5-15 Minuten)
 * - Mobile-optimierte Darstellung
 * - Verschiedene Content-Typen (Video, Quiz, etc.)
 * - Offline-Verfügbarkeit (Progressive Web App)
 * - Gamification mit Punkten und Badges
 * - Touch-optimierte Interaktionen
 * 
 * @param module - Microlearning-Modul / Microlearning module
 * @param variant - Layout-Variante / Layout variant
 * @param onStart - Start-Callback / Start callback
 * @param onContinue - Fortsetzen-Callback / Continue callback
 * @param onBookmark - Lesezeichen-Callback / Bookmark callback
 */
export function MicrolearningCard({
  module,
  variant = 'default',
  onStart,
  onContinue,
  onBookmark,
  className
}: MicrolearningCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getTypeIcon = (type: string) => {
    const icons = {
      video: PlayIcon,
      quiz: QuestionMarkCircleIcon,
      reading: BookOpenIcon,
      interactive: LightBulbIcon,
      flashcards: StarIcon
    }
    return icons[type as keyof typeof icons] || BookOpenIcon
  }

  const getTypeColor = (type: string) => {
    const colors = {
      video: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      quiz: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      reading: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      interactive: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      flashcards: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      easy: 'text-green-600 dark:text-green-400',
      medium: 'text-yellow-600 dark:text-yellow-400',
      hard: 'text-red-600 dark:text-red-400'
    }
    return colors[difficulty as keyof typeof colors] || 'text-gray-600 dark:text-gray-400'
  }

  const TypeIcon = getTypeIcon(module.type)

  // Compact Variant für Listen
  if (variant === 'compact') {
    return (
      <Card 
        className={cn(
          'cursor-pointer hover:shadow-md transition-all duration-200',
          className
        )}
        onClick={() => module.progress > 0 ? onContinue?.(module.id) : onStart?.(module.id)}
      >
        <CardContent className="p-3">
          <div className="flex items-center space-x-3">
            {/* Type Icon */}
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
              getTypeColor(module.type)
            )}>
              <TypeIcon className="h-5 w-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                {module.title}
              </h4>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <ClockIcon className="h-3 w-3" />
                <span>{module.duration} Min</span>
                <span>•</span>
                <span className={getDifficultyColor(module.difficulty)}>
                  {module.difficulty}
                </span>
              </div>
            </div>

            {/* Progress */}
            {module.progress > 0 && (
              <ProgressRing
                progress={module.progress}
                size="sm"
                showPercentage={false}
                color={module.isCompleted ? 'success' : 'primary'}
              />
            )}

            {module.isCompleted && (
              <CheckCircleIcon className="h-5 w-5 text-success-500" />
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Detailed Variant
  if (variant === 'detailed') {
    return (
      <Card 
        className={cn('hover:shadow-lg transition-all duration-300', className)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-0">
          {/* Thumbnail/Header */}
          <div className="relative h-32 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20">
            {module.thumbnail ? (
              <img 
                src={module.thumbnail}
                alt={module.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <TypeIcon className="h-12 w-12 text-primary-400" />
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                onClick={() => module.progress > 0 ? onContinue?.(module.id) : onStart?.(module.id)}
              >
                <PlayIcon className="h-4 w-4 mr-1" />
                {module.progress > 0 ? 'Fortsetzen' : 'Starten'}
              </Button>
            </div>

            {/* Badges */}
            <div className="absolute top-2 left-2 flex space-x-1">
              <Badge className={getTypeColor(module.type)}>
                {module.type}
              </Badge>
              {module.isCompleted && (
                <Badge className="bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400">
                  ✓ Abgeschlossen
                </Badge>
              )}
            </div>

            {/* Bookmark */}
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2 text-white hover:text-yellow-400"
              onClick={(e) => {
                e.stopPropagation()
                onBookmark?.(module.id)
              }}
            >
              <StarIcon className={cn(
                'h-4 w-4',
                module.isBookmarked && 'fill-current text-yellow-400'
              )} />
            </Button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {module.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {module.description}
              </p>
            </div>

            {/* Meta Info */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-3 w-3" />
                  <span>{module.duration} Min</span>
                </div>
                <span className={getDifficultyColor(module.difficulty)}>
                  {module.difficulty}
                </span>
                <div className="flex items-center space-x-1">
                  <StarIcon className="h-3 w-3 text-yellow-500" />
                  <span>{module.points} XP</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {module.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {module.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
                {module.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{module.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Progress */}
            {module.progress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Fortschritt</span>
                  <span className="font-medium">{module.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${module.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Button */}
            <Button 
              className="w-full"
              onClick={() => module.progress > 0 ? onContinue?.(module.id) : onStart?.(module.id)}
            >
              {module.isCompleted ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Wiederholen
                </>
              ) : module.progress > 0 ? (
                <>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Fortsetzen
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Starten
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default Variant
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className={cn(
          'cursor-pointer hover:shadow-lg transition-all duration-300',
          className
        )}
        onClick={() => module.progress > 0 ? onContinue?.(module.id) : onStart?.(module.id)}
      >
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  getTypeColor(module.type)
                )}>
                  <TypeIcon className="h-4 w-4" />
                </div>
                <Badge className={getTypeColor(module.type)}>
                  {module.type}
                </Badge>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onBookmark?.(module.id)
                }}
              >
                <StarIcon className={cn(
                  'h-4 w-4',
                  module.isBookmarked && 'fill-current text-yellow-500'
                )} />
              </Button>
            </div>

            {/* Content */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                {module.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {module.description}
              </p>
            </div>

            {/* Meta */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-3 w-3" />
                <span>{module.duration} Min</span>
                <span>•</span>
                <span className={getDifficultyColor(module.difficulty)}>
                  {module.difficulty}
                </span>
              </div>
              
              <div className="flex items-center space-x-1">
                <StarIcon className="h-3 w-3 text-yellow-500" />
                <span>{module.points} XP</span>
              </div>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-between">
              {module.progress > 0 ? (
                <div className="flex items-center space-x-2 flex-1">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${module.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {module.progress}%
                  </span>
                </div>
              ) : (
                <div className="flex-1" />
              )}
              
              {module.isCompleted && (
                <CheckCircleIcon className="h-5 w-5 text-success-500 ml-2" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
