import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validierungsschema für Mitglieder hinzufügen
const addMemberSchema = z.object({
  userId: z.string().min(1, 'Benutzer-ID ist erforderlich'),
  role: z.enum(['OWNER', 'MANAGER', 'MEMBER', 'VIEWER']).default('MEMBER'),
})

// Validierungsschema für Mitgliederrolle aktualisieren
const updateMemberRoleSchema = z.object({
  role: z.enum(['OWNER', 'MANAGER', 'MEMBER', 'VIEWER']),
})

// Alle Projektmitglieder abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Benutzer-ID aus Header extrahieren
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }

    // Prüfen, ob Benutzer Zugriff auf das Projekt hat
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: projectId,
        userId: userId
      }
    })

    const userRole = request.headers.get('x-user-role')
    if (!membership && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Anzeigen der Projektmitglieder' },
        { status: 403 }
      )
    }

    // Projektmitglieder abrufen
    const members = await prisma.projectMember.findMany({
      where: { projectId: projectId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            isActive: true,
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { joinedAt: 'asc' }
      ]
    })

    // Zusätzliche Statistiken für jeden Mitarbeiter
    const membersWithStats = await Promise.all(
      members.map(async (member) => {
        const [taskStats, timeStats] = await Promise.all([
          // Aufgabenstatistiken
          prisma.task.groupBy({
            by: ['status'],
            where: {
              projectId: projectId,
              assignedTo: member.userId
            },
            _count: true
          }),
          // Zeiterfassungsstatistiken (letzte 30 Tage)
          prisma.timeEntry.aggregate({
            where: {
              projectId: projectId,
              userId: member.userId,
              startTime: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            },
            _sum: { duration: true },
            _count: true
          })
        ])

        const tasksByStatus = taskStats.reduce((acc, stat) => {
          acc[stat.status] = stat._count
          return acc
        }, {} as Record<string, number>)

        return {
          ...member,
          stats: {
            tasks: {
              total: taskStats.reduce((sum, stat) => sum + stat._count, 0),
              completed: tasksByStatus.DONE || 0,
              active: (tasksByStatus.TODO || 0) + (tasksByStatus.IN_PROGRESS || 0) + (tasksByStatus.REVIEW || 0),
              cancelled: tasksByStatus.CANCELLED || 0
            },
            timeTracking: {
              totalTime: timeStats._sum.duration || 0,
              entries: timeStats._count,
              averagePerDay: timeStats._count > 0 
                ? Math.round((timeStats._sum.duration || 0) / timeStats._count / 3600 * 10) / 10
                : 0
            }
          }
        }
      })
    )

    return NextResponse.json({
      members: membersWithStats,
      totalMembers: members.length
    })

  } catch (error) {
    console.error('Fehler beim Abrufen der Projektmitglieder:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Neues Mitglied zum Projekt hinzufügen
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json()

    // Validierung der Eingabedaten
    const validatedData = addMemberSchema.parse(body)

    // Benutzer-ID aus Header extrahieren
    const requestUserId = request.headers.get('x-user-id')
    if (!requestUserId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }

    // Prüfen, ob Benutzer Berechtigung hat (Owner/Manager oder Admin)
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: projectId,
        userId: requestUserId,
        role: { in: ['OWNER', 'MANAGER'] }
      }
    })

    const userRole = request.headers.get('x-user-role')
    if (!membership && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Hinzufügen von Projektmitgliedern' },
        { status: 403 }
      )
    }

    // Prüfen, ob Benutzer existiert
    const targetUser = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      select: { id: true, isActive: true }
    })

    if (!targetUser || !targetUser.isActive) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden oder inaktiv' },
        { status: 404 }
      )
    }

    // Prüfen, ob Benutzer bereits Mitglied ist
    const existingMembership = await prisma.projectMember.findFirst({
      where: {
        projectId: projectId,
        userId: validatedData.userId
      }
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Benutzer ist bereits Mitglied dieses Projekts' },
        { status: 400 }
      )
    }

    // Neues Mitglied hinzufügen
    const newMember = await prisma.projectMember.create({
      data: {
        projectId: projectId,
        userId: validatedData.userId,
        role: validatedData.role,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          }
        },
        project: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    // Benachrichtigung erstellen
    await prisma.notification.create({
      data: {
        userId: validatedData.userId,
        title: 'Zu Projekt hinzugefügt',
        message: `Sie wurden zum Projekt "${newMember.project.name}" hinzugefügt.`,
        type: 'INFO'
      }
    })

    return NextResponse.json({
      message: 'Mitglied erfolgreich hinzugefügt',
      member: newMember
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Fehler beim Hinzufügen des Projektmitglieds:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Mitgliederrolle aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json()
    const { userId: targetUserId } = body

    // Validierung der Eingabedaten
    const validatedData = updateMemberRoleSchema.parse(body)

    // Benutzer-ID aus Header extrahieren
    const requestUserId = request.headers.get('x-user-id')
    if (!requestUserId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }

    // Prüfen, ob Benutzer Berechtigung hat (Owner oder Admin)
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: projectId,
        userId: requestUserId,
        role: 'OWNER'
      }
    })

    const userRole = request.headers.get('x-user-role')
    if (!membership && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Ändern von Mitgliederrollen' },
        { status: 403 }
      )
    }

    // Mitgliederrolle aktualisieren
    const updatedMember = await prisma.projectMember.update({
      where: {
        userId_projectId: {
          userId: targetUserId,
          projectId: projectId
        }
      },
      data: {
        role: validatedData.role
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Mitgliederrolle erfolgreich aktualisiert',
      member: updatedMember
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Fehler beim Aktualisieren der Mitgliederrolle:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Mitglied aus Projekt entfernen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Benutzer-ID ist erforderlich' },
        { status: 400 }
      )
    }

    // Benutzer-ID aus Header extrahieren
    const requestUserId = request.headers.get('x-user-id')
    if (!requestUserId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }

    // Prüfen, ob Benutzer Berechtigung hat (Owner oder Admin)
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: projectId,
        userId: requestUserId,
        role: 'OWNER'
      }
    })

    const userRole = request.headers.get('x-user-role')
    if (!membership && userRole !== 'ADMIN' && requestUserId !== targetUserId) {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Entfernen von Projektmitgliedern' },
        { status: 403 }
      )
    }

    // Mitglied entfernen
    await prisma.projectMember.delete({
      where: {
        userId_projectId: {
          userId: targetUserId,
          projectId: projectId
        }
      }
    })

    return NextResponse.json({
      message: 'Mitglied erfolgreich entfernt'
    })

  } catch (error) {
    console.error('Fehler beim Entfernen des Projektmitglieds:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
