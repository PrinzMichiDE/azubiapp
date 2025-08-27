import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validierungsschema für Projekt-Updates
const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  clientName: z.string().optional(),
})

// Einzelnes Projekt abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id

    // Projekt mit allen Details abrufen
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
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
            }
          }
        },
        tasks: {
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              }
            },
            assignedUser: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              }
            },
            _count: {
              select: {
                subtasks: true,
                timeEntries: true,
                comments: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        timeEntries: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              }
            },
            task: {
              select: {
                id: true,
                title: true,
              }
            }
          },
          orderBy: { startTime: 'desc' },
          take: 10
        },
        _count: {
          select: {
            tasks: true,
            timeEntries: true,
            members: true,
          }
        }
      }
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Projekt nicht gefunden' },
        { status: 404 }
      )
    }

    // Projektstatistiken berechnen
    const completedTasks = project.tasks.filter(task => task.status === 'DONE').length
    const totalTasks = project.tasks.length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const totalTimeSpent = await prisma.timeEntry.aggregate({
      where: { projectId: projectId },
      _sum: { duration: true }
    })

    const projectWithStats = {
      ...project,
      stats: {
        progress,
        completedTasks,
        totalTasks,
        totalTimeSpent: totalTimeSpent._sum.duration || 0,
        activeTasks: project.tasks.filter(task => 
          ['TODO', 'IN_PROGRESS', 'REVIEW'].includes(task.status)
        ).length
      }
    }

    return NextResponse.json({ project: projectWithStats })

  } catch (error) {
    console.error('Fehler beim Abrufen des Projekts:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Projekt aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json()

    // Validierung der Eingabedaten
    const validatedData = updateProjectSchema.parse(body)

    // Benutzer-ID aus Header extrahieren
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }

    // Prüfen, ob Benutzer Berechtigung hat (Projektmitglied oder Admin)
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: projectId,
        userId: userId,
        role: { in: ['OWNER', 'MANAGER'] }
      }
    })

    const userRole = request.headers.get('x-user-role')
    if (!membership && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Bearbeiten dieses Projekts' },
        { status: 403 }
      )
    }

    // Projekt aktualisieren
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        _count: {
          select: {
            tasks: true,
            timeEntries: true,
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Projekt erfolgreich aktualisiert',
      project: updatedProject
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Fehler beim Aktualisieren des Projekts:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Projekt löschen
export async function DELETE(
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

    // Prüfen, ob Benutzer Berechtigung hat (Projektowner oder Admin)
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: projectId,
        userId: userId,
        role: 'OWNER'
      }
    })

    const userRole = request.headers.get('x-user-role')
    if (!membership && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Löschen dieses Projekts' },
        { status: 403 }
      )
    }

    // Projekt löschen (Cascade löscht auch alle verwandten Daten)
    await prisma.project.delete({
      where: { id: projectId }
    })

    return NextResponse.json({
      message: 'Projekt erfolgreich gelöscht'
    })

  } catch (error) {
    console.error('Fehler beim Löschen des Projekts:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
