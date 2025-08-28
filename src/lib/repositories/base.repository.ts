/**
 * Base Repository Pattern für Datenbankzugriff
 * Base Repository Pattern for database access
 */
import { PrismaClient } from '@prisma/client'

/**
 * Abstract Base Repository mit gemeinsamen CRUD-Operationen
 * Abstract Base Repository with common CRUD operations
 * 
 * Features:
 * - Generische CRUD-Operationen
 * - Type-Safe Datenbankzugriff
 * - Konsistente Error-Handling
 * - Optimierte Queries
 */
export abstract class BaseRepository<T> {
  protected prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Abstraktes Property für Model-Namen
   * Abstract property for model name
   */
  protected abstract getModelName(): string

  /**
   * Abrufen aller Datensätze mit optionalen Filtern
   * Get all records with optional filters
   */
  async findMany(options: {
    where?: any
    include?: any
    select?: any
    orderBy?: any
    skip?: number
    take?: number
  } = {}): Promise<T[]> {
    const model = this.getModel()
    return model.findMany(options)
  }

  /**
   * Abrufen eines Datensatzes anhand der ID
   * Get a record by ID
   */
  async findById(id: string, include?: any): Promise<T | null> {
    const model = this.getModel()
    return model.findUnique({
      where: { id },
      include
    })
  }

  /**
   * Abrufen eines Datensatzes anhand eindeutiger Felder
   * Get a record by unique fields
   */
  async findUnique(where: any, include?: any): Promise<T | null> {
    const model = this.getModel()
    return model.findUnique({
      where,
      include
    })
  }

  /**
   * Abrufen des ersten Datensatzes mit Filtern
   * Get the first record with filters
   */
  async findFirst(where: any, include?: any): Promise<T | null> {
    const model = this.getModel()
    return model.findFirst({
      where,
      include
    })
  }

  /**
   * Erstellen eines neuen Datensatzes
   * Create a new record
   */
  async create(data: any, include?: any): Promise<T> {
    const model = this.getModel()
    return model.create({
      data,
      include
    })
  }

  /**
   * Aktualisieren eines Datensatzes
   * Update a record
   */
  async update(id: string, data: any, include?: any): Promise<T> {
    const model = this.getModel()
    return model.update({
      where: { id },
      data,
      include
    })
  }

  /**
   * Upsert-Operation (Update oder Insert)
   * Upsert operation (Update or Insert)
   */
  async upsert(where: any, create: any, update: any, include?: any): Promise<T> {
    const model = this.getModel()
    return model.upsert({
      where,
      create,
      update,
      include
    })
  }

  /**
   * Löschen eines Datensatzes
   * Delete a record
   */
  async delete(id: string): Promise<T> {
    const model = this.getModel()
    return model.delete({
      where: { id }
    })
  }

  /**
   * Löschen mehrerer Datensätze
   * Delete multiple records
   */
  async deleteMany(where: any): Promise<{ count: number }> {
    const model = this.getModel()
    return model.deleteMany({ where })
  }

  /**
   * Zählen von Datensätzen
   * Count records
   */
  async count(where?: any): Promise<number> {
    const model = this.getModel()
    return model.count({ where })
  }

  /**
   * Prüfen ob Datensatz existiert
   * Check if record exists
   */
  async exists(where: any): Promise<boolean> {
    const count = await this.count(where)
    return count > 0
  }

  /**
   * Batch-Update für mehrere Datensätze
   * Batch update for multiple records
   */
  async updateMany(where: any, data: any): Promise<{ count: number }> {
    const model = this.getModel()
    return model.updateMany({
      where,
      data
    })
  }

  /**
   * Aggregationen durchführen
   * Perform aggregations
   */
  async aggregate(options: any) {
    const model = this.getModel()
    return model.aggregate(options)
  }

  /**
   * Gruppierung mit Aggregationen
   * Grouping with aggregations
   */
  async groupBy(options: any) {
    const model = this.getModel()
    return model.groupBy(options)
  }

  /**
   * Transaktionale Operationen
   * Transactional operations
   */
  async transaction<R>(fn: (prisma: PrismaClient) => Promise<R>): Promise<R> {
    return this.prisma.$transaction(fn)
  }

  /**
   * Raw Query ausführen
   * Execute raw query
   */
  async raw(query: string, values?: any[]): Promise<any> {
    return this.prisma.$queryRaw`${query}`
  }

  /**
   * Pagination-Helper
   * Pagination helper
   */
  async findManyWithPagination(options: {
    where?: any
    include?: any
    select?: any
    orderBy?: any
    page?: number
    limit?: number
  }) {
    const page = Math.max(1, options.page || 1)
    const limit = Math.min(100, Math.max(1, options.limit || 20))
    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.findMany({
        ...options,
        skip,
        take: limit
      }),
      this.count(options.where)
    ])

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    }
  }

  /**
   * Soft Delete (wenn unterstützt)
   * Soft Delete (if supported)
   */
  async softDelete(id: string): Promise<T> {
    const model = this.getModel()
    return model.update({
      where: { id },
      data: { deletedAt: new Date() }
    })
  }

  /**
   * Soft Delete rückgängig machen
   * Restore soft deleted record
   */
  async restore(id: string): Promise<T> {
    const model = this.getModel()
    return model.update({
      where: { id },
      data: { deletedAt: null }
    })
  }

  /**
   * Abrufen des Prisma-Models
   * Get the Prisma model
   */
  protected getModel() {
    const modelName = this.getModelName()
    const model = (this.prisma as any)[modelName]
    
    if (!model) {
      throw new Error(`Model '${modelName}' not found in Prisma client`)
    }
    
    return model
  }

  /**
   * Query-Performance-Optimierung
   * Query performance optimization
   */
  protected optimizeIncludes(include: any): any {
    // Implementierung für Query-Optimierung basierend auf Includes
    // Implementation for query optimization based on includes
    return include
  }

  /**
   * Validierung vor Datenbankoperationen
   * Validation before database operations
   */
  protected validateData(data: any, operation: 'create' | 'update'): void {
    // Implementierung spezifischer Validierungen
    // Implementation of specific validations
    if (!data) {
      throw new Error('Data is required')
    }
  }

  /**
   * Audit-Log für Änderungen
   * Audit log for changes
   */
  protected async logChange(
    operation: string,
    recordId: string,
    oldData?: any,
    newData?: any,
    userId?: string
  ): Promise<void> {
    // Implementierung für Audit-Logging
    // Implementation for audit logging
    try {
      await this.prisma.auditLog.create({
        data: {
          operation,
          tableName: this.getModelName(),
          recordId,
          oldData: oldData ? JSON.stringify(oldData) : null,
          newData: newData ? JSON.stringify(newData) : null,
          userId,
          timestamp: new Date()
        }
      })
    } catch (error) {
      // Audit-Fehler nicht weiterwerfen, nur loggen
      console.error('Audit log error:', error)
    }
  }
}
