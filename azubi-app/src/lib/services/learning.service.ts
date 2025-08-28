/**
 * Learning Service für LXP-Funktionalitäten
 * Learning Service for LXP functionality
 */
import { PrismaClient } from '@prisma/client'
import { BaseService, ValidationError, NotFoundError, PaginationOptions } from './base.service'

interface LearningModule {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  estimatedDuration: number // in minutes
  prerequisites: string[]
  skills: string[]
  content: any
  isPublished: boolean
  createdAt: Date
  updatedAt: Date
}

interface LearningProgress {
  id: string
  userId: string
  moduleId: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED'
  progress: number // 0-100
  timeSpent: number // in minutes
  startedAt?: Date
  completedAt?: Date
  lastAccessedAt?: Date
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  type: 'bronze' | 'silver' | 'gold' | 'special'
  category: string
  points: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  requirements: any
}

interface LearningRecommendation {
  moduleId: string
  score: number
  reason: string
  module: LearningModule
}

/**
 * Learning Service für erweiterte LXP-Funktionalitäten
 * Learning Service for advanced LXP functionality
 * 
 * Features:
 * - Lernmodul-Management
 * - Fortschrittsverfolgung
 * - KI-basierte Empfehlungen
 * - Achievement-System
 * - Skill-Tracking
 */
