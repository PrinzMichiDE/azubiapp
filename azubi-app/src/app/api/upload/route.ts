import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { prisma } from '@/lib/db'

// Erlaubte Dateitypen
const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ],
  archives: [
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ]
}

const ALL_ALLOWED_TYPES = [
  ...ALLOWED_FILE_TYPES.images,
  ...ALLOWED_FILE_TYPES.documents,
  ...ALLOWED_FILE_TYPES.archives
]

// Maximale Dateigröße (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Datei-Upload
export async function POST(request: NextRequest) {
  try {
    // Benutzer-ID aus Header extrahieren
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }

    // FormData extrahieren
    const formData = await request.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    const taskId = formData.get('taskId') as string
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json(
        { error: 'Keine Datei hochgeladen' },
        { status: 400 }
      )
    }

    // Dateigröße prüfen
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Datei ist zu groß. Maximale Größe: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Dateityp prüfen
    if (!ALL_ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Dateityp nicht erlaubt' },
        { status: 400 }
      )
    }

    // Berechtigung prüfen
    if (projectId) {
      const membership = await prisma.projectMember.findFirst({
        where: {
          projectId: projectId,
          userId: userId
        }
      })

      const userRole = request.headers.get('x-user-role')
      if (!membership && userRole !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Keine Berechtigung zum Hochladen in dieses Projekt' },
          { status: 403 }
        )
      }
    }

    // Eindeutigen Dateinamen generieren
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 8)
    const fileExtension = path.extname(file.name)
    const fileName = `${timestamp}_${randomString}${fileExtension}`

    // Upload-Verzeichnis erstellen
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    const userDir = path.join(uploadDir, userId)
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }
    
    if (!existsSync(userDir)) {
      await mkdir(userDir, { recursive: true })
    }

    // Datei speichern
    const filePath = path.join(userDir, fileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Datei-URL generieren
    const fileUrl = `/uploads/${userId}/${fileName}`

    // Datei-Metadaten in Datenbank speichern
    const fileRecord = await prisma.fileUpload.create({
      data: {
        fileName: file.name,
        filePath: fileUrl,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy: userId,
        projectId: projectId || undefined,
        taskId: taskId || undefined,
        description: description || undefined,
      },
      include: {
        uploadedByUser: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          }
        },
        project: {
          select: {
            id: true,
            name: true,
          }
        },
        task: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Datei erfolgreich hochgeladen',
      file: fileRecord
    }, { status: 201 })

  } catch (error) {
    console.error('Fehler beim Hochladen der Datei:', error)
    return NextResponse.json(
      { error: 'Fehler beim Hochladen der Datei' },
      { status: 500 }
    )
  }
}

// Hochgeladene Dateien abrufen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const taskId = searchParams.get('taskId')
    const fileType = searchParams.get('fileType')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Benutzer-ID aus Header extrahieren
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }

    // Filter erstellen
    const where: any = {}
    if (projectId) {
      // Prüfen, ob Benutzer Zugriff auf das Projekt hat
      const membership = await prisma.projectMember.findFirst({
        where: {
          projectId: projectId,
          userId: userId
        }
      })

      const userRole = request.headers.get('x-user-role')
      if (!membership && userRole !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Keine Berechtigung zum Anzeigen der Projektdateien' },
          { status: 403 }
        )
      }

      where.projectId = projectId
    } else {
      // Nur eigene Dateien anzeigen (falls kein Projekt angegeben)
      where.uploadedBy = userId
    }

    if (taskId) where.taskId = taskId
    if (fileType) {
      const types = ALLOWED_FILE_TYPES[fileType as keyof typeof ALLOWED_FILE_TYPES]
      if (types) {
        where.fileType = { in: types }
      }
    }

    // Dateien abrufen
    const [files, total] = await Promise.all([
      prisma.fileUpload.findMany({
        where,
        include: {
          uploadedByUser: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            }
          },
          project: {
            select: {
              id: true,
              name: true,
            }
          },
          task: {
            select: {
              id: true,
              title: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.fileUpload.count({ where })
    ])

    return NextResponse.json({
      files,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      }
    })

  } catch (error) {
    console.error('Fehler beim Abrufen der Dateien:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// Datei löschen
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')

    if (!fileId) {
      return NextResponse.json(
        { error: 'Datei-ID ist erforderlich' },
        { status: 400 }
      )
    }

    // Benutzer-ID aus Header extrahieren
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }

    // Datei-Metadaten abrufen
    const file = await prisma.fileUpload.findUnique({
      where: { id: fileId }
    })

    if (!file) {
      return NextResponse.json(
        { error: 'Datei nicht gefunden' },
        { status: 404 }
      )
    }

    // Berechtigung prüfen
    const userRole = request.headers.get('x-user-role')
    if (file.uploadedBy !== userId && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Keine Berechtigung zum Löschen dieser Datei' },
        { status: 403 }
      )
    }

    // Datei aus Dateisystem löschen
    try {
      const fs = require('fs').promises
      const filePath = path.join(process.cwd(), 'public', file.filePath)
      await fs.unlink(filePath)
    } catch (fsError) {
      console.warn('Datei konnte nicht aus dem Dateisystem gelöscht werden:', fsError)
      // Weiter mit Datenbank-Löschung, auch wenn Datei-Löschung fehlschlägt
    }

    // Datei-Metadaten aus Datenbank löschen
    await prisma.fileUpload.delete({
      where: { id: fileId }
    })

    return NextResponse.json({
      message: 'Datei erfolgreich gelöscht'
    })

  } catch (error) {
    console.error('Fehler beim Löschen der Datei:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
