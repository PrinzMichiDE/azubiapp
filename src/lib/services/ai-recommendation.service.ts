/**
 * KI-gestützte Lernempfehlungs-Service für Azubi LXP
 * AI-powered learning recommendation service for apprentice LXP
 */
import { BaseService } from './base.service'
import { PrismaClient } from '@prisma/client'

interface LearningHistory {
  moduleId: string
  completionRate: number
  timeSpent: number
  skillsGained: string[]
  difficulty: string
  category: string
}

interface AzubiProfile {
  id: string
  apprenticeshipYear: number // 1, 2, 3
  profession: string // z.B. "Fachinformatiker Anwendungsentwicklung"
  currentSkills: string[]
  learningPreferences: string[]
  weakAreas: string[]
  strongAreas: string[]
}

interface Recommendation {
  moduleId: string
  confidence: number // 0-100
  reason: string
  priority: 'high' | 'medium' | 'low'
  estimatedBenefit: number
  module: any
}

/**
 * KI-Service für personalisierte Azubi-Lernempfehlungen
 * AI service for personalized apprentice learning recommendations
 * 
 * Features:
 * - Ausbildungsjahr-spezifische Empfehlungen
 * - Berufsbild-basierte Lernpfade
 * - Kompetenzlücken-Analyse
 * - Peer-Learning-Vorschläge
 * - Prüfungsvorbereitung
 */
export class AIRecommendationService extends BaseService {
  constructor(prisma: PrismaClient) {
    super(prisma)
  }

