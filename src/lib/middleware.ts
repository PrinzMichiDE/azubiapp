import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from './auth'

// Geschützte Routen
const protectedRoutes = [
  '/api/projects',
  '/api/tasks',
  '/api/time-entries',
  '/api/users',
]

// Admin-Routen
const adminRoutes = [
  '/api/admin',
  '/api/users',
]

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Prüfen, ob es sich um eine geschützte Route handelt
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  
  if (!isProtectedRoute) {
    return NextResponse.next()
  }
  
  // Authorization-Header extrahieren
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  
  if (!token) {
    return NextResponse.json(
      { error: 'Zugriff verweigert - Token erforderlich' },
      { status: 401 }
    )
  }
  
  // Token validieren und Benutzer extrahieren
  const user = await getUserFromToken(token)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Zugriff verweigert - Ungültiger Token' },
      { status: 401 }
    )
  }
  
  // Prüfen, ob Benutzer aktiv ist
  if (!user.isActive) {
    return NextResponse.json(
      { error: 'Zugriff verweigert - Benutzer ist deaktiviert' },
      { status: 403 }
    )
  }
  
  // Admin-Berechtigung prüfen
  if (isAdminRoute && user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Zugriff verweigert - Admin-Berechtigung erforderlich' },
      { status: 403 }
    )
  }
  
  // Benutzerdaten zum Request hinzufügen
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', user.id)
  requestHeaders.set('x-user-role', user.role)
  requestHeaders.set('x-user-email', user.email)
  
  // Request mit Benutzerdaten weiterleiten
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}
