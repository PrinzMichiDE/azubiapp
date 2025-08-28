/**
 * Achievement Badge-Komponente für Gamification
 * Achievement Badge component for gamification
 */
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  type: 'bronze' | 'silver' | 'gold' | 'special'
  category: 'learning' | 'project' | 'collaboration' | 'milestone'
  points: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: string
}

interface AchievementBadgeProps {
  achievement: Achievement
  isUnlocked: boolean
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  onUnlock?: () => void
  onClick?: () => void
}

/**
 * Achievement Badge mit Tooltips und Unlock-Animationen
 * Achievement Badge with tooltips and unlock animations
 * 
 * Features:
 * - Gamification-Farben basierend auf Typ
 * - Unlock-Animationen mit bounce-in
 * - Touch-optimierte Mindestgröße (44px)
 * - ARIA-Labels für Accessibility
 * 
 * @param achievement - Achievement-Daten / Achievement data
 * @param isUnlocked - Unlock-Status / Unlock status
 * @param size - Badge-Größe / Badge size
 * @param showTooltip - Tooltip anzeigen / Show tooltip
 * @param onUnlock - Unlock-Callback / Unlock callback
 * @param onClick - Click-Callback / Click callback
 */
export function AchievementBadge({ 
  achievement, 
  isUnlocked, 
  size = 'md',
  showTooltip = true,
  onUnlock,
  onClick
}: AchievementBadgeProps) {
  const [showDetails, setShowDetails] = useState(false)

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-11 w-11 text-sm min-h-touch min-w-touch', // Touch-optimiert
    lg: 'h-16 w-16 text-base'
  }

  const typeColors = {
    bronze: 'bg-gradient-to-br from-yellow-600 to-yellow-800 text-white',
    silver: 'bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900',
    gold: 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900',
    special: 'bg-gradient-to-br from-purple-500 to-purple-700 text-white'
  }

  const rarityGlow = {
    common: '',
    rare: 'shadow-md',
    epic: 'shadow-lg shadow-purple-500/25',
    legendary: 'shadow-xl shadow-yellow-500/30 animate-pulse-glow'
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
    } else if (showTooltip) {
      setShowDetails(!showDetails)
    }
  }

  const handleUnlock = () => {
    if (onUnlock) {
      onUnlock()
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        className={cn(
          // Base styles
          'relative rounded-full flex items-center justify-center transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'hover:scale-105 active:scale-95',
          
          // Size
          sizeClasses[size],
          
          // Type and state
          isUnlocked 
            ? cn(
                typeColors[achievement.type],
                rarityGlow[achievement.rarity],
                'animate-bounce-in'
              )
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500',
          
          // Disabled state
          !isUnlocked && 'cursor-not-allowed opacity-50'
        )}
        aria-label={`Achievement: ${achievement.name}${isUnlocked ? ' (freigeschaltet)' : ' (gesperrt)'}`}
        aria-describedby={showDetails ? `achievement-${achievement.id}-details` : undefined}
        disabled={!isUnlocked && !onClick}
      >
        {/* Icon */}
        <span className="text-current" role="img" aria-hidden="true">
          {achievement.icon}
        </span>
        
        {/* Unlock effect */}
        {isUnlocked && achievement.rarity === 'legendary' && (
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 opacity-20 animate-pulse" />
        )}
        
        {/* Lock overlay for locked achievements */}
        {!isUnlocked && (
          <div className="absolute inset-0 rounded-full bg-black/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </button>

      {/* Tooltip/Details */}
      {showTooltip && showDetails && (
        <div 
          id={`achievement-${achievement.id}-details`}
          className={cn(
            'absolute z-50 p-3 mt-2 w-64 bg-white dark:bg-gray-800',
            'border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg',
            'transform -translate-x-1/2 left-1/2',
            'animate-slide-up'
          )}
          role="tooltip"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {achievement.name}
              </h4>
              <Badge variant="outline" className={cn(
                'text-xs',
                achievement.rarity === 'legendary' && 'text-yellow-600 border-yellow-600',
                achievement.rarity === 'epic' && 'text-purple-600 border-purple-600',
                achievement.rarity === 'rare' && 'text-blue-600 border-blue-600'
              )}>
                {achievement.rarity}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {achievement.description}
            </p>
            
            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-1">
                <span className="text-xs text-gamification-xp">✨ {achievement.points} XP</span>
              </div>
              
              {isUnlocked && achievement.unlockedAt && (
                <span className="text-xs text-gray-500">
                  {new Date(achievement.unlockedAt).toLocaleDateString('de-DE')}
                </span>
              )}
            </div>
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={() => setShowDetails(false)}
            className="absolute top-1 right-1 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Tooltip schließen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
