'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth, withAuth } from '@/contexts/AuthContext'
import { dashboardAPI, timeAPI, projectAPI, handleApiError } from '@/lib/api'
import { 
  ChartBarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  PlusIcon,
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'

// Dashboard-Statistiken Interface
interface DashboardStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  totalHours: number
  thisWeekHours: number
}

// Projekt Interface
interface Project {
  id: string
  name: string
  status: string
  priority: string
  progress: number
  dueDate: string
  members: number
}

// Timer Interface
interface TimerState {
  isRunning: boolean
  timeEntry?: {
    id: string
    project: { name: string }
    task?: { title: string }
    startTime: string
    currentDuration: number
  }
}

// Dashboard-Seite
function DashboardPage() {
  const t = useTranslations('Dashboard')
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalHours: 0,
    thisWeekHours: 0,
  })
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timerStatus, setTimerStatus] = useState<TimerState>({ isRunning: false })
  const [isTimerLoading, setIsTimerLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState<number>(0)

  // Dashboard-Daten laden
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Dashboard-Statistiken laden
        const dashboardData = await dashboardAPI.getStats()
        
        // Statistiken konvertieren
        setStats({
          totalProjects: dashboardData.projects?.total || 0,
          activeProjects: dashboardData.projects?.active || 0,
          completedProjects: dashboardData.projects?.completed || 0,
          totalTasks: dashboardData.tasks?.total || 0,
          completedTasks: dashboardData.tasks?.completed || 0,
          pendingTasks: dashboardData.tasks?.active || 0,
          totalHours: Math.round((dashboardData.timeTracking?.month?.duration || 0) / 3600 * 10) / 10,
          thisWeekHours: Math.round((dashboardData.timeTracking?.week?.duration || 0) / 3600 * 10) / 10,
        })
        
        // Aktuelle Projekte setzen
        if (dashboardData.recentProjects) {
          setRecentProjects(dashboardData.recentProjects.map((project: any) => ({
            id: project.id,
            name: project.name,
            status: project.status,
            priority: project.priority,
            progress: project.stats?.progress || 0,
            dueDate: project.endDate || '',
            members: project._count?.members || 0,
          })))
        }
        
        // Timer-Status laden
        const timer = await timeAPI.getTimerStatus()
        setTimerStatus(timer)
        if (timer.isRunning && timer.timeEntry) {
          setCurrentTime(timer.timeEntry.currentDuration)
        }
        
      } catch (err) {
        console.error('Fehler beim Laden der Dashboard-Daten:', err)
        setError(handleApiError(err))
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadDashboardData()
    }
  }, [user])

  // Timer aktualisieren
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (timerStatus.isRunning && timerStatus.timeEntry) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1)
      }, 1000)
    }
    
    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [timerStatus.isRunning])

  // Timer-Funktionen
  const handleStopTimer = async () => {
    try {
      setIsTimerLoading(true)
      await timeAPI.stopTimer({
        isBillable: true
      })
      
      // Status aktualisieren
      const timer = await timeAPI.getTimerStatus()
      setTimerStatus(timer)
      setCurrentTime(0)
      
      // Statistiken neu laden
      const dashboardData = await dashboardAPI.getStats()
      setStats({
        totalProjects: dashboardData.projects?.total || 0,
        activeProjects: dashboardData.projects?.active || 0,
        completedProjects: dashboardData.projects?.completed || 0,
        totalTasks: dashboardData.tasks?.total || 0,
        completedTasks: dashboardData.tasks?.completed || 0,
        pendingTasks: dashboardData.tasks?.active || 0,
        totalHours: Math.round((dashboardData.timeTracking?.month?.duration || 0) / 3600 * 10) / 10,
        thisWeekHours: Math.round((dashboardData.timeTracking?.week?.duration || 0) / 3600 * 10) / 10,
      })
    } catch (err) {
      console.error('Fehler beim Stoppen des Timers:', err)
      setError(handleApiError(err))
    } finally {
      setIsTimerLoading(false)
    }
  }

  // Formatierung der Timer-Zeit
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Prioritätsfarben
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'HIGH':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      case 'MEDIUM':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'LOW':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  // Status-Farben
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'COMPLETED':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'ON_HOLD':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'CANCELLED':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('title')}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Willkommen zurück, {user?.firstName || user?.username}! Hier ist Ihre Übersicht.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Link href="/projects/new">
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Neues Projekt
                </Button>
              </Link>
              <Link href="/tasks/new">
                <Button variant="outline">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Neue Aufgabe
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Fehleranzeige */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}

        {/* Timer-Widget */}
        {timerStatus.isRunning && timerStatus.timeEntry && (
          <div className="mb-8">
            <Card className="p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Aktiver Timer</h3>
                  <p className="text-blue-100">
                    {timerStatus.timeEntry.project.name}
                    {timerStatus.timeEntry.task && ` - ${timerStatus.timeEntry.task.title}`}
                  </p>
                  <div className="text-2xl font-bold mt-2">
                    {formatDuration(currentTime)}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleStopTimer}
                    disabled={isTimerLoading}
                    variant="outline"
                    className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  >
                    <StopIcon className="h-4 w-4 mr-2" />
                    Stoppen
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Statistik-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Projekte */}
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('stats.totalProjects')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalProjects}
                </p>
                <p className="text-xs text-green-600">
                  {stats.activeProjects} aktiv
                </p>
              </div>
            </div>
          </Card>

          {/* Aufgaben */}
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('stats.totalTasks')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalTasks}
                </p>
                <p className="text-xs text-green-600">
                  {stats.completedTasks} erledigt
                </p>
              </div>
            </div>
          </Card>

          {/* Zeit diese Woche */}
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <ClockIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('stats.thisWeekHours')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.thisWeekHours}h
                </p>
                <p className="text-xs text-purple-600">
                  Diese Woche
                </p>
              </div>
            </div>
          </Card>

          {/* Gesamtstunden */}
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <ArrowTrendingUpIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('stats.totalHours')}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalHours}h
                </p>
                <p className="text-xs text-orange-600">
                  Diesen Monat
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Aktuelle Projekte */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('recentProjects.title')}
              </h3>
              <Link href="/projects">
                <Button variant="outline" size="sm">
                  Alle anzeigen
                </Button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Link 
                        href={`/projects/${project.id}`}
                        className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600"
                      >
                        {project.name}
                      </Link>
                      <div className="flex space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(project.priority)}`}>
                          {t(`priority.${project.priority}`)}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                          {t(`projectStatus.${project.status}`)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Fortschrittsbalken */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Fortschritt</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        {project.members} Mitglieder
                      </div>
                      {project.dueDate && (
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {new Date(project.dueDate).toLocaleDateString('de-DE')}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Keine Projekte gefunden. Erstellen Sie Ihr erstes Projekt!
                  </p>
                  <Link href="/projects/new" className="mt-3 inline-block">
                    <Button size="sm">
                      <PlusIcon className="h-4 w-4 mr-2" />
                      {t('recentProjects.addNew')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Schnellaktionen */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              {t('quickActions.title')}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Link href="/time-tracking">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors cursor-pointer">
                  <PlayIcon className="h-8 w-8 text-primary-600 mb-2" />
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {t('quickActions.startTimer')}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Zeiterfassung starten
                  </p>
                </div>
              </Link>
              
              <Link href="/tasks/new">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors cursor-pointer">
                  <PlusIcon className="h-8 w-8 text-primary-600 mb-2" />
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {t('quickActions.createTask')}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Neue Aufgabe erstellen
                  </p>
                </div>
              </Link>
              
              <Link href="/reports">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors cursor-pointer">
                  <ChartBarIcon className="h-8 w-8 text-primary-600 mb-2" />
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {t('quickActions.viewReports')}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Berichte anzeigen
                  </p>
                </div>
              </Link>
              
              <Link href="/team">
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors cursor-pointer">
                  <UserGroupIcon className="h-8 w-8 text-primary-600 mb-2" />
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                    {t('quickActions.manageTeam')}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Team verwalten
                  </p>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default withAuth(DashboardPage)