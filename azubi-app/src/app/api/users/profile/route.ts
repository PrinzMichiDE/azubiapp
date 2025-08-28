import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/auth'
import { z } from 'zod'

// Validierungsschema für Profil-Updates
const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  avatar: z.string().url().optional(),
})

// Validierungsschema für Passwort-Änderung
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
  newPassword: z.string().min(8, 'Neues Passwort muss mindestens 8 Zeichen lang sein'),
  confirmPassword: z.string().min(1, 'Passwort-Bestätigung ist erforderlich'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
})

// Benutzerprofil abrufen
export async function GET(request: NextRequest) {
  try {
    // Benutzer-ID aus Header extrahieren
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }

    // Benutzerprofil mit Statistiken abrufen
    const [user, projectStats, taskStats, timeStats] = await Promise.all([
      // Basisprofil
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      
      // Projektstatistiken
      prisma.projectMember.findMany({
        where: { userId: userId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
              priority: true,
              _count: {
                select: { tasks: true }
              }
            }
          }
        }
      }),
      
      // Aufgabenstatistiken
      prisma.task.groupBy({
        by: ['status'],
        where: {
          OR: [
            { assignedTo: userId },
            { createdBy: userId }
          ]
        },
        _count: true
      }),
      
      // Zeiterfassungsstatistiken
      prisma.timeEntry.aggregate({
        where: { userId: userId },
        _sum: { duration: true },
        _count: true
      })
    ])

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      )
    }

    // Statistiken zusammenfassen
    const tasksByStatus = taskStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count
      return acc
    }, {} as Record<string, number>)

    const projectsByStatus = projectStats.reduce((acc, member) => {
      const status = member.project.status
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Aktuelle Aktivitäten (letzte 30 Tage)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentActivity = await prisma.timeEntry.findMany({
      where: {
        userId: userId,
        startTime: { gte: thirtyDaysAgo }
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        task: {
          select: { id: true, title: true }
        }
      },
      orderBy: { startTime: 'desc' },
      take: 10
    })

    // Achievements/Meilensteine berechnen
    const totalProjects = projectStats.length
    const completedTasks = tasksByStatus.DONE || 0
    const totalTimeHours = Math.round((timeStats._sum.duration || 0) / 3600 * 10) / 10

    const achievements = []
    if (totalProjects >= 5) achievements.push({ name: 'Projektjongleur', description: '5+ Projekte', icon: '🎪' })
    if (completedTasks >= 50) achievements.push({ name: 'Aufgabenheld', description: '50+ erledigte Aufgaben', icon: '🦸' })
    if (totalTimeHours >= 100) achievements.push({ name: 'Zeitmeister', description: '100+ Stunden erfasst', icon: '⏰' })

    const profile = {
      ...user,
      stats: {
        projects: {
          total: totalProjects,
          active: projectsByStatus.ACTIVE || 0,
          completed: projectsByStatus.COMPLETED || 0,
          onHold: projectsByStatus.ON_HOLD || 0,
        },
        tasks: {
          total: taskStats.reduce((sum, stat) => sum + stat._count, 0),
          completed: completedTasks,
          active: (tasksByStatus.TODO || 0) + (tasksByStatus.IN_PROGRESS || 0) + (tasksByStatus.REVIEW || 0),
          cancelled: tasksByStatus.CANCELLED || 0,
        },
        timeTracking: {
          totalHours: totalTimeHours,
          totalEntries: timeStats._count,
          averagePerEntry: timeStats._count > 0 
            ? Math.round(totalTimeHours / timeStats._count * 10) / 10 
            : 0,
        }
      },
      recentActivity: recentActivity.map(entry => ({
        id: entry.id,
        project: entry.project.name,
        task: entry.task?.title,
        duration: entry.duration,
        startTime: entry.startTime,
        description: entry.description,
      })),
      achievements,
      memberSince: user.createdAt,
      lastActive: new Date().toISOString() // Kann später durch echte "last seen" Daten ersetzt werden
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('Fehler beim Abrufen des Benutzerprofils:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Benutzerprofil aktualisieren
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // Benutzer-ID aus Header extrahieren
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }

    if (action === 'update-profile') {
      // Profil aktualisieren
      const validatedData = updateProfileSchema.parse(body)

      // Prüfen, ob E-Mail oder Benutzername bereits verwendet werden
      if (validatedData.email || validatedData.username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              ...(validatedData.email ? [{ email: validatedData.email }] : []),
              ...(validatedData.username ? [{ username: validatedData.username }] : []),
            ],
            NOT: { id: userId }
          }
        })

        if (existingUser) {
          return NextResponse.json(
            { error: 'E-Mail oder Benutzername wird bereits verwendet' },
            { status: 400 }
          )
        }
      }

      // Profil aktualisieren
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: validatedData,
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          role: true,
          updatedAt: true,
        }
      })

      return NextResponse.json({
        message: 'Profil erfolgreich aktualisiert',
        user: updatedUser
      })

    } else if (action === 'change-password') {
      // Passwort ändern
      const validatedData = changePasswordSchema.parse(body)

      // Aktuellen Benutzer abrufen
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, password: true }
      })

      if (!user) {
        return NextResponse.json(
          { error: 'Benutzer nicht gefunden' },
          { status: 404 }
        )
      }

      // Aktuelles Passwort überprüfen
      const isCurrentPasswordValid = await verifyPassword(
        validatedData.currentPassword, 
        user.password
      )

      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Aktuelles Passwort ist falsch' },
          { status: 400 }
        )
      }

      // Neues Passwort hashen
      const hashedNewPassword = await hashPassword(validatedData.newPassword)

      // Passwort aktualisieren
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      })

      // Alle Sessions des Benutzers löschen (außer der aktuellen)
      await prisma.session.deleteMany({
        where: { userId: userId }
      })

      return NextResponse.json({
        message: 'Passwort erfolgreich geändert'
      })

    } else {
      return NextResponse.json(
        { error: 'Ungültige Aktion' },
        { status: 400 }
      )
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Fehler beim Aktualisieren des Benutzerprofils:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Benutzerkonto deaktivieren
export async function DELETE(request: NextRequest) {
  try {
    // Benutzer-ID aus Header extrahieren
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }

    // Konto deaktivieren (nicht löschen, um Datenintegrität zu erhalten)
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false }
    })

    // Alle Sessions löschen
    await prisma.session.deleteMany({
      where: { userId: userId }
    })

    return NextResponse.json({
      message: 'Konto erfolgreich deaktiviert'
    })

  } catch (error) {
    console.error('Fehler beim Deaktivieren des Kontos:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
