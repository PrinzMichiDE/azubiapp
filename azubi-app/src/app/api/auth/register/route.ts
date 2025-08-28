import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'
import { z } from 'zod'

// Validierungsschema für Registrierung
const registerSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  username: z.string().min(3, 'Benutzername muss mindestens 3 Zeichen lang sein'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  firstName: z.string().min(1, 'Vorname ist erforderlich'),
  lastName: z.string().min(1, 'Nachname ist erforderlich'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validierung der Eingabedaten
    const validatedData = registerSchema.parse(body)
    
    // Prüfen, ob Benutzer bereits existiert
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
        { error: 'Benutzer mit dieser E-Mail oder diesem Benutzernamen existiert bereits' },
        { status: 400 }
      )
    }
    
    // Passwort hashen
    const hashedPassword = await hashPassword(validatedData.password)
    
    // Benutzer erstellen
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        username: validatedData.username,
        password: hashedPassword,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      }
    })
    
    return NextResponse.json({
      message: 'Benutzer erfolgreich registriert',
      user
    }, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Registrierungsfehler:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
