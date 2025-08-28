import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, generateToken, createSession } from '@/lib/auth'
import { z } from 'zod'

// Validierungsschema für Login
const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(1, 'Passwort ist erforderlich'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validierung der Eingabedaten
    const validatedData = loginSchema.parse(body)
    
    // Benutzer finden
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        username: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      }
    })
    
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      )
    }
    
    // Passwort überprüfen
    const isPasswordValid = await verifyPassword(validatedData.password, user.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      )
    }
    
    // JWT-Token generieren
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
    
    // Session erstellen
    await createSession(user.id, token)
    
    // Benutzerdaten ohne Passwort zurückgeben
    const { password, ...userWithoutPassword } = user
    
    return NextResponse.json({
      message: 'Anmeldung erfolgreich',
      user: userWithoutPassword,
      token,
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validierungsfehler', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Login-Fehler:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
