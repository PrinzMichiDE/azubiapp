/**
 * Enhanced Rate Limiting Middleware
 * Erweiterte Rate-Limiting-Middleware
 */
import { NextRequest } from 'next/server'

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
  limit: number
}

interface RateLimitConfig {
  windowMs: number // Zeit-Fenster in Millisekunden
  maxRequests: number // Maximale Anzahl Requests
  keyGenerator?: (request: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

/**
 * In-Memory Rate Limiter für Development
 * In-Memory Rate Limiter for development
 * 
 * Features:
 * - Sliding Window Rate Limiting
 * - IP-basierte und Benutzer-basierte Limits
 * - Verschiedene Limit-Konfigurationen
 * - Request-Tracking und Analytics
 */
class InMemoryRateLimiter {
  private requests: Map<string, number[]> = new Map()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
    
    // Cleanup alle 5 Minuten
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  async checkLimit(key: string): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    
    // Aktuelle Requests für den Key abrufen
    let requests = this.requests.get(key) || []
    
    // Alte Requests außerhalb des Fensters entfernen
    requests = requests.filter(timestamp => timestamp > windowStart)
    
    const currentCount = requests.length
    const allowed = currentCount < this.config.maxRequests
    
    if (allowed) {
      // Neuen Request hinzufügen
      requests.push(now)
      this.requests.set(key, requests)
    }
    
    const resetTime = new Date(Math.max(...requests) + this.config.windowMs)
    
    return {
      allowed,
      remaining: Math.max(0, this.config.maxRequests - currentCount - (allowed ? 1 : 0)),
      resetTime,
      limit: this.config.maxRequests
    }
  }

  private cleanup() {
    const cutoff = Date.now() - this.config.windowMs
    
    for (const [key, requests] of this.requests.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > cutoff)
      
      if (validRequests.length === 0) {
        this.requests.delete(key)
      } else {
        this.requests.set(key, validRequests)
      }
    }
  }

  getStats() {
    return {
      totalKeys: this.requests.size,
      totalRequests: Array.from(this.requests.values()).reduce(
        (sum, requests) => sum + requests.length, 
        0
      )
    }
  }
}

/**
 * Vordefinierte Rate-Limit-Konfigurationen
 * Predefined rate limit configurations
 */
export const rateLimitConfigs = {
  // Allgemeine API-Limits
  general: {
    windowMs: 15 * 60 * 1000, // 15 Minuten
    maxRequests: 100
  },
  
  // Strenge Limits für kritische Endpunkte
  strict: {
    windowMs: 15 * 60 * 1000, // 15 Minuten
    maxRequests: 10
  },
  
  // Auth-spezifische Limits
  auth: {
    windowMs: 15 * 60 * 1000, // 15 Minuten
    maxRequests: 5 // Nur 5 Login-Versuche pro 15 Minuten
  },
  
  // Upload-Limits
  upload: {
    windowMs: 60 * 60 * 1000, // 1 Stunde
    maxRequests: 20
  },
  
  // Admin-Operationen
  admin: {
    windowMs: 5 * 60 * 1000, // 5 Minuten
    maxRequests: 50
  },
  
  // Generous limits für bekannte Services
  generous: {
    windowMs: 15 * 60 * 1000, // 15 Minuten
    maxRequests: 1000
  }
}

// Limiter-Instanzen für verschiedene Kategorien
const limiters = {
  general: new InMemoryRateLimiter(rateLimitConfigs.general),
  strict: new InMemoryRateLimiter(rateLimitConfigs.strict),
  auth: new InMemoryRateLimiter(rateLimitConfigs.auth),
  upload: new InMemoryRateLimiter(rateLimitConfigs.upload),
  admin: new InMemoryRateLimiter(rateLimitConfigs.admin),
  generous: new InMemoryRateLimiter(rateLimitConfigs.generous)
}

/**
 * Standard-Key-Generator basierend auf IP
 * Default key generator based on IP
 */
function getClientKey(request: NextRequest): string {
  // Client-IP ermitteln
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  const clientIP = forwarded?.split(',')[0] || realIP || cfConnectingIP || 'unknown'
  
  return `ip:${clientIP}`
}

/**
 * Benutzer-basierter Key-Generator
 * User-based key generator
 */
function getUserKey(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }
  return getClientKey(request)
}

/**
 * Kombinierter Key-Generator (IP + User)
 * Combined key generator (IP + User)
 */
function getCombinedKey(request: NextRequest, userId?: string): string {
  const ipKey = getClientKey(request)
  if (userId) {
    return `${ipKey}:user:${userId}`
  }
  return ipKey
}

/**
 * Hauptfunktion für Rate-Limiting
 * Main rate limiting function
 */
