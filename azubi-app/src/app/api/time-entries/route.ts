import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validierungsschema für Zeiterfassung
const timeEntrySchema = z.object({
  projectId: z.string().min(1, 'Projekt-ID ist erforderlich'),
  taskId: z.string().optional(),
  description: z.string().optional(),
  startTime: z.string().datetime('Startzeit ist erforderlich'),
  endTime: z.string().datetime().optional(),
  duration: z.number().positive().optional(),
  isBillable: z.boolean().default(false),
})

// Alle Zeiterfassungen abrufen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const projectId = searchParams.get('projectId')
    const taskId = searchParams.get('taskId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    // Filter erstellen
    const where: any = {}
    if (userId) where.userId = userId
    if (projectId) where.projectId = projectId
    if (taskId) where.taskId = taskId
    if (startDate || endDate) {
      where.startTime = {}
      if (startDate) where.startTime.gte = new Date(startDate)
      if (endDate) where.startTime.lte = new Date(endDate)
    }
    
    // Zeiterfassungen abrufen
    const [timeEntries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            }
          },
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            }
          },
          task: {
            select: {
              id: true,
              title: true,
              status: true,
            }
          }
        },
        orderBy: { startTime: 'desc' },
        skip,
        take: limit,
      }),
      prisma.timeEntry.count({ where })
    ])
    
    return NextResponse.json({
      timeEntries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    })
    
  } catch (error) {
    console.error('Fehler beim Abrufen der Zeiterfassungen:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Neue Zeiterfassung erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validierung der Eingabedaten
    const validatedData = timeEntrySchema.parse(body)
    
    // Benutzer-ID aus Header extrahieren
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }
    
    // Zeiterfassung erstellen
    const timeEntry = await prisma.timeEntry.create({
      data: {
        ...validatedData,
        userId,
        startTime: new Date(validatedData.startTime),
        endTime: validatedData.endTime ? new Date(validatedData.endTime) : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          }
        },
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        }
      }
    })
    
    return NextResponse.json({
      message: 'Zeiterfassung erfolgreich erstellt',
      timeEntry
    }, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Fehler beim Erstellen der Zeiterfassung:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
