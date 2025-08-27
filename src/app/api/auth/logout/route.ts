import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Authorization-Header extrahieren
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (token) {
      // Session löschen
      await deleteSession(token)
    }
    
    return NextResponse.json({
      message: 'Abmeldung erfolgreich'
    })
    
  } catch (error) {
    console.error('Logout-Fehler:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
