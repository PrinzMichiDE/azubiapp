import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './db'

// JWT Secret aus Umgebungsvariablen
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

// Passwort-Hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

// Passwort-Verifizierung
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// JWT-Token generieren
export function generateToken(payload: { userId: string; email: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

// JWT-Token verifizieren
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Benutzer aus Token extrahieren
export async function getUserFromToken(token: string) {
  try {
    const decoded = verifyToken(token) as any
    if (!decoded?.userId) return null

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    })

    return user
  } catch (error) {
    return null
  }
}

// Session erstellen
export async function createSession(userId: string, token: string): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 Tage

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  })
}

// Session löschen
export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { token },
  })
}

// Session validieren
export async function validateSession(token: string): Promise<boolean> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!session || !session.user.isActive) return false
  if (session.expiresAt < new Date()) {
    await deleteSession(token)
    return false
  }

  return true
}
