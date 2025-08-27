import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validierungsschema für Projekte
const projectSchema = z.object({
  name: z.string().min(1, 'Projektname ist erforderlich'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD', 'CANCELLED']).default('ACTIVE'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  clientName: z.string().optional(),
})

// Alle Projekte abrufen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    // Filter erstellen
    const where: any = {}
    if (status) where.status = status
    if (priority) where.priority = priority
    
    // Projekte abrufen
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
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
          tasks: {
            select: {
              id: true,
              status: true,
            }
          },
          _count: {
            select: {
              tasks: true,
              timeEntries: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.project.count({ where })
    ])
    
    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    })
    
  } catch (error) {
    console.error('Fehler beim Abrufen der Projekte:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Neues Projekt erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validierung der Eingabedaten
    const validatedData = projectSchema.parse(body)
    
    // Benutzer-ID aus Header extrahieren
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }
    
    // Projekt erstellen
    const project = await prisma.project.create({
      data: {
        ...validatedData,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        members: {
          create: {
            userId,
            role: 'OWNER',
          }
        }
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
        }
      }
    })
    
    return NextResponse.json({
      message: 'Projekt erfolgreich erstellt',
      project
    }, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Fehler beim Erstellen des Projekts:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
