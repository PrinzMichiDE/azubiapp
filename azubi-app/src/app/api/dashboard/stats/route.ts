import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Dashboard-Statistiken abrufen
export async function GET(request: NextRequest) {
  try {
    // Benutzer-ID aus Header extrahieren
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return NextResponse.json(
        { error: 'Benutzer-ID nicht gefunden' },
        { status: 400 }
      )
    }

    const userRole = request.headers.get('x-user-role')
    
    // Zeiträume definieren
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Base-Query für Berechtigungen
    const projectFilter = userRole === 'ADMIN' ? {} : {
      members: {
        some: { userId: userId }
      }
    }

    // Parallel alle Statistiken abrufen
    const [
      // Projektstatistiken
      totalProjects,
      activeProjects,
      completedProjects,
      projectsOnHold,
      
      // Aufgabenstatistiken
      totalTasks,
      completedTasks,
      activeTasks,
      overdueTasks,
      
      // Zeiterfassungsstatistiken
      todayTimeEntries,
      weekTimeEntries,
      monthTimeEntries,
      
      // Benutzerstatistiken
      totalUsers,
      activeUsers,
      
      // Aktuelle Projekte mit Details
      recentProjects,
      
      // Aktuelle Aufgaben
      recentTasks,
      
      // Aktiver Timer
      activeTimer
    ] = await Promise.all([
      // Projektstatistiken
      prisma.project.count({ where: projectFilter }),
      prisma.project.count({ 
        where: { 
          ...projectFilter,
          status: 'ACTIVE' 
        }
      }),
      prisma.project.count({ 
        where: { 
          ...projectFilter,
          status: 'COMPLETED' 
        }
      }),
      prisma.project.count({ 
        where: { 
          ...projectFilter,
          status: 'ON_HOLD' 
        }
      }),
      
      // Aufgabenstatistiken
      prisma.task.count({
        where: {
          project: projectFilter
        }
      }),
      prisma.task.count({
        where: {
          project: projectFilter,
          status: 'DONE'
        }
      }),
      prisma.task.count({
        where: {
          project: projectFilter,
          status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] }
        }
      }),
      prisma.task.count({
        where: {
          project: projectFilter,
          dueDate: { lt: now },
          status: { not: 'DONE' }
        }
      }),
      
      // Zeiterfassungsstatistiken
      prisma.timeEntry.aggregate({
        where: {
          userId: userId,
          startTime: { gte: startOfDay }
        },
        _sum: { duration: true },
        _count: true
      }),
      prisma.timeEntry.aggregate({
        where: {
          userId: userId,
          startTime: { gte: startOfWeek }
        },
        _sum: { duration: true },
        _count: true
      }),
      prisma.timeEntry.aggregate({
        where: {
          userId: userId,
          startTime: { gte: startOfMonth }
        },
        _sum: { duration: true },
        _count: true
      }),
      
      // Benutzerstatistiken (nur für Admins)
      userRole === 'ADMIN' ? prisma.user.count() : Promise.resolve(0),
      userRole === 'ADMIN' ? prisma.user.count({ where: { isActive: true } }) : Promise.resolve(0),
      
      // Aktuelle Projekte
      prisma.project.findMany({
        where: {
          ...projectFilter,
          status: 'ACTIVE'
        },
        include: {
          _count: {
            select: {
              tasks: true,
              members: true,
              timeEntries: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      }),
      
      // Aktuelle Aufgaben
      prisma.task.findMany({
        where: {
          project: projectFilter,
          status: { in: ['TODO', 'IN_PROGRESS', 'REVIEW'] },
          OR: [
            { assignedTo: userId },
            { createdBy: userId }
          ]
        },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          },
          assignedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { dueDate: 'asc' },
        take: 5
      }),
      
      // Aktiver Timer
      prisma.timeEntry.findFirst({
        where: {
          userId: userId,
          endTime: null
        },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          },
          task: {
            select: {
              id: true,
              title: true
            }
          }
        }
      })
    ])

    // Zusätzliche Berechnungen
    const projectProgress = totalProjects > 0 
      ? Math.round((completedProjects / totalProjects) * 100) 
      : 0

    const taskProgress = totalTasks > 0 
      ? Math.round((completedTasks / totalTasks) * 100) 
      : 0

    // Produktivitätsmetriken
    const averageTasksPerProject = totalProjects > 0 
      ? Math.round(totalTasks / totalProjects) 
      : 0

    const averageTimePerTask = completedTasks > 0 && monthTimeEntries._sum.duration
      ? Math.round((monthTimeEntries._sum.duration / 3600) / completedTasks * 10) / 10
      : 0

    // Timer-Status
    const timerStatus = activeTimer ? {
      isRunning: true,
      project: activeTimer.project.name,
      task: activeTimer.task?.title,
      startTime: activeTimer.startTime,
      currentDuration: Math.floor((now.getTime() - activeTimer.startTime.getTime()) / 1000)
    } : {
      isRunning: false
    }

    // Response zusammenstellen
    const dashboardStats = {
      // Projektstatistiken
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
        onHold: projectsOnHold,
        progress: projectProgress
      },
      
      // Aufgabenstatistiken
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        active: activeTasks,
        overdue: overdueTasks,
        progress: taskProgress
      },
      
      // Zeiterfassungsstatistiken
      timeTracking: {
        today: {
          duration: todayTimeEntries._sum.duration || 0,
          entries: todayTimeEntries._count
        },
        week: {
          duration: weekTimeEntries._sum.duration || 0,
          entries: weekTimeEntries._count
        },
        month: {
          duration: monthTimeEntries._sum.duration || 0,
          entries: monthTimeEntries._count
        }
      },
      
      // Benutzerstatistiken (nur für Admins)
      ...(userRole === 'ADMIN' && {
        users: {
          total: totalUsers,
          active: activeUsers
        }
      }),
      
      // Produktivitätsmetriken
      productivity: {
        averageTasksPerProject,
        averageTimePerTask,
        completionRate: taskProgress
      },
      
      // Timer-Status
      timer: timerStatus,
      
      // Aktuelle Daten
      recentProjects: recentProjects.map(project => ({
        ...project,
        progress: project._count.tasks > 0 
          ? Math.round((project._count.tasks / project._count.tasks) * 100) 
          : 0
      })),
      
      recentTasks: recentTasks.map(task => ({
        ...task,
        isOverdue: task.dueDate ? task.dueDate < now : false
      })),
      
      // Metadaten
      generatedAt: now.toISOString(),
      userRole: userRole
    }

    return NextResponse.json(dashboardStats)

  } catch (error) {
    console.error('Fehler beim Abrufen der Dashboard-Statistiken:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}
