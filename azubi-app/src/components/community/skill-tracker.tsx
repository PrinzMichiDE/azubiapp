/**
 * Skill Tracker-Komponente für Competency Management
 * Skill Tracker component for competency management
 */
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ProgressRing } from '@/components/learning/progress-ring'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
  StarIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  ClockIcon,
  TargetIcon
} from '@heroicons/react/24/outline'

interface Skill {
  id: string
  name: string
  category: string
  currentLevel: number // 0-100
  targetLevel: number // 0-100
  xpEarned: number
  xpToNext: number
  badges: string[]
  lastImproved: string
  trending: 'up' | 'down' | 'stable'
  endorsements: number
  certifications: string[]
}

interface SkillCategory {
  name: string
  skills: Skill[]
  averageLevel: number
  totalXP: number
}

interface SkillTrackerProps {
  skills: Skill[]
  showCategories?: boolean
  showProgress?: boolean
  showBadges?: boolean
  variant?: 'compact' | 'detailed' | 'overview'
  onSkillSelect?: (skill: Skill) => void
  className?: string
}

/**
 * Skill Tracker für Learning & Development
 * Skill Tracker for Learning & Development
 * 
 * Features:
 * - Skill-Level-Tracking mit XP-System
 * - Kategorie-basierte Organisation
 * - Progress-Visualisierung
 * - Gamification-Elemente (Badges, XP)
 * - Endorsement-System
 * - Zertifizierungs-Tracking
 * 
 * @param skills - Array von Skills / Array of skills
 * @param showCategories - Kategorien anzeigen / Show categories
 * @param showProgress - Fortschritt anzeigen / Show progress
 * @param showBadges - Badges anzeigen / Show badges
 * @param variant - Layout-Variante / Layout variant
 * @param onSkillSelect - Skill-Selection-Callback / Skill selection callback
 */