export class LearningService extends BaseService {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Abrufen von Lernmodulen mit Filtern
   * Get learning modules with filters
   */
  async getModules(
    filters: {
      category?: string
      difficulty?: string
      skills?: string[]
      published?: boolean
    } = {},
    pagination: PaginationOptions = {}
  ) {
    try {
      const { skip, take, page, limit } = this.createPaginationParams(pagination)
      const orderBy = this.createSortParams(pagination.sortBy, pagination.sortOrder)

      const where: any = {}
      
      if (filters.category) where.category = filters.category
      if (filters.difficulty) where.difficulty = filters.difficulty
      if (filters.published !== undefined) where.isPublished = filters.published
      if (filters.skills?.length) {
        where.skills = {
          hasSome: filters.skills
        }
      }

      const [modules, total] = await Promise.all([
        this.prisma.learningModule.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            _count: {
              select: {
                enrollments: true,
                completions: true
              }
            }
          }
        }),
        this.prisma.learningModule.count({ where })
      ])

      return {
        modules,
        meta: this.createPaginationMeta(total, page, limit)
      }
    } catch (error) {
      this.handleError(error, 'LearningService.getModules')
    }
  }

  /**
   * Abrufen eines einzelnen Lernmoduls
   * Get a single learning module
   */
  async getModule(moduleId: string, userId?: string) {
    try {
      const module = await this.prisma.learningModule.findUnique({
        where: { id: moduleId },
        include: {
          prerequisites: true,
          _count: {
            select: {
              enrollments: true,
              completions: true,
              reviews: true
            }
          }
        }
      })

      if (!module) {
        throw new NotFoundError('Lernmodul')
      }

      let userProgress = null
      if (userId) {
        userProgress = await this.prisma.learningProgress.findUnique({
          where: {
            userId_moduleId: {
              userId,
              moduleId
            }
          }
        })
      }

      return {
        module,
        userProgress
      }
    } catch (error) {
      this.handleError(error, 'LearningService.getModule')
    }
  }

  /**
   * Starten eines Lernmoduls
   * Start a learning module
   */
  async startModule(userId: string, moduleId: string) {
    try {
      // Prüfen ob Modul existiert
      const module = await this.prisma.learningModule.findUnique({
        where: { id: moduleId },
        include: { prerequisites: true }
      })

      if (!module) {
        throw new NotFoundError('Lernmodul')
      }

      if (!module.isPublished) {
        throw new ValidationError('Lernmodul ist nicht verfügbar')
      }

      // Prüfen ob Voraussetzungen erfüllt sind
      if (module.prerequisites.length > 0) {
        const completedPrerequisites = await this.prisma.learningProgress.count({
          where: {
            userId,
            moduleId: { in: module.prerequisites.map(p => p.id) },
            status: 'COMPLETED'
          }
        })

        if (completedPrerequisites < module.prerequisites.length) {
          throw new ValidationError('Voraussetzungen für dieses Modul nicht erfüllt')
        }
      }

      // Fortschritt erstellen oder aktualisieren
      const progress = await this.prisma.learningProgress.upsert({
        where: {
          userId_moduleId: {
            userId,
            moduleId
          }
        },
        update: {
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          lastAccessedAt: new Date()
        },
        create: {
          userId,
          moduleId,
          status: 'IN_PROGRESS',
          progress: 0,
          timeSpent: 0,
          startedAt: new Date(),
          lastAccessedAt: new Date()
        }
      })

      return progress
    } catch (error) {
      this.handleError(error, 'LearningService.startModule')
    }
  }

  /**
   * Aktualisieren des Lernfortschritts
   * Update learning progress
   */
  async updateProgress(
    userId: string, 
    moduleId: string, 
    progressData: {
      progress?: number
      timeSpent?: number
      currentSection?: string
    }
  ) {
    try {
      const existingProgress = await this.prisma.learningProgress.findUnique({
        where: {
          userId_moduleId: {
            userId,
            moduleId
          }
        }
      })

      if (!existingProgress) {
        throw new NotFoundError('Lernfortschritt')
      }

      const updateData: any = {
        lastAccessedAt: new Date()
      }

      if (progressData.progress !== undefined) {
        updateData.progress = Math.min(100, Math.max(0, progressData.progress))
        
        // Automatisch als abgeschlossen markieren bei 100%
        if (updateData.progress >= 100 && existingProgress.status !== 'COMPLETED') {
          updateData.status = 'COMPLETED'
          updateData.completedAt = new Date()
        }
      }

      if (progressData.timeSpent !== undefined) {
        updateData.timeSpent = existingProgress.timeSpent + progressData.timeSpent
      }

      if (progressData.currentSection) {
        updateData.currentSection = progressData.currentSection
      }

      const updatedProgress = await this.prisma.learningProgress.update({
        where: {
          userId_moduleId: {
            userId,
            moduleId
          }
        },
        data: updateData
      })

      // Achievement-Check bei Abschluss
      if (updateData.status === 'COMPLETED') {
        await this.checkAchievements(userId, moduleId)
      }

      return updatedProgress
    } catch (error) {
      this.handleError(error, 'LearningService.updateProgress')
    }
  }

  /**
   * Abrufen des Benutzerlernfortschritts
   * Get user learning progress
   */
  async getUserProgress(userId: string, filters: { status?: string } = {}) {
    try {
      const where: any = { userId }
      if (filters.status) where.status = filters.status

      const progress = await this.prisma.learningProgress.findMany({
        where,
        include: {
          module: {
            select: {
              id: true,
              title: true,
              category: true,
              difficulty: true,
              estimatedDuration: true
            }
          }
        },
        orderBy: { lastAccessedAt: 'desc' }
      })

      // Statistiken berechnen
      const stats = {
        total: progress.length,
        completed: progress.filter(p => p.status === 'COMPLETED').length,
        inProgress: progress.filter(p => p.status === 'IN_PROGRESS').length,
        totalTimeSpent: progress.reduce((sum, p) => sum + p.timeSpent, 0),
        averageProgress: progress.length > 0 
          ? Math.round(progress.reduce((sum, p) => sum + p.progress, 0) / progress.length)
          : 0
      }

      return { progress, stats }
    } catch (error) {
      this.handleError(error, 'LearningService.getUserProgress')
    }
  }

  /**
   * Generieren von KI-basierten Lernempfehlungen
   * Generate AI-based learning recommendations
   */
  async getRecommendations(userId: string, limit = 5): Promise<LearningRecommendation[]> {
    try {
      // Benutzer-Historie und Präferenzen abrufen
      const userProgress = await this.prisma.learningProgress.findMany({
        where: { userId },
        include: { module: true }
      })

      const userSkills = await this.getUserSkills(userId)
      const completedModules = userProgress
        .filter(p => p.status === 'COMPLETED')
        .map(p => p.moduleId)

      // Verfügbare Module abrufen (ohne bereits abgeschlossene)
      const availableModules = await this.prisma.learningModule.findMany({
        where: {
          isPublished: true,
          id: { notIn: completedModules }
        }
      })

      // Empfehlungs-Algorithmus
      const recommendations: LearningRecommendation[] = []

      for (const module of availableModules) {
        let score = 0
        let reason = ''

        // Skill-basierte Bewertung
        const matchingSkills = module.skills.filter(skill => 
          userSkills.some(us => us.name === skill)
        )
        if (matchingSkills.length > 0) {
          score += matchingSkills.length * 20
          reason += `Passend zu Ihren Skills: ${matchingSkills.join(', ')}. `
        }

        // Schwierigkeitsgrad-Bewertung
        const avgUserLevel = this.calculateUserLevel(userProgress)
        if (this.matchesDifficultyLevel(module.difficulty, avgUserLevel)) {
          score += 15
          reason += 'Passender Schwierigkeitsgrad. '
        }

        // Kategorie-Präferenz
        const categoryPreference = this.getUserCategoryPreference(userProgress)
        if (categoryPreference === module.category) {
          score += 10
          reason += 'Beliebte Kategorie. '
        }

        // Voraussetzungen erfüllt
        const prerequisitesMet = await this.checkPrerequisites(userId, module.prerequisites)
        if (prerequisitesMet) {
          score += 5
        } else {
          score -= 20 // Abzug wenn Voraussetzungen nicht erfüllt
          reason += 'Voraussetzungen noch nicht erfüllt. '
        }

        if (score > 0) {
          recommendations.push({
            moduleId: module.id,
            score,
            reason: reason.trim(),
            module
          })
        }
      }

      // Nach Score sortieren und limitieren
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)

    } catch (error) {
      this.handleError(error, 'LearningService.getRecommendations')
      return []
    }
  }

  /**
   * Achievement-System prüfen
   * Check achievement system
   */
  private async checkAchievements(userId: string, moduleId: string) {
    try {
      const userProgress = await this.prisma.learningProgress.findMany({
        where: { userId, status: 'COMPLETED' }
      })

      const completedCount = userProgress.length
      const totalTimeSpent = userProgress.reduce((sum, p) => sum + p.timeSpent, 0)

      // Verschiedene Achievement-Checks
      const achievementChecks = [
        { type: 'FIRST_COMPLETION', condition: completedCount === 1 },
        { type: 'FAST_LEARNER', condition: completedCount >= 5 },
        { type: 'DEDICATED_LEARNER', condition: completedCount >= 10 },
        { type: 'TIME_MASTER', condition: totalTimeSpent >= 1000 }, // 1000 Minuten
      ]

      for (const check of achievementChecks) {
        if (check.condition) {
          await this.awardAchievement(userId, check.type)
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error)
      // Nicht kritisch, daher nicht weiterwerfen
    }
  }

  /**
   * Achievement vergeben
   * Award achievement
   */
  private async awardAchievement(userId: string, achievementType: string) {
    try {
      // Prüfen ob bereits vergeben
      const existing = await this.prisma.userAchievement.findFirst({
        where: { userId, achievement: { type: achievementType } }
      })

      if (!existing) {
        const achievement = await this.prisma.achievement.findFirst({
          where: { type: achievementType }
        })

        if (achievement) {
          await this.prisma.userAchievement.create({
            data: {
              userId,
              achievementId: achievement.id,
              unlockedAt: new Date()
            }
          })

          // XP vergeben
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              xp: { increment: achievement.points }
            }
          })
        }
      }
    } catch (error) {
      console.error('Error awarding achievement:', error)
    }
  }

  // Hilfsmethoden
  private async getUserSkills(userId: string) {
    return this.prisma.userSkill.findMany({
      where: { userId },
      include: { skill: true }
    })
  }

  private calculateUserLevel(progress: any[]) {
    const completedAdvanced = progress.filter(p => 
      p.status === 'COMPLETED' && p.module.difficulty === 'ADVANCED'
    ).length
    
    if (completedAdvanced >= 3) return 'ADVANCED'
    
    const completedIntermediate = progress.filter(p => 
      p.status === 'COMPLETED' && p.module.difficulty === 'INTERMEDIATE'
    ).length
    
    if (completedIntermediate >= 5) return 'INTERMEDIATE'
    
    return 'BEGINNER'
  }

  private matchesDifficultyLevel(moduleDifficulty: string, userLevel: string) {
    const levels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
    const moduleIndex = levels.indexOf(moduleDifficulty)
    const userIndex = levels.indexOf(userLevel)
    
    // Passend wenn gleich oder eine Stufe höher
    return moduleIndex <= userIndex + 1
  }

  private getUserCategoryPreference(progress: any[]) {
    const categories = progress.reduce((acc, p) => {
      acc[p.module.category] = (acc[p.module.category] || 0) + 1
      return acc
    }, {})
    
    return Object.keys(categories).reduce((a, b) => 
      categories[a] > categories[b] ? a : b
    )
  }

  private async checkPrerequisites(userId: string, prerequisites: string[]) {
    if (prerequisites.length === 0) return true
    
    const completed = await this.prisma.learningProgress.count({
      where: {
        userId,
        moduleId: { in: prerequisites },
        status: 'COMPLETED'
      }
    })
    
    return completed === prerequisites.length
  }
}
