/**
 * Enhanced Authentication Middleware
 * Erweiterte Authentifizierungs-Middleware
 */
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { rateLimit } from './rate-limit.middleware'

const prisma = new PrismaClient()

export interface AuthenticatedUser {
  id: string
  email: string
  username: string
  role: string
  isActive: boolean
  permissions: string[]
}

export interface AuthRequest extends NextRequest {
  user?: AuthenticatedUser
}

/**
 * Erweiterte Authentifizierungs-Middleware mit zusätzlichen Features
 * Enhanced Authentication Middleware with additional features
 * 
 * Features:
 * - JWT-Token-Validierung
 * - Benutzer-Berechtigung prüfen
 * - Session-Management
 * - Rate-Limiting-Integration
 * - Audit-Logging
 */
export class EnhancedAuthMiddleware {
  private static instance: EnhancedAuthMiddleware
  private jwtSecret: string

  private constructor() {
    this.jwtSecret = process.env.JWT_SECRET!
    if (!this.jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required')
    }
  }

  public static getInstance(): EnhancedAuthMiddleware {
    if (!EnhancedAuthMiddleware.instance) {
      EnhancedAuthMiddleware.instance = new EnhancedAuthMiddleware()
    }
    return EnhancedAuthMiddleware.instance
  }

  /**
   * Hauptauthentifizierungsmethode
   * Main authentication method
   */
  async authenticate(request: NextRequest): Promise<AuthenticatedUser | null> {
    try {
      // Rate-Limiting prüfen
      const rateLimitResult = await rateLimit(request)
      if (!rateLimitResult.allowed) {
        throw new Error('Rate limit exceeded')
      }

      // Token extrahieren
      const token = this.extractToken(request)
      if (!token) {
        return null
      }

      // Token validieren
      const decoded = this.verifyToken(token)
      if (!decoded || typeof decoded === 'string') {
        return null
      }

      // Benutzer aus Datenbank laden
      const user = await this.loadUser(decoded.userId)
      if (!user || !user.isActive) {
        return null
      }

      // Session aktualisieren
      await this.updateSession(user.id, request)

      // Berechtigungen laden
      const permissions = await this.loadUserPermissions(user.role)

      return {
        ...user,
        permissions
      }
    } catch (error) {
      console.error('Authentication error:', error)
      return null
    }
  }

  /**
   * Rollbasierte Authentifizierung
   * Role-based authentication
   */
  async authenticateWithRole(
    request: NextRequest, 
    requiredRoles: string[]
  ): Promise<AuthenticatedUser | null> {
    const user = await this.authenticate(request)
    
    if (!user) {
      return null
    }

    if (!requiredRoles.includes(user.role)) {
      await this.logUnauthorizedAccess(user, request, requiredRoles)
      return null
    }

    return user
  }

  /**
   * Berechtigungsbasierte Authentifizierung
   * Permission-based authentication
   */
  async authenticateWithPermission(
    request: NextRequest,
    requiredPermissions: string[]
  ): Promise<AuthenticatedUser | null> {
    const user = await this.authenticate(request)
    
    if (!user) {
      return null
    }

    const hasPermission = requiredPermissions.some(permission => 
      user.permissions.includes(permission)
    )

    if (!hasPermission) {
      await this.logUnauthorizedAccess(user, request, [], requiredPermissions)
      return null
    }

    return user
  }

  /**
   * Admin-spezifische Authentifizierung
   * Admin-specific authentication
   */
  async authenticateAdmin(request: NextRequest): Promise<AuthenticatedUser | null> {
    return this.authenticateWithRole(request, ['ADMIN'])
  }

  /**
   * Manager-spezifische Authentifizierung
   * Manager-specific authentication
   */
  async authenticateManager(request: NextRequest): Promise<AuthenticatedUser | null> {
    return this.authenticateWithRole(request, ['ADMIN', 'MANAGER'])
  }

  /**
   * Token aus Request extrahieren
   * Extract token from request
   */
  private extractToken(request: NextRequest): string | null {
    // Authorization Header prüfen
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }

    // Cookie prüfen
    const cookieToken = request.cookies.get('auth-token')?.value
    if (cookieToken) {
      return cookieToken
    }

