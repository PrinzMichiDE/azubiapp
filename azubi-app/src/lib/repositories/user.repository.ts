/**
 * User Repository für Benutzerdaten-Management
 * User Repository for user data management
 */
import { User, UserRole, Prisma } from '@prisma/client'
import { BaseRepository } from './base.repository'

interface UserWithStats extends User {
  stats?: {
    projects: number
    tasks: number
    timeEntries: number
    hoursLogged: number
  }
}

interface UserSearchFilters {
  search?: string
  role?: UserRole
  isActive?: boolean
  department?: string
  skills?: string[]
  dateFrom?: Date
  dateTo?: Date
}

/**
 * User Repository mit erweiterten Benutzer-spezifischen Operationen
 * User Repository with extended user-specific operations
 * 
 * Features:
 * - Benutzer-CRUD mit Statistiken
 * - Erweiterte Suchfunktionen
 * - Skill-Management
 * - Performance-Optimierungen
 */
export class UserRepository extends BaseRepository<User> {
  protected getModelName(): string {
    return 'user'
  }

  /**
   * Benutzer anhand E-Mail finden
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.findUnique({ email })
  }

  /**
   * Benutzer anhand Benutzername finden
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.findUnique({ username })
  }

  /**
   * Benutzer mit Statistiken abrufen
   * Get user with statistics
   */
  async findByIdWithStats(id: string): Promise<UserWithStats | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projects: true,
            assignedTasks: true,
            timeEntries: true
          }
        }
      }
    })

    if (!user) return null

    // Zusätzliche Statistiken berechnen
    const hoursLogged = await this.prisma.timeEntry.aggregate({
      where: { userId: id },
      _sum: { duration: true }
    })

    return {
      ...user,
      stats: {
        projects: user._count.projects,
        tasks: user._count.assignedTasks,
        timeEntries: user._count.timeEntries,
        hoursLogged: Math.round((hoursLogged._sum.duration || 0) / 60) // Convert minutes to hours
      }
    }
  }

  /**
   * Erweiterte Benutzersuche mit Filtern
   * Advanced user search with filters
   */
  async searchUsers(
    filters: UserSearchFilters,
    pagination: { page?: number; limit?: number } = {}
  ) {
    const where: Prisma.UserWhereInput = {}

    // Text-Suche in Name, E-Mail, Username
    if (filters.search) {
      const searchTerm = filters.search.trim()
      where.OR = [
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { username: { contains: searchTerm, mode: 'insensitive' } },
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } }
      ]
    }

    // Filter nach Rolle
    if (filters.role) {
      where.role = filters.role
    }

    // Filter nach Aktivitätsstatus
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
    }

    // Filter nach Erstellungsdatum
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom
      if (filters.dateTo) where.createdAt.lte = filters.dateTo
    }

    // Filter nach Skills (wenn implementiert)
    if (filters.skills && filters.skills.length > 0) {
      where.skills = {
        some: {
          skill: {
            name: { in: filters.skills }
          }
        }
      }
    }

    return this.findManyWithPagination({
      where,
      include: {
        _count: {
          select: {
            projects: true,
            assignedTasks: true,
            timeEntries: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      ...pagination
    })
  }

  /**
   * Benutzer-Profil mit allen Beziehungen
   * User profile with all relationships
   */
  async getFullProfile(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        projects: {
          select: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
                progress: true
              }
            },
            role: true
          }
        },
        assignedTasks: {
          where: { status: { not: 'DONE' } },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            project: {
              select: { name: true }
            }
          },
          take: 10,
          orderBy: { dueDate: 'asc' }
        },
        notifications: {
          where: { isRead: false },
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        skills: {
          include: { skill: true }
        },
        achievements: {
          include: { achievement: true },
          orderBy: { unlockedAt: 'desc' }
        }
      }
    })
  }

  /**
   * Benutzer-Dashboard-Daten
   * User dashboard data
   */
  async getDashboardData(id: string) {
    const [user, recentActivity, upcomingDeadlines, teamStats] = await Promise.all([
      this.findByIdWithStats(id),
      this.getRecentActivity(id),
      this.getUpcomingDeadlines(id),
      this.getTeamStats(id)
    ])

    return {
      user,
      recentActivity,
      upcomingDeadlines,
      teamStats
    }
  }

  /**
   * Aktuelle Aktivitäten des Benutzers
   * Recent user activities
   */
  private async getRecentActivity(userId: string, limit = 10) {
    // Verschiedene Aktivitäten zusammenführen
    const [tasks, timeEntries, comments] = await Promise.all([
      this.prisma.task.findMany({
        where: { 
          OR: [
            { assignedToId: userId },
            { createdById: userId }
          ]
        },
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
          project: { select: { name: true } }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit
      }),
      this.prisma.timeEntry.findMany({
        where: { userId },
        select: {
          id: true,
          duration: true,
          description: true,
          createdAt: true,
          task: { select: { title: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),
      this.prisma.comment.findMany({
        where: { createdById: userId },
        select: {
          id: true,
          content: true,
          createdAt: true,
          task: { select: { title: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    ])

    // Aktivitäten zusammenführen und sortieren
    const activities: any[] = [
      ...tasks.map(task => ({
        type: 'task',
        id: task.id,
        title: `Aufgabe: ${task.title}`,
        subtitle: task.project.name,
        timestamp: task.updatedAt
      })),
      ...timeEntries.map(entry => ({
        type: 'time',
        id: entry.id,
        title: `Zeiterfassung: ${Math.round(entry.duration / 60)}h`,
        subtitle: entry.task?.title || entry.description,
        timestamp: entry.createdAt
      })),
      ...comments.map(comment => ({
        type: 'comment',
        id: comment.id,
        title: 'Kommentar erstellt',
        subtitle: comment.task?.title || 'Allgemein',
        timestamp: comment.createdAt
      }))
    ]

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  /**
   * Anstehende Deadlines für Benutzer
   * Upcoming deadlines for user
   */
  private async getUpcomingDeadlines(userId: string, days = 7) {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    return this.prisma.task.findMany({
      where: {
        assignedToId: userId,
        status: { not: 'DONE' },
        dueDate: {
          gte: new Date(),
          lte: endDate
        }
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        project: { select: { name: true } }
      },
      orderBy: { dueDate: 'asc' }
    })
  }

  /**
   * Team-Statistiken für Benutzer
   * Team statistics for user
   */
  private async getTeamStats(userId: string) {
    const userProjects = await this.prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true }
    })

    const projectIds = userProjects.map(p => p.projectId)

    if (projectIds.length === 0) {
      return {
        teamMembers: 0,
        sharedProjects: 0,
        teamProductivity: 0
      }
    }

    const [teamMembers, completedTasks] = await Promise.all([
      this.prisma.projectMember.groupBy({
        by: ['userId'],
        where: { projectId: { in: projectIds } }
      }),
      this.prisma.task.count({
        where: {
          projectId: { in: projectIds },
          status: 'DONE',
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Letzte 30 Tage
          }
        }
      })
    ])

    return {
      teamMembers: teamMembers.length,
      sharedProjects: projectIds.length,
      teamProductivity: completedTasks
    }
  }

  /**
   * Benutzer-Skills verwalten
   * Manage user skills
   */
  async updateUserSkills(userId: string, skills: string[]) {
    return this.prisma.$transaction(async (prisma) => {
      // Alte Skills entfernen
      await prisma.userSkill.deleteMany({
        where: { userId }
      })

      // Neue Skills hinzufügen
      const skillsData = skills.map(skillName => ({
        userId,
        skillId: skillName // Annahme: Skills werden per Name referenziert
      }))

      if (skillsData.length > 0) {
        await prisma.userSkill.createMany({
          data: skillsData,
          skipDuplicates: true
        })
      }

      return this.findById(userId)
    })
  }

  /**
   * Benutzer-Fortschritt aktualisieren
   * Update user progress
   */
  async updateProgress(userId: string, progressData: {
    xp?: number
    level?: number
    completedTasks?: number
    hoursWorked?: number
  }) {
    const updateData: any = {}
    
    if (progressData.xp !== undefined) {
      updateData.xp = { increment: progressData.xp }
    }
    
    if (progressData.level !== undefined) {
      updateData.level = progressData.level
    }

    return this.update(userId, updateData)
  }

  /**
   * Bulk-Operationen für Admin
   * Bulk operations for admin
   */
  async bulkUpdateRole(userIds: string[], role: UserRole) {
    return this.updateMany(
      { id: { in: userIds } },
      { role }
    )
  }

  async bulkActivate(userIds: string[], isActive: boolean) {
    return this.updateMany(
      { id: { in: userIds } },
      { isActive }
    )
  }

  /**
   * Erweiterte Benutzer-Statistiken
   * Advanced user statistics
   */
  async getUserAnalytics(userId: string, dateRange: { from: Date; to: Date }) {
    const [taskStats, timeStats, projectStats] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['status'],
        where: {
          assignedToId: userId,
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to
          }
        },
        _count: true
      }),
      this.prisma.timeEntry.aggregate({
        where: {
          userId,
          createdAt: {
            gte: dateRange.from,
            lte: dateRange.to
          }
        },
        _sum: { duration: true },
        _count: true
      }),
      this.prisma.projectMember.count({
        where: {
          userId,
          joinedAt: {
            gte: dateRange.from,
            lte: dateRange.to
          }
        }
      })
    ])

    return {
      tasks: taskStats,
      timeTracking: {
        totalHours: Math.round((timeStats._sum.duration || 0) / 60),
        entriesCount: timeStats._count
      },
      projects: projectStats
    }
  }
}
