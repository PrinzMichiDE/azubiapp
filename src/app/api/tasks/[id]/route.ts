import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validierungsschema für Aufgaben-Updates
const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  estimatedHours: z.number().positive().optional(),
  actualHours: z.number().positive().optional(),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  parentTaskId: z.string().optional(),
})

// Einzelne Aufgabe abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id

    // Aufgabe mit allen Details abrufen
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
            priority: true,
          }
        },
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        assignedUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        parentTask: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        subtasks: {
          include: {
            assignedUser: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              }
            }
          },
          orderBy: { createdAt: 'asc' }
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
            }
          },
          orderBy: { startTime: 'desc' }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            subtasks: true,
            timeEntries: true,
            comments: true,
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Aufgabe nicht gefunden' },
        { status: 404 }
      )
    }

    // Aufgabenstatistiken berechnen
    const totalTimeSpent = task.timeEntries.reduce((sum, entry) => 
      sum + (entry.duration || 0), 0
    )

    const completedSubtasks = task.subtasks.filter(subtask => 
      subtask.status === 'DONE'
    ).length

    const subtaskProgress = task.subtasks.length > 0 
      ? Math.round((completedSubtasks / task.subtasks.length) * 100) 
      : 0

    const taskWithStats = {
      ...task,
      stats: {
        totalTimeSpent,
        completedSubtasks,
        totalSubtasks: task.subtasks.length,
        subtaskProgress,
        isOverdue: task.dueDate ? new Date(task.dueDate) < new Date() : false,
        timeSpentVsEstimated: task.estimatedHours 
          ? Math.round((totalTimeSpent / 3600) / task.estimatedHours * 100)
          : null
      }
    }

    return NextResponse.json({ task: taskWithStats })

  } catch (error) {
    console.error('Fehler beim Abrufen der Aufgabe:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Aufgabe aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id
    const body = await request.json()

    // Validierung der Eingabedaten
    const validatedData = updateTaskSchema.parse(body)

    // Benutzer-ID aus Header extrahieren
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }

    // Prüfen, ob Benutzer Berechtigung hat
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: {
              where: { userId: userId }
            }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Aufgabe nicht gefunden' },
        { status: 404 }
      )
    }

    const userRole = request.headers.get('x-user-role')
    const isProjectMember = task.project.members.length > 0
    const isTaskCreator = task.createdBy === userId
    const isAssignedUser = task.assignedTo === userId

    if (!isProjectMember && !isTaskCreator && !isAssignedUser && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Bearbeiten dieser Aufgabe' },
        { status: 403 }
      )
    }

    // Aufgabe aktualisieren
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...validatedData,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          }
        },
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
        }
      }
    })

    // Benachrichtigung erstellen, wenn Aufgabe zugewiesen wurde
    if (validatedData.assignedTo && validatedData.assignedTo !== task.assignedTo) {
      await prisma.notification.create({
        data: {
          userId: validatedData.assignedTo,
          title: 'Neue Aufgabe zugewiesen',
          message: `Ihnen wurde die Aufgabe "${updatedTask.title}" zugewiesen.`,
          type: 'INFO'
        }
      })
    }

    return NextResponse.json({
      message: 'Aufgabe erfolgreich aktualisiert',
      task: updatedTask
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Fehler beim Aktualisieren der Aufgabe:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Aufgabe löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const taskId = params.id

    // Benutzer-ID aus Header extrahieren
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }

    // Prüfen, ob Benutzer Berechtigung hat
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: {
              where: { 
                userId: userId,
                role: { in: ['OWNER', 'MANAGER'] }
              }
            }
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Aufgabe nicht gefunden' },
        { status: 404 }
      )
    }

    const userRole = request.headers.get('x-user-role')
    const isProjectManager = task.project.members.length > 0
    const isTaskCreator = task.createdBy === userId

    if (!isProjectManager && !isTaskCreator && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Löschen dieser Aufgabe' },
        { status: 403 }
      )
    }

    // Aufgabe löschen (Cascade löscht auch alle verwandten Daten)
    await prisma.task.delete({
      where: { id: taskId }
    })

    return NextResponse.json({
      message: 'Aufgabe erfolgreich gelöscht'
    })

  } catch (error) {
    console.error('Fehler beim Löschen der Aufgabe:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
