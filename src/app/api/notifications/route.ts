import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validierungsschema für neue Benachrichtigungen
const createNotificationSchema = z.object({
  userId: z.string().min(1, 'Benutzer-ID ist erforderlich'),
  title: z.string().min(1, 'Titel ist erforderlich'),
  message: z.string().min(1, 'Nachricht ist erforderlich'),
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']).default('INFO'),
})

// Alle Benachrichtigungen abrufen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    const isRead = searchParams.get('isRead')
    const skip = (page - 1) * limit

    // Benutzer-ID aus Header extrahieren
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }

    // Filter erstellen
    const where: any = { userId: userId }
    if (type) where.type = type
    if (isRead !== null) where.isRead = isRead === 'true'

    // Benachrichtigungen abrufen
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: userId,
          isRead: false
        }
      })
    ])

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount
    })

  } catch (error) {
    console.error('Fehler beim Abrufen der Benachrichtigungen:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Neue Benachrichtigung erstellen (nur für Admins)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validierung der Eingabedaten
    const validatedData = createNotificationSchema.parse(body)

    // Prüfen, ob Benutzer Admin ist
    const userRole = request.headers.get('x-user-role')
    if (userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Erstellen von Benachrichtigungen' },
        { status: 403 }
      )
    }

    // Prüfen, ob Zielbenutzer existiert
    const targetUser = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      select: { id: true, isActive: true }
    })

    if (!targetUser || !targetUser.isActive) {
      return NextResponse.json(
        { error: 'Zielbenutzer nicht gefunden oder inaktiv' },
        { status: 404 }
      )
    }

    // Benachrichtigung erstellen
    const notification = await prisma.notification.create({
      data: validatedData
    })

    return NextResponse.json({
      message: 'Benachrichtigung erfolgreich erstellt',
      notification
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Fehler beim Erstellen der Benachrichtigung:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Benachrichtigungen als gelesen markieren
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, notificationIds } = body

    // Benutzer-ID aus Header extrahieren
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }

    if (action === 'mark-read') {
      // Spezifische Benachrichtigungen als gelesen markieren
      if (!notificationIds || !Array.isArray(notificationIds)) {
        return NextResponse.json(
          { error: 'Benachrichtigungs-IDs sind erforderlich' },
          { status: 400 }
        )
      }

      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: userId
        },
        data: { isRead: true }
      })

      return NextResponse.json({
        message: 'Benachrichtigungen als gelesen markiert'
      })

    } else if (action === 'mark-all-read') {
      // Alle Benachrichtigungen als gelesen markieren
      const result = await prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false
        },
        data: { isRead: true }
      })

      return NextResponse.json({
        message: `${result.count} Benachrichtigungen als gelesen markiert`
      })

    } else {
      return NextResponse.json(
        { error: 'Ungültige Aktion' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Fehler beim Aktualisieren der Benachrichtigungen:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Benachrichtigungen löschen
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const notificationIds = searchParams.get('ids')?.split(',')
    const deleteAll = searchParams.get('all') === 'true'

    // Benutzer-ID aus Header extrahieren
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }

    if (deleteAll) {
      // Alle gelesenen Benachrichtigungen löschen
      const result = await prisma.notification.deleteMany({
        where: {
          userId: userId,
          isRead: true
        }
      })

      return NextResponse.json({
        message: `${result.count} Benachrichtigungen gelöscht`
      })

    } else if (notificationIds && notificationIds.length > 0) {
      // Spezifische Benachrichtigungen löschen
      const result = await prisma.notification.deleteMany({
        where: {
          id: { in: notificationIds },
          userId: userId
        }
      })

      return NextResponse.json({
        message: `${result.count} Benachrichtigungen gelöscht`
      })

    } else {
      return NextResponse.json(
        { error: 'Keine Benachrichtigungs-IDs angegeben' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Fehler beim Löschen der Benachrichtigungen:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
