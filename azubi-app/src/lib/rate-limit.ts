import { NextRequest, NextResponse } from 'next/server'

// In-Memory Store für Rate Limiting (in Produktion sollte Redis verwendet werden)
class RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map()

  get(key: string): { count: number; resetTime: number } | undefined {
    const entry = this.store.get(key)
    
    // Eintrag löschen, wenn abgelaufen
    if (entry && Date.now() > entry.resetTime) {
      this.store.delete(key)
      return undefined
    }
    
    return entry
  }

  set(key: string, count: number, windowMs: number): void {
    this.store.set(key, {
      count,
      resetTime: Date.now() + windowMs
    })
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const existing = this.get(key)
    
    if (existing) {
      existing.count++
      this.store.set(key, existing)
      return existing
    } else {
      const newEntry = {
        count: 1,
        resetTime: Date.now() + windowMs
      }
      this.store.set(key, newEntry)
      return newEntry
    }
  }

  // Cleanup-Methode um abgelaufene Einträge zu entfernen
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

const store = new RateLimitStore()

// Cleanup alle 5 Minuten
setInterval(() => {
  store.cleanup()
}, 5 * 60 * 1000)

interface RateLimitOptions {
  windowMs: number // Zeitfenster in Millisekunden
  max: number      // Maximale Anzahl Requests
  keyGenerator?: (request: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  message?: string
}

export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    max,
    keyGenerator = (req) => getClientIp(req),
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = 'Zu viele Anfragen. Versuchen Sie es später erneut.'
  } = options

  return async function rateLimitMiddleware(
    request: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const key = keyGenerator(request)
    const current = store.get(key)

    // Prüfen, ob Limit erreicht
    if (current && current.count >= max) {
      const resetTime = new Date(current.resetTime)
      
      return NextResponse.json(
        { 
          error: message,
          retryAfter: Math.ceil((current.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetTime.toISOString(),
            'Retry-After': Math.ceil((current.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    // Request verarbeiten
    const response = await next()

    // Counter nur erhöhen, wenn nicht übersprungen werden soll
    const shouldSkip = 
      (skipSuccessfulRequests && response.status < 400) ||
      (skipFailedRequests && response.status >= 400)

    if (!shouldSkip) {
      const updated = store.increment(key, windowMs)
      
      // Rate-Limit-Header hinzufügen
      response.headers.set('X-RateLimit-Limit', max.toString())
      response.headers.set('X-RateLimit-Remaining', Math.max(0, max - updated.count).toString())
      response.headers.set('X-RateLimit-Reset', new Date(updated.resetTime).toISOString())
    }

    return response
  }
}

// Standard Rate Limits
export const globalRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 1000, // 1000 Requests pro IP
  message: 'Zu viele Anfragen von dieser IP. Versuchen Sie es in 15 Minuten erneut.'
})

export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 10, // 10 Login-Versuche pro IP
  message: 'Zu viele Login-Versuche. Versuchen Sie es in 15 Minuten erneut.',
  keyGenerator: (req) => `auth:${getClientIp(req)}`
})

export const apiRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 500, // 500 API-Requests pro Benutzer
  keyGenerator: (req) => {
    const userId = req.headers.get('x-user-id')
    return userId ? `api:${userId}` : `api:${getClientIp(req)}`
  },
  message: 'API-Rate-Limit erreicht. Versuchen Sie es in 15 Minuten erneut.'
})

export const uploadRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 Stunde
  max: 50, // 50 Uploads pro Stunde pro Benutzer
  keyGenerator: (req) => {
    const userId = req.headers.get('x-user-id')
    return userId ? `upload:${userId}` : `upload:${getClientIp(req)}`
  },
  message: 'Upload-Limit erreicht. Versuchen Sie es in einer Stunde erneut.'
})

// Hilfsfunktion zum Extrahieren der Client-IP
function getClientIp(request: NextRequest): string {
  // Verschiedene Header prüfen (je nach Proxy-Setup)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  const clientIp = request.headers.get('x-client-ip')
  if (clientIp) {
    return clientIp
  }

  // Fallback zu einer Standard-IP
  return '127.0.0.1'
}

// Rate-Limit-Wrapper für API-Routen
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  rateLimit: (request: NextRequest, next: () => Promise<NextResponse>) => Promise<NextResponse>
) {
  return async function rateLimitedHandler(request: NextRequest): Promise<NextResponse> {
    return rateLimit(request, () => handler(request))
  }
}
