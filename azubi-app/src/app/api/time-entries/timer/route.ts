import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validierungsschema für Timer-Start
const startTimerSchema = z.object({
  projectId: z.string().min(1, 'Projekt-ID ist erforderlich'),
  taskId: z.string().optional(),
  description: z.string().optional(),
})

// Validierungsschema für Timer-Stopp
const stopTimerSchema = z.object({
  description: z.string().optional(),
  isBillable: z.boolean().default(false),
})

// Timer starten
export async function POST(request: NextRequest) {
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

    if (action === 'start') {
      // Timer starten
      const validatedData = startTimerSchema.parse(body)

      // Prüfen, ob bereits ein Timer läuft
      const activeTimer = await prisma.timeEntry.findFirst({
        where: {
          userId: userId,
          endTime: null
        }
      })

      if (activeTimer) {
        return NextResponse.json(
          { error: 'Es läuft bereits ein Timer. Bitte stoppen Sie den aktuellen Timer zuerst.' },
          { status: 400 }
        )
      }

      // Neuen Timer starten
      const timeEntry = await prisma.timeEntry.create({
        data: {
          userId: userId,
          projectId: validatedData.projectId,
          taskId: validatedData.taskId,
          description: validatedData.description,
          startTime: new Date(),
          isBillable: false, // Wird beim Stoppen gesetzt
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            }
          },
          task: {
            select: {
              id: true,
              title: true,
            }
          }
        }
      })

      return NextResponse.json({
        message: 'Timer erfolgreich gestartet',
        timeEntry
      })

    } else if (action === 'stop') {
      // Timer stoppen
      const validatedData = stopTimerSchema.parse(body)

      // Aktiven Timer finden
      const activeTimer = await prisma.timeEntry.findFirst({
        where: {
          userId: userId,
          endTime: null
        }
      })

      if (!activeTimer) {
        return NextResponse.json(
          { error: 'Kein aktiver Timer gefunden' },
          { status: 400 }
        )
      }

      const endTime = new Date()
      const duration = Math.floor((endTime.getTime() - activeTimer.startTime.getTime()) / 1000)

      // Timer stoppen und aktualisieren
      const stoppedTimer = await prisma.timeEntry.update({
        where: { id: activeTimer.id },
        data: {
          endTime: endTime,
          duration: duration,
          description: validatedData.description || activeTimer.description,
          isBillable: validatedData.isBillable,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            }
          },
          task: {
            select: {
              id: true,
              title: true,
            }
          }
        }
      })

      // Wenn mit einer Aufgabe verknüpft, actualHours aktualisieren
      if (stoppedTimer.taskId) {
        await prisma.task.update({
          where: { id: stoppedTimer.taskId },
          data: {
            actualHours: {
              increment: duration / 3600 // Sekunden zu Stunden
            }
          }
        })
      }

      return NextResponse.json({
        message: 'Timer erfolgreich gestoppt',
        timeEntry: stoppedTimer
      })

    } else if (action === 'pause') {
      // Timer pausieren
      const activeTimer = await prisma.timeEntry.findFirst({
        where: {
          userId: userId,
          endTime: null
        }
      })

      if (!activeTimer) {
        return NextResponse.json(
          { error: 'Kein aktiver Timer gefunden' },
          { status: 400 }
        )
      }

      const endTime = new Date()
      const duration = Math.floor((endTime.getTime() - activeTimer.startTime.getTime()) / 1000)

      // Timer pausieren (endTime setzen)
      const pausedTimer = await prisma.timeEntry.update({
        where: { id: activeTimer.id },
        data: {
          endTime: endTime,
          duration: duration,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            }
          },
          task: {
            select: {
              id: true,
              title: true,
            }
          }
        }
      })

      return NextResponse.json({
        message: 'Timer erfolgreich pausiert',
        timeEntry: pausedTimer
      })

    } else {
      return NextResponse.json(
        { error: 'Ungültige Aktion. Verwenden Sie "start", "stop" oder "pause".' },
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

    console.error('Fehler bei Timer-Operation:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Aktuellen Timer-Status abrufen
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

    // Aktiven Timer finden
    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: userId,
        endTime: null
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
          }
        },
        task: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    })

    if (!activeTimer) {
      return NextResponse.json({
        isRunning: false,
        timeEntry: null
      })
    }

    // Aktuelle Laufzeit berechnen
    const currentTime = Math.floor((new Date().getTime() - activeTimer.startTime.getTime()) / 1000)

    return NextResponse.json({
      isRunning: true,
      timeEntry: {
        ...activeTimer,
        currentDuration: currentTime
      }
    })

  } catch (error) {
    console.error('Fehler beim Abrufen des Timer-Status:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
