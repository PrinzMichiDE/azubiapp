/**
 * Base Service-Klasse für Business Logic
 * Base Service class for business logic
 */
import { PrismaClient } from '@prisma/client'

/**
 * Zentrale Error-Klassen für strukturierte Fehlerbehandlung
 * Central Error classes for structured error handling
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Nicht authentifiziert') {
    super(401, message)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Keine Berechtigung') {
    super(403, message)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Ressource') {
    super(404, `${resource} nicht gefunden`)
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message)
  }
}

/**
 * Standardisierte API-Response-Interfaces
 * Standardized API response interfaces
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    timestamp: string
  }
}

export interface PaginationOptions {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Response-Helper für konsistente API-Antworten
 * Response helpers for consistent API responses
 */
export function successResponse<T>(data: T, meta?: any): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString()
    }
  }
}

export function errorResponse(code: string, message: string, details?: any): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Base Service-Klasse mit gemeinsamen Funktionen
 * Base Service class with common functionality
 */
export abstract class BaseService {
  protected prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Erstellt Pagination-Parameter für Prisma
   * Creates pagination parameters for Prisma
   */
  protected createPaginationParams(options: PaginationOptions) {
    const page = Math.max(1, options.page || 1)
    const limit = Math.min(100, Math.max(1, options.limit || 20))
    const skip = (page - 1) * limit

    return {
      skip,
      take: limit,
      page,
      limit
    }
  }

  /**
   * Erstellt Sortierung-Parameter für Prisma
   * Creates sorting parameters for Prisma
   */
  protected createSortParams(sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') {
    if (!sortBy) return { createdAt: 'desc' as const }
    
    return {
      [sortBy]: sortOrder
    }
  }

  /**
   * Erstellt Pagination-Metadaten
   * Creates pagination metadata
   */
  protected createPaginationMeta(total: number, page: number, limit: number) {
    return {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }

  /**
   * Behandelt Service-Errors und wandelt sie in AppErrors um
   * Handles service errors and converts them to AppErrors
   */
  protected handleError(error: unknown, context: string): never {
    console.error(`Error in ${context}:`, error)

    if (error instanceof AppError) {
      throw error
    }

    if (error instanceof Error) {
      // Prisma-spezifische Fehler behandeln
      if (error.message.includes('Unique constraint')) {
        throw new ConflictError('Datensatz bereits vorhanden')
      }
      
      if (error.message.includes('Foreign key constraint')) {
        throw new ValidationError('Referenz-Fehler: Verknüpfte Daten nicht gefunden')
      }
      
      if (error.message.includes('Record to update not found')) {
        throw new NotFoundError('Datensatz')
      }
    }

    // Unbekannte Fehler als interne Server-Fehler behandeln
    throw new AppError(500, `Interner Fehler in ${context}`)
  }

  /**
   * Validiert Benutzer-Berechtigung
   * Validates user permissions
   */
  protected validateUserAccess(
    userId: string, 
    targetUserId: string, 
    requiredRole?: string,
    userRole?: string
  ): void {
    // Benutzer kann seine eigenen Daten bearbeiten
    if (userId === targetUserId) return

    // Admin-Berechtigung prüfen
    if (requiredRole && userRole !== 'ADMIN' && userRole !== requiredRole) {
      throw new AuthorizationError('Insufficient permissions for this operation')
    }
  }

  /**
   * Validiert Eingabedaten
   * Validates input data
   */
  protected validateInput(data: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new ValidationError(`Feld '${field}' ist erforderlich`)
      }
    }
  }

  /**
   * Bereitet Daten für die Ausgabe vor (entfernt sensible Felder)
   * Prepares data for output (removes sensitive fields)
   */
  protected sanitizeOutput<T extends Record<string, any>>(
    data: T, 
    excludeFields: string[] = ['password', 'passwordHash']
  ): Omit<T, typeof excludeFields[number]> {
    const sanitized = { ...data }
    
    for (const field of excludeFields) {
      delete sanitized[field]
    }
    
    return sanitized
  }
}
