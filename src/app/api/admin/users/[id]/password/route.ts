import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

// Validierungsschema für Passwort-Reset
const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
})

// Passwort zurücksetzen (nur für Admins)
export async function PUT(
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
    const body = await request.json()
    const { newPassword } = resetPasswordSchema.parse(body)

    // Prüfen, ob Benutzer existiert
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      )
    }

    // Passwort hashen
    const hashedPassword = await hashPassword(newPassword)

    // Passwort aktualisieren
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    // Alle Sessions des Benutzers löschen (erzwingt erneute Anmeldung)
    await prisma.session.deleteMany({
      where: { userId: userId }
    })

    // Benachrichtigung an Benutzer
    await prisma.notification.create({
      data: {
        userId: userId,
        title: 'Passwort zurückgesetzt',
        message: 'Ihr Passwort wurde von einem Administrator zurückgesetzt. Bitte melden Sie sich mit dem neuen Passwort an.',
        type: 'WARNING'
      }
    })

    return NextResponse.json({
      message: 'Passwort erfolgreich zurückgesetzt'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Fehler beim Zurücksetzen des Passworts:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