export function SkillTracker({
  skills,
  showCategories = true,
  showProgress = true,
  showBadges = true,
  variant = 'detailed',
  onSkillSelect,
  className
}: SkillTrackerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'level' | 'progress' | 'recent'>('level')

  // Skills nach Kategorien gruppieren
  const groupedSkills = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = []
    }
    acc[skill.category].push(skill)
    return acc
  }, {})

  // Kategorien mit Statistiken
  const categories: SkillCategory[] = Object.entries(groupedSkills).map(([name, categorySkills]) => ({
    name,
    skills: categorySkills,
    averageLevel: Math.round(categorySkills.reduce((sum, s) => sum + s.currentLevel, 0) / categorySkills.length),
    totalXP: categorySkills.reduce((sum, s) => sum + s.xpEarned, 0)
  }))

  // Gefilterte Skills
  const filteredSkills = selectedCategory === 'all' 
    ? skills 
    : skills.filter(skill => skill.category === selectedCategory)

  // Sortierte Skills
  const sortedSkills = [...filteredSkills].sort((a, b) => {
    switch (sortBy) {
      case 'level':
        return b.currentLevel - a.currentLevel
      case 'progress':
        return (b.currentLevel - b.targetLevel) - (a.currentLevel - a.targetLevel)
      case 'recent':
        return new Date(b.lastImproved).getTime() - new Date(a.lastImproved).getTime()
      default:
        return 0
    }
  })

  const getSkillLevelColor = (level: number) => {
    if (level >= 80) return 'text-success-600 bg-success-100 dark:bg-success-900/20'
    if (level >= 60) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
    if (level >= 40) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
    return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
  }

  const getSkillLevelText = (level: number) => {
    if (level >= 80) return 'Expert'
    if (level >= 60) return 'Advanced'
    if (level >= 40) return 'Intermediate'
    if (level >= 20) return 'Basic'
    return 'Beginner'
  }

  const getTrendingIcon = (trending: string) => {
    switch (trending) {
      case 'up': return <ArrowUpIcon className="h-3 w-3 text-success-500" />
      case 'down': return <ArrowUpIcon className="h-3 w-3 text-error-500 rotate-180" />
      default: return null
    }
  }

  // Compact Variant
  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        {sortedSkills.slice(0, 5).map((skill) => (
          <motion.div
            key={skill.id}
            layout
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            onClick={() => onSkillSelect?.(skill)}
          >
            <ProgressRing
              progress={skill.currentLevel}
              size="sm"
              showPercentage={false}
              color="primary"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {skill.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {getSkillLevelText(skill.currentLevel)}
              </p>
            </div>
            {getTrendingIcon(skill.trending)}
          </motion.div>
        ))}
      </div>
    )
  }

  // Overview Variant
  if (variant === 'overview') {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Kategorie-Übersicht */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <Card key={category.name} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {category.name}
                  </h3>
                  <Badge variant="outline">
                    {category.skills.length}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4">
                  <ProgressRing
                    progress={category.averageLevel}
                    size="md"
                    showPercentage
                    showLabel
                    label="Avg"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                      <TrophyIcon className="h-4 w-4" />
                      <span>{category.totalXP} XP</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Top Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <StarIcon className="h-5 w-5 mr-2" />
              Top Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {skills
                .sort((a, b) => b.currentLevel - a.currentLevel)
                .slice(0, 5)
                .map((skill) => (
                  <div key={skill.id} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {skill.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {skill.currentLevel}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${skill.currentLevel}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Detailed Variant (Default)
  return (
    <div className={cn('space-y-6', className)}>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {showCategories && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              Alle
            </Button>
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={selectedCategory === category.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.name)}
              >
                {category.name} ({category.skills.length})
              </Button>
            ))}
          </div>
        )}

        <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800"
          >
            <option value="level">Nach Level</option>
            <option value="progress">Nach Fortschritt</option>
            <option value="recent">Nach Aktivität</option>
          </select>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {sortedSkills.map((skill) => (
            <motion.div
              key={skill.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-lg transition-all duration-200"
                onClick={() => onSkillSelect?.(skill)}
              >
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        {skill.name}
                      </h3>
                      <Badge 
                        variant="outline" 
                        className={getSkillLevelColor(skill.currentLevel)}
                      >
                        {getSkillLevelText(skill.currentLevel)}
                      </Badge>
                    </div>
                    
                    {showProgress && (
                      <ProgressRing
                        progress={skill.currentLevel}
                        size="md"
                        showPercentage
                        color={skill.currentLevel >= skill.targetLevel ? 'success' : 'primary'}
                      />
                    )}
                  </div>

                  {/* Progress Bar zu Target */}
                  {skill.targetLevel > skill.currentLevel && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Ziel: {skill.targetLevel}%</span>
                        <span>{skill.targetLevel - skill.currentLevel}% fehlen</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(skill.currentLevel / skill.targetLevel) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* XP and Stats */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <TrophyIcon className="h-4 w-4 text-yellow-500" />
                        <span>{skill.xpEarned} XP</span>
                      </div>
                      {getTrendingIcon(skill.trending)}
                    </div>
                    
                    {skill.xpToNext > 0 && (
                      <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <TargetIcon className="h-4 w-4" />
                          <span>{skill.xpToNext} XP zum nächsten Level</span>
                        </div>
                      </div>
                    )}

                    {skill.endorsements > 0 && (
                      <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                        <CheckCircleIcon className="h-4 w-4" />
                        <span>{skill.endorsements} Endorsements</span>
                      </div>
                    )}
                  </div>

                  {/* Badges */}
                  {showBadges && skill.badges.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex flex-wrap gap-1">
                        {skill.badges.slice(0, 3).map((badge, index) => (
                          <span 
                            key={index}
                            className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 px-2 py-1 rounded"
                          >
                            {badge}
                          </span>
                        ))}
                        {skill.badges.length > 3 && (
                          <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-2 py-1 rounded">
                            +{skill.badges.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {skill.certifications.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Zertifizierungen:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {skill.certifications.map((cert, index) => (
                          <span 
                            key={index}
                            className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 px-2 py-1 rounded"
                          >
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last Improved */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <ClockIcon className="h-3 w-3" />
                      <span>
                        Zuletzt verbessert: {new Date(skill.lastImproved).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredSkills.length === 0 && (
        <div className="text-center py-8">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            Keine Skills in dieser Kategorie gefunden.
          </p>
        </div>
      )}
    </div>
  )
}