  /**
   * Hauptempfehlungsalgorithmus für Azubis
   * Main recommendation algorithm for apprentices
   */
  async getPersonalizedRecommendations(
    azubiId: string,
    limit: number = 10
  ): Promise<Recommendation[]> {
    try {
      // 1. Azubi-Profil laden
      const azubiProfile = await this.loadAzubiProfile(azubiId)
      
      // 2. Lernhistorie analysieren
      const learningHistory = await this.analyzeLearningHistory(azubiId)
      
      // 3. Peer-Vergleich durchführen
      const peerInsights = await this.analyzePeerPerformance(azubiProfile)
      
      // 4. Verfügbare Module bewerten
      const availableModules = await this.getAvailableModules(azubiId)
      
      // 5. Empfehlungen generieren
      const recommendations: Recommendation[] = []
      
      for (const module of availableModules) {
        const recommendation = await this.evaluateModule(
          module,
          azubiProfile,
          learningHistory,
          peerInsights
        )
        
        if (recommendation.confidence > 30) {
          recommendations.push(recommendation)
        }
      }
      
      // 6. Nach Priorität sortieren
      return recommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit)
        
    } catch (error) {
      this.handleError(error, 'AIRecommendationService.getPersonalizedRecommendations')
      return []
    }
  }

  /**
   * Ausbildungsjahr-spezifische Empfehlungen
   * Training year specific recommendations
   */
  async getYearSpecificRecommendations(
    azubiId: string,
    year: number
  ): Promise<Recommendation[]> {
    const yearCurricula = {
      1: ['Grundlagen', 'Einführung', 'Basiswissen', 'Orientierung'],
      2: ['Vertiefung', 'Praxis', 'Projektarbeit', 'Spezialisierung'],
      3: ['Abschlussprojekt', 'Prüfungsvorbereitung', 'Expertenwissen', 'Selbstständigkeit']
    }

    const relevantCategories = yearCurricula[year as keyof typeof yearCurricula] || []
    
    const modules = await this.prisma.learningModule.findMany({
      where: {
        isPublished: true,
        OR: relevantCategories.map(category => ({
          category: { contains: category }
        }))
      }
    })

    return modules.map(module => ({
      moduleId: module.id,
      confidence: 85,
      reason: `Empfohlen für ${year}. Ausbildungsjahr`,
      priority: 'high' as const,
      estimatedBenefit: 80,
      module
    }))
  }

  /**
   * Kompetenzlücken-basierte Empfehlungen
   * Competency gap based recommendations
   */
  async getCompetencyGapRecommendations(azubiId: string): Promise<Recommendation[]> {
    const userSkills = await this.prisma.userSkill.findMany({
      where: { userId: azubiId },
      include: { skill: true }
    })

    // Identifiziere Schwachstellen (Level < 60%)
    const weakSkills = userSkills.filter(us => us.level < 60)
    
    const recommendations: Recommendation[] = []
    
    for (const weakSkill of weakSkills) {
      const modules = await this.prisma.learningModule.findMany({
        where: {
          skills: { has: weakSkill.skill.name },
          isPublished: true
        }
      })

      modules.forEach(module => {
        recommendations.push({
          moduleId: module.id,
          confidence: 90,
          reason: `Stärkt schwache Kompetenz: ${weakSkill.skill.name}`,
          priority: 'high',
          estimatedBenefit: 85,
          module
        })
      })
    }

    return recommendations
  }

  /**
   * Prüfungsvorbereitungs-Empfehlungen
   * Exam preparation recommendations
   */
  async getExamPrepRecommendations(
    azubiId: string,
    examType: 'Zwischenprüfung' | 'Abschlussprüfung'
  ): Promise<Recommendation[]> {
    const azubi = await this.prisma.user.findUnique({
      where: { id: azubiId }
    })

    if (!azubi) return []

    const examModules = await this.prisma.learningModule.findMany({
      where: {
        OR: [
          { category: { contains: 'Prüfung' } },
          { title: { contains: examType } },
          { skills: { hasSome: ['Prüfungsvorbereitung', 'Fachkunde'] } }
        ],
        isPublished: true
      }
    })

    return examModules.map(module => ({
      moduleId: module.id,
      confidence: 95,
      reason: `Wichtig für ${examType}`,
      priority: 'high' as const,
      estimatedBenefit: 90,
      module
    }))
  }

  /**
   * Peer-Learning-Empfehlungen
   * Peer learning recommendations
   */
  async getPeerLearningRecommendations(azubiId: string): Promise<{
    studyGroups: any[]
    mentorMatching: any[]
    collaborativeProjects: any[]
  }> {
    const azubi = await this.loadAzubiProfile(azubiId)
    
    // Finde ähnliche Azubis
    const peers = await this.prisma.user.findMany({
      where: {
        role: 'TRAINEE',
        id: { not: azubiId },
        // Gleicher Beruf oder ähnliches Ausbildungsjahr
      },
      take: 10
    })

    const studyGroups = await this.suggestStudyGroups(azubi, peers)
    const mentorMatching = await this.suggestMentors(azubi, peers)
    const collaborativeProjects = await this.suggestCollaborativeProjects(azubi)

    return {
      studyGroups,
      mentorMatching,
      collaborativeProjects
    }
  }

  /**
   * Adaptive Lernpfad-Generierung
   * Adaptive learning path generation
   */
  async generateAdaptiveLearningPath(
    azubiId: string,
    targetSkills: string[]
  ): Promise<{
    path: any[]
    estimatedDuration: number
    difficulty: string
    prerequisites: string[]
  }> {
    const currentSkills = await this.getCurrentSkillLevels(azubiId)
    const path = []
    let totalDuration = 0

    // Sortiere Ziel-Skills nach Priorität und Abhängigkeiten
    const sortedSkills = await this.sortSkillsByDependency(targetSkills)

    for (const skill of sortedSkills) {
      const modules = await this.findOptimalModulesForSkill(skill, currentSkills)
      
      for (const module of modules) {
        path.push({
          moduleId: module.id,
          skill,
          order: path.length + 1,
          estimatedDuration: module.estimatedDuration,
          prerequisites: module.prerequisites
        })
        totalDuration += module.estimatedDuration
      }
    }

    return {
      path,
      estimatedDuration: totalDuration,
      difficulty: this.calculatePathDifficulty(path),
      prerequisites: this.extractPrerequisites(path)
    }
  }

  // Private Hilfsmethoden
  private async loadAzubiProfile(azubiId: string): Promise<AzubiProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: azubiId },
      include: {
        skills: { include: { skill: true } }
      }
    })

    if (!user) throw new Error('Azubi not found')

    return {
      id: user.id,
      apprenticeshipYear: user.apprenticeshipYear || 1,
      profession: user.profession || 'Allgemein',
      currentSkills: user.skills.map(s => s.skill.name),
      learningPreferences: user.learningPreferences || [],
      weakAreas: user.skills.filter(s => s.level < 60).map(s => s.skill.name),
      strongAreas: user.skills.filter(s => s.level >= 80).map(s => s.skill.name)
    }
  }

  private async analyzeLearningHistory(azubiId: string): Promise<LearningHistory[]> {
    const progress = await this.prisma.learningProgress.findMany({
      where: { userId: azubiId },
      include: { module: true }
    })

    return progress.map(p => ({
      moduleId: p.moduleId,
      completionRate: p.progress,
      timeSpent: p.timeSpent,
      skillsGained: p.module.skills,
      difficulty: p.module.difficulty,
      category: p.module.category
    }))
  }

  private async analyzePeerPerformance(azubi: AzubiProfile) {
    // Analysiere Performance von Azubis mit ähnlichem Profil
    const similarAzubis = await this.prisma.user.findMany({
      where: {
        role: 'TRAINEE',
        apprenticeshipYear: azubi.apprenticeshipYear,
        profession: azubi.profession
      },
      include: {
        learningProgress: {
          include: { module: true }
        }
      }
    })

    return {
      averageProgress: this.calculateAverageProgress(similarAzubis),
      popularModules: this.findPopularModules(similarAzubis),
      successfulPaths: this.identifySuccessfulPaths(similarAzubis)
    }
  }

  private async getAvailableModules(azubiId: string) {
    const completedModules = await this.prisma.learningProgress.findMany({
      where: { 
        userId: azubiId,
        status: 'COMPLETED'
      },
      select: { moduleId: true }
    })

    const completedIds = completedModules.map(p => p.moduleId)

    return this.prisma.learningModule.findMany({
      where: {
        isPublished: true,
        id: { notIn: completedIds }
      }
    })
  }

  private async evaluateModule(
    module: any,
    azubi: AzubiProfile,
    history: LearningHistory[],
    peerInsights: any
  ): Promise<Recommendation> {
    let confidence = 0
    let reason = ''

    // Bewertungskriterien
    const criteria = [
      this.evaluateSkillMatch(module, azubi),
      this.evaluateDifficultyMatch(module, azubi, history),
      this.evaluateCareerRelevance(module, azubi),
      this.evaluatePeerSuccess(module, peerInsights),
      this.evaluatePrerequisites(module, azubi),
      this.evaluateTimeToExam(module, azubi)
    ]

    confidence = criteria.reduce((sum, c) => sum + c.score, 0) / criteria.length
    reason = criteria
      .filter(c => c.score > 70)
      .map(c => c.reason)
      .join('. ')

    return {
      moduleId: module.id,
      confidence: Math.round(confidence),
      reason: reason || 'Allgemeine Empfehlung',
      priority: confidence > 80 ? 'high' : confidence > 60 ? 'medium' : 'low',
      estimatedBenefit: Math.round(confidence * 0.9),
      module
    }
  }

  // Weitere Bewertungsmethoden...
  private evaluateSkillMatch(module: any, azubi: AzubiProfile) {
    const matchingSkills = module.skills.filter((skill: string) => 
      azubi.weakAreas.includes(skill)
    )
    
    return {
      score: matchingSkills.length > 0 ? 85 : 20,
      reason: matchingSkills.length > 0 
        ? `Stärkt Kompetenzen: ${matchingSkills.join(', ')}`
        : ''
    }
  }

  private evaluateDifficultyMatch(module: any, azubi: AzubiProfile, history: LearningHistory[]) {
    const avgCompletionRate = history.length > 0 
      ? history.reduce((sum, h) => sum + h.completionRate, 0) / history.length
      : 50

    const difficultyScore = {
      'BEGINNER': azubi.apprenticeshipYear === 1 ? 90 : 50,
      'INTERMEDIATE': azubi.apprenticeshipYear === 2 ? 90 : 60,
      'ADVANCED': azubi.apprenticeshipYear === 3 ? 90 : 40
    }[module.difficulty] || 30

    return {
      score: avgCompletionRate > 70 ? difficultyScore : difficultyScore * 0.7,
      reason: `Passend für ${azubi.apprenticeshipYear}. Lehrjahr`
    }
  }

  private evaluateCareerRelevance(module: any, azubi: AzubiProfile) {
    const isRelevant = module.category.includes(azubi.profession) ||
                      module.skills.some((skill: string) => 
                        azubi.profession.toLowerCase().includes(skill.toLowerCase())
                      )

    return {
      score: isRelevant ? 95 : 40,
      reason: isRelevant ? `Relevant für ${azubi.profession}` : ''
    }
  }

  private evaluatePeerSuccess(module: any, peerInsights: any) {
    const isPopular = peerInsights.popularModules.includes(module.id)
    
    return {
      score: isPopular ? 75 : 50,
      reason: isPopular ? 'Beliebt bei anderen Azubis' : ''
    }
  }

  private evaluatePrerequisites(module: any, azubi: AzubiProfile) {
    const missingPrereqs = module.prerequisites.filter((prereq: string) => 
      !azubi.currentSkills.includes(prereq)
    )

    return {
      score: missingPrereqs.length === 0 ? 80 : 20,
      reason: missingPrereqs.length === 0 ? 'Alle Voraussetzungen erfüllt' : ''
    }
  }

  private evaluateTimeToExam(module: any, azubi: AzubiProfile) {
    // Logik für zeitliche Nähe zu Prüfungen
    return {
      score: 60,
      reason: ''
    }
  }

  // Weitere Hilfsmethoden...
  private calculateAverageProgress(azubis: any[]) {
    // Implementation
    return 75
  }

  private findPopularModules(azubis: any[]) {
    // Implementation
    return []
  }

  private identifySuccessfulPaths(azubis: any[]) {
    // Implementation
    return []
  }

  private async suggestStudyGroups(azubi: AzubiProfile, peers: any[]) {
    // Implementation
    return []
  }

  private async suggestMentors(azubi: AzubiProfile, peers: any[]) {
    // Implementation
    return []
  }

  private async suggestCollaborativeProjects(azubi: AzubiProfile) {
    // Implementation
    return []
  }

  private async getCurrentSkillLevels(azubiId: string) {
    // Implementation
    return {}
  }

  private async sortSkillsByDependency(skills: string[]) {
    // Implementation
    return skills
  }

  private async findOptimalModulesForSkill(skill: string, currentSkills: any) {
    // Implementation
    return []
  }

  private calculatePathDifficulty(path: any[]) {
    // Implementation
    return 'INTERMEDIATE'
  }

  private extractPrerequisites(path: any[]) {
    // Implementation
    return []
  }
}
