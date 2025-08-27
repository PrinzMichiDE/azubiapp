import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

// Validierungsschema für Benutzer-Updates
const updateUserSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'USER', 'TRAINEE']).optional(),
  isActive: z.boolean().optional(),
})

// Einzelnen Benutzer abrufen (nur für Admins)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin-Berechtigung prüfen
    const userRole = request.headers.get('x-user-role')
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Keine Berechtigung für diese Aktion' },
        { status: 403 }
      )
    }

    const userId = params.id

    // Benutzer mit Details abrufen
    const user = await prisma.user.findUnique({
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
        projectMembers: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
              }
            }
          }
        },
        createdTasks: {
          select: {
            id: true,
            title: true,
            status: true,
            project: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        assignedTasks: {
          select: {
            id: true,
            title: true,
            status: true,
            project: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        timeEntries: {
          select: {
            id: true,
            duration: true,
            startTime: true,
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
          },
          take: 20,
          orderBy: { startTime: 'desc' }
        },
        sessions: {
          select: {
            id: true,
            createdAt: true,
            expiresAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      )
    }

    // Statistiken berechnen
    const timeStats = await prisma.timeEntry.aggregate({
      where: { userId: user.id },
      _sum: { duration: true },
      _count: true
    })

    const userWithStats = {
      ...user,
      stats: {
        projects: user.projectMembers.length,
        createdTasks: user.createdTasks.length,
        assignedTasks: user.assignedTasks.length,
        timeEntries: timeStats._count,
        hoursLogged: Math.round((timeStats._sum.duration || 0) / 3600 * 10) / 10,
        activeSessions: user.sessions.filter(s => new Date(s.expiresAt) > new Date()).length
      }
    }

    return NextResponse.json({ user: userWithStats })

  } catch (error) {
    console.error('Fehler beim Abrufen des Benutzers:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Benutzer aktualisieren (nur für Admins)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin-Berechtigung prüfen
    const userRole = request.headers.get('x-user-role')
    const currentUserId = request.headers.get('x-user-id')
    
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Keine Berechtigung für diese Aktion' },
        { status: 403 }
      )
    }

    const userId = params.id
    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    // Prüfen, ob Benutzer existiert
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true, role: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      )
    }

    // Verhindern, dass Admin sich selbst degradiert
    if (userId === currentUserId && validatedData.role && validatedData.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Sie können Ihre eigene Admin-Rolle nicht ändern' },
        { status: 400 }
      )
    }

    // Prüfen, ob E-Mail oder Benutzername bereits von anderem Benutzer verwendet wird
    if (validatedData.email || validatedData.username) {
      const conflicts = await prisma.user.findFirst({
        where: {
          OR: [
            ...(validatedData.email ? [{ email: validatedData.email }] : []),
            ...(validatedData.username ? [{ username: validatedData.username }] : []),
          ],
          NOT: { id: userId }
        }
      })

      if (conflicts) {
        return NextResponse.json(
          { error: 'E-Mail oder Benutzername bereits vergeben' },
          { status: 400 }
        )
      }
    }

    // Benutzer aktualisieren
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      }
    })

    // Benachrichtigung bei Rollenänderung
    if (validatedData.role && validatedData.role !== existingUser.role) {
      await prisma.notification.create({
        data: {
          userId: userId,
          title: 'Rolle geändert',
          message: `Ihre Rolle wurde von "${existingUser.role}" zu "${validatedData.role}" geändert.`,
          type: 'INFO'
        }
      })
    }

    // Benachrichtigung bei Deaktivierung
    if (validatedData.isActive === false) {
      await prisma.notification.create({
        data: {
          userId: userId,
          title: 'Konto deaktiviert',
          message: 'Ihr Konto wurde von einem Administrator deaktiviert.',
          type: 'WARNING'
        }
      })

      // Alle Sessions des Benutzers löschen
      await prisma.session.deleteMany({
        where: { userId: userId }
      })
    }

    return NextResponse.json({
      message: 'Benutzer erfolgreich aktualisiert',
      user: updatedUser
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Fehler beim Aktualisieren des Benutzers:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Benutzer löschen (nur für Admins)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Admin-Berechtigung prüfen
    const userRole = request.headers.get('x-user-role')
    const currentUserId = request.headers.get('x-user-id')
    
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Keine Berechtigung für diese Aktion' },
        { status: 403 }
      )
    }

    const userId = params.id

    // Verhindern, dass Admin sich selbst löscht
    if (userId === currentUserId) {
      return NextResponse.json(
        { error: 'Sie können Ihr eigenes Konto nicht löschen' },
        { status: 400 }
      )
    }

    // Prüfen, ob Benutzer existiert
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        username: true,
        _count: {
          select: {
            projectMembers: true,
            createdTasks: true,
            timeEntries: true
          }
        }
      }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      )
    }

    // Warnung bei Benutzern mit Daten
    const hasData = existingUser._count.projectMembers > 0 || 
                   existingUser._count.createdTasks > 0 || 
                   existingUser._count.timeEntries > 0

    if (hasData) {
      // Anstatt zu löschen, deaktivieren wir den Benutzer
      await prisma.user.update({
        where: { id: userId },
        data: { 
          isActive: false,
          email: `deleted_${Date.now()}_${existingUser.email}`,
          username: `deleted_${Date.now()}_${existingUser.username}`
        }
      })

      // Alle Sessions löschen
      await prisma.session.deleteMany({
        where: { userId: userId }
      })

      return NextResponse.json({
        message: 'Benutzer wurde deaktiviert (hat verknüpfte Daten)'
      })
    } else {
      // Benutzer komplett löschen (Cascade löscht verknüpfte Daten)
      await prisma.user.delete({
        where: { id: userId }
      })

      return NextResponse.json({
        message: 'Benutzer erfolgreich gelöscht'
      })
    }

  } catch (error) {
    console.error('Fehler beim Löschen des Benutzers:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