export async function rateLimit(
  request: NextRequest,
  type: keyof typeof limiters = 'general',
  userId?: string
): Promise<RateLimitResult> {
  try {
    const limiter = limiters[type]
    
    if (!limiter) {
      throw new Error(`Unknown rate limiter type: ${type}`)
    }

    // Key-Generierung basierend auf Typ
    let key: string
    
    switch (type) {
      case 'auth':
        // Für Auth: IP-basiert (um Brute-Force zu verhindern)
        key = getClientKey(request)
        break
      case 'admin':
        // Für Admin: Benutzer-basiert (falls verfügbar), sonst IP
        key = getUserKey(request, userId)
        break
      default:
        // Für andere: Kombiniert
        key = getCombinedKey(request, userId)
    }

    const result = await limiter.checkLimit(key)
    
    // Logging für Monitoring
    if (!result.allowed) {
      console.warn(`Rate limit exceeded for ${key} on ${type} endpoint:`, {
        endpoint: request.nextUrl.pathname,
        method: request.method,
        userAgent: request.headers.get('user-agent'),
        remaining: result.remaining,
        resetTime: result.resetTime
      })
    }

    return result
  } catch (error) {
    console.error('Rate limiting error:', error)
    
    // Bei Fehlern erlauben (fail-open)
    return {
      allowed: true,
      remaining: 999,
      resetTime: new Date(Date.now() + 15 * 60 * 1000),
      limit: 1000
    }
  }
}

/**
 * Spezielle Rate-Limit-Funktionen für verschiedene Use Cases
 * Special rate limit functions for different use cases
 */

// Auth-spezifisches Rate-Limiting
export async function rateLimitAuth(request: NextRequest): Promise<RateLimitResult> {
  return rateLimit(request, 'auth')
}

// Upload-spezifisches Rate-Limiting
export async function rateLimitUpload(request: NextRequest, userId?: string): Promise<RateLimitResult> {
  return rateLimit(request, 'upload', userId)
}

// Admin-spezifisches Rate-Limiting
export async function rateLimitAdmin(request: NextRequest, userId?: string): Promise<RateLimitResult> {
  return rateLimit(request, 'admin', userId)
}

// Strenge Limits für kritische Operationen
export async function rateLimitStrict(request: NextRequest, userId?: string): Promise<RateLimitResult> {
  return rateLimit(request, 'strict', userId)
}

/**
 * Rate-Limit-Header für Response
 * Rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
    'Retry-After': !result.allowed 
      ? Math.ceil((result.resetTime.getTime() - Date.now()) / 1000).toString()
      : '0'
  }
}

/**
 * Middleware-Funktion für Next.js API Routes
 * Middleware function for Next.js API routes
 */
export function withRateLimit(
  type: keyof typeof limiters = 'general'
) {
  return async function rateLimitMiddleware(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<Response>
  ): Promise<Response> {
    const result = await rateLimit(request, type)
    
    if (!result.allowed) {
      const headers = getRateLimitHeaders(result)
      
      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: headers['Retry-After']
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        }
      )
    }

    // Handler ausführen und Rate-Limit-Header hinzufügen
    const response = await handler(request)
    const headers = getRateLimitHeaders(result)
    
    // Headers zur Response hinzufügen
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  }
}

/**
 * Rate-Limiter-Statistiken abrufen
 * Get rate limiter statistics
 */
export function getRateLimiterStats() {
  const stats: Record<string, any> = {}
  
  Object.entries(limiters).forEach(([type, limiter]) => {
    stats[type] = limiter.getStats()
  })
  
  return stats
}

/**
 * Whitelist für vertrauenswürdige IPs/Services
 * Whitelist for trusted IPs/services
 */
const trustedIPs = new Set([
  '127.0.0.1',
  '::1',
  // Weitere vertrauenswürdige IPs hier hinzufügen
])

/**
 * Prüfen ob Request von vertrauenswürdiger Quelle kommt
 * Check if request comes from trusted source
 */
export function isTrustedSource(request: NextRequest): boolean {
  const clientIP = getClientKey(request).replace('ip:', '')
  return trustedIPs.has(clientIP)
}

/**
 * Rate-Limiting mit Whitelist
 * Rate limiting with whitelist
 */
export async function rateLimitWithWhitelist(
  request: NextRequest,
  type: keyof typeof limiters = 'general',
  userId?: string
): Promise<RateLimitResult> {
  // Vertrauenswürdige Quellen umgehen Rate-Limiting
  if (isTrustedSource(request)) {
    return {
      allowed: true,
      remaining: 999,
      resetTime: new Date(Date.now() + 15 * 60 * 1000),
      limit: 1000
    }
  }

  return rateLimit(request, type, userId)
}
