import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

// Validierungsschema für Benutzer-Erstellung
const createUserSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  username: z.string().min(3, 'Benutzername muss mindestens 3 Zeichen lang sein'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  firstName: z.string().min(1, 'Vorname ist erforderlich'),
  lastName: z.string().min(1, 'Nachname ist erforderlich'),
  role: z.enum(['ADMIN', 'MANAGER', 'USER', 'TRAINEE']).default('USER'),
})

// Validierungsschema für Benutzer-Updates
const updateUserSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'USER', 'TRAINEE']).optional(),
  isActive: z.boolean().optional(),
})

// Alle Benutzer abrufen (nur für Admins)
export async function GET(request: NextRequest) {
  try {
    // Admin-Berechtigung prüfen
    const userRole = request.headers.get('x-user-role')
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Keine Berechtigung für diese Aktion' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const role = searchParams.get('role')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')
    const skip = (page - 1) * limit

    // Filter erstellen
    const where: any = {}
    if (role && role !== 'ALL') where.role = role
    if (isActive !== null && isActive !== 'ALL') where.isActive = isActive === 'true'
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Benutzer abrufen
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
          _count: {
            select: {
              projectMembers: true,
              createdTasks: true,
              assignedTasks: true,
              timeEntries: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where })
    ])

    // Benutzer mit Statistiken anreichern
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const timeStats = await prisma.timeEntry.aggregate({
          where: { userId: user.id },
          _sum: { duration: true }
        })

        return {
          ...user,
          stats: {
            projects: user._count.projectMembers,
            tasks: user._count.createdTasks + user._count.assignedTasks,
            timeEntries: user._count.timeEntries,
            hoursLogged: Math.round((timeStats._sum.duration || 0) / 3600 * 10) / 10
          }
        }
      })
    )

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    })

  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzer:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Neuen Benutzer erstellen (nur für Admins)
export async function POST(request: NextRequest) {
  try {
    // Admin-Berechtigung prüfen
    const userRole = request.headers.get('x-user-role')
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Keine Berechtigung für diese Aktion' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Prüfen, ob E-Mail oder Benutzername bereits existiert
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username }
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'E-Mail oder Benutzername bereits vergeben' },
        { status: 400 }
      )
    }

    // Passwort hashen
    const hashedPassword = await hashPassword(validatedData.password)

    // Benutzer erstellen
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
        isActive: true,
        emailVerified: new Date(), // Admin-erstellte Benutzer sind automatisch verifiziert
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    })

    // Benachrichtigung an neuen Benutzer
    await prisma.notification.create({
      data: {
        userId: newUser.id,
        title: 'Willkommen bei Azubi!',
        message: `Ihr Konto wurde von einem Administrator erstellt. Sie können sich mit Ihrem Benutzernamen "${validatedData.username}" anmelden.`,
        type: 'INFO'
      }
    })

    return NextResponse.json({
      message: 'Benutzer erfolgreich erstellt',
      user: newUser
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Fehler beim Erstellen des Benutzers:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