    return null
  }

  /**
   * JWT-Token validieren
   * Validate JWT token
   */
  private verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret)
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        console.log('Token expired')
      } else if (error instanceof jwt.JsonWebTokenError) {
        console.log('Invalid token')
      }
      return null
    }
  }

  /**
   * Benutzer aus Datenbank laden
   * Load user from database
   */
  private async loadUser(userId: string) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isActive: true,
          lastLoginAt: true
        }
      })
    } catch (error) {
      console.error('Error loading user:', error)
      return null
    }
  }

  /**
   * Benutzerberechtigungen laden
   * Load user permissions
   */
  private async loadUserPermissions(role: string): Promise<string[]> {
    const rolePermissions: Record<string, string[]> = {
      ADMIN: [
        'user:read', 'user:write', 'user:delete',
        'project:read', 'project:write', 'project:delete',
        'task:read', 'task:write', 'task:delete',
        'admin:read', 'admin:write',
        'system:read', 'system:write'
      ],
      MANAGER: [
        'user:read', 'user:write',
        'project:read', 'project:write',
        'task:read', 'task:write',
        'team:read', 'team:write'
      ],
      USER: [
        'project:read',
        'task:read', 'task:write',
        'profile:read', 'profile:write'
      ],
      TRAINEE: [
        'project:read',
        'task:read',
        'profile:read', 'profile:write',
        'learning:read'
      ]
    }

    return rolePermissions[role] || []
  }

  /**
   * Session aktualisieren
   * Update session
   */
  private async updateSession(userId: string, request: NextRequest) {
    try {
      const clientIP = this.getClientIP(request)
      const userAgent = request.headers.get('user-agent') || 'Unknown'

      await prisma.session.upsert({
        where: { userId },
        update: {
          lastActiveAt: new Date(),
          ipAddress: clientIP,
          userAgent
        },
        create: {
          userId,
          ipAddress: clientIP,
          userAgent,
          createdAt: new Date(),
          lastActiveAt: new Date()
        }
      })

      // Last Login aktualisieren
      await prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() }
      })
    } catch (error) {
      console.error('Error updating session:', error)
    }
  }

  /**
   * Unautorisierten Zugriff protokollieren
   * Log unauthorized access
   */
  private async logUnauthorizedAccess(
    user: AuthenticatedUser,
    request: NextRequest,
    requiredRoles: string[] = [],
    requiredPermissions: string[] = []
  ) {
    try {
      const clientIP = this.getClientIP(request)
      const endpoint = request.nextUrl.pathname
      const method = request.method

      await prisma.securityLog.create({
        data: {
          userId: user.id,
          action: 'UNAUTHORIZED_ACCESS',
          endpoint,
          method,
          ipAddress: clientIP,
          userAgent: request.headers.get('user-agent') || 'Unknown',
          details: JSON.stringify({
            userRole: user.role,
            userPermissions: user.permissions,
            requiredRoles,
            requiredPermissions
          }),
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Error logging unauthorized access:', error)
    }
  }

  /**
   * Client-IP ermitteln
   * Get client IP
   */
  private getClientIP(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    )
  }

  /**
   * Token erneuern
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<string | null> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtSecret) as any
      
      const user = await this.loadUser(decoded.userId)
      if (!user || !user.isActive) {
        return null
      }

      // Neuen Access-Token generieren
      const newToken = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        this.jwtSecret,
        { expiresIn: '1h' }
      )

      return newToken
    } catch (error) {
      console.error('Error refreshing token:', error)
      return null
    }
  }

  /**
   * Token widerrufen (Logout)
   * Revoke token (Logout)
   */
  async revokeToken(userId: string): Promise<void> {
    try {
      // Session löschen
      await prisma.session.deleteMany({
        where: { userId }
      })

      // Logout protokollieren
      await prisma.securityLog.create({
        data: {
          userId,
          action: 'LOGOUT',
          timestamp: new Date()
        }
      })
    } catch (error) {
      console.error('Error revoking token:', error)
    }
  }

  /**
   * Verdächtige Aktivitäten erkennen
   * Detect suspicious activities
   */
  async detectSuspiciousActivity(
    userId: string,
    request: NextRequest
  ): Promise<boolean> {
    try {
      const clientIP = this.getClientIP(request)
      const currentTime = new Date()
      const oneHourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000)

      // Prüfe auf ungewöhnliche Login-Muster
      const recentLogins = await prisma.securityLog.count({
        where: {
          userId,
          action: 'LOGIN',
          timestamp: { gte: oneHourAgo },
          ipAddress: { not: clientIP }
        }
      })

      // Zu viele Logins von verschiedenen IPs
      if (recentLogins > 3) {
        await this.flagSuspiciousActivity(userId, 'MULTIPLE_IP_LOGINS', {
          recentLogins,
          currentIP: clientIP
        })
        return true
      }

      return false
    } catch (error) {
      console.error('Error detecting suspicious activity:', error)
      return false
    }
  }

  /**
   * Verdächtige Aktivität markieren
   * Flag suspicious activity
   */
  private async flagSuspiciousActivity(
    userId: string,
    type: string,
    details: any
  ) {
    try {
      await prisma.securityAlert.create({
        data: {
          userId,
          type,
          details: JSON.stringify(details),
          status: 'PENDING',
          createdAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error flagging suspicious activity:', error)
    }
  }
}

/**
 * Convenience-Funktionen für API-Routes
 * Convenience functions for API routes
 */
export const authMiddleware = EnhancedAuthMiddleware.getInstance()

export async function withAuth(
  request: NextRequest,
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>
): Promise<Response> {
  const user = await authMiddleware.authenticate(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return handler(request, user)
}

export async function withRole(
  request: NextRequest,
  requiredRoles: string[],
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>
): Promise<Response> {
  const user = await authMiddleware.authenticateWithRole(request, requiredRoles)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }

  return handler(request, user)
}

export async function withPermission(
  request: NextRequest,
  requiredPermissions: string[],
  handler: (request: NextRequest, user: AuthenticatedUser) => Promise<Response>
): Promise<Response> {
  const user = await authMiddleware.authenticateWithPermission(request, requiredPermissions)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  return handler(request, user)
}
