import { PrismaClient } from '@prisma/client'

// Globale Prisma-Instanz für Entwicklung
declare global {
  var __prisma: PrismaClient | undefined
}

// Prisma-Client-Instanz
export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// In Entwicklung die Instanz global speichern
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

// Datenbankverbindung schließen
export async function disconnect() {
  await prisma.$disconnect()
}

// Datenbankverbindung testen
export async function testConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Datenbankverbindung erfolgreich')
    return true
  } catch (error) {
    console.error('❌ Datenbankverbindung fehlgeschlagen:', error)
    return false
  }
}
