'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth, withAuth } from '@/contexts/AuthContext'
import { projectAPI, taskAPI, timeAPI, handleApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  PlusIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ChartBarIcon,
  DocumentIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline'

// Interfaces
interface Project {
  id: string
  name: string
  description?: string
  status: string
  priority: string
  startDate?: string
  endDate?: string
  budget?: number
  clientName?: string
  members: Array<{
    id: string
    user: {
      id: string
      username: string
      firstName?: string
      lastName?: string
      email: string
    }
    role: string
    joinedAt: string
  }>
  tasks: Array<{
    id: string
    title: string
    status: string
    priority: string
    assignedUser?: {
      id: string
      firstName?: string
      lastName?: string
      username: string
    }
    dueDate?: string
  }>
  stats: {
    progress: number
    completedTasks: number
    totalTasks: number
    totalTimeSpent: number
    activeTasks: number
  }
}

function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const t = useTranslations()
  const { user } = useAuth()
  
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTimerLoading, setIsTimerLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'members' | 'files'>('overview')

  const projectId = params.id as string

  // Projekt-Daten laden
  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const projectData = await projectAPI.getById(projectId)
        setProject(projectData)
        
      } catch (err) {
        console.error('Fehler beim Laden des Projekts:', err)
        setError(handleApiError(err))
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      loadProject()
    }
  }, [projectId])

  // Timer starten
  const handleStartTimer = async (taskId?: string) => {
    try {
      setIsTimerLoading(true)
      await timeAPI.startTimer({
        projectId: projectId,
        taskId: taskId,
        description: `Arbeit an ${project?.name}${taskId ? ` - Aufgabe` : ''}`
      })
      
      // Erfolgsmeldung oder Toast
      console.log('Timer gestartet')
    } catch (err) {
      console.error('Fehler beim Starten des Timers:', err)
      setError(handleApiError(err))
    } finally {
      setIsTimerLoading(false)
    }
  }

  // Prioritäts- und Status-Styling
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'HIGH': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      case 'MEDIUM': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'LOW': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'COMPLETED': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'ON_HOLD': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'CANCELLED': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'REVIEW': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'DONE': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'CANCELLED': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Projekt nicht gefunden
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || 'Das angeforderte Projekt konnte nicht geladen werden.'}
            </p>
            <Link href="/projects">
              <Button>
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Zurück zu Projekten
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Projekte
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {project.name}
                </h1>
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                    {t(`Dashboard.projectStatus.${project.status}`)}
                  </span>
                  <span className={`px-3 py-1 text-xs rounded-full ${getPriorityColor(project.priority)}`}>
                    {t(`Dashboard.priority.${project.priority}`)}
                  </span>
                  {project.clientName && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Kunde: {project.clientName}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => handleStartTimer()}
                disabled={isTimerLoading}
                variant="outline"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                Timer starten
              </Button>
              <Link href={`/projects/${project.id}/edit`}>
                <Button variant="outline">
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Bearbeiten
                </Button>
              </Link>
              <Link href={`/projects/${project.id}/tasks/new`}>
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Neue Aufgabe
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Projekt-Übersicht */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Fortschritt
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {project.stats.progress}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircleIcon className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Aufgaben
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {project.stats.completedTasks}/{project.stats.totalTasks}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Gesamtzeit
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(project.stats.totalTimeSpent / 3600 * 10) / 10}h
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserGroupIcon className="h-8 w-8 text-orange-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Team
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {project.members.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Übersicht', icon: ChartBarIcon },
              { key: 'tasks', label: 'Aufgaben', icon: CheckCircleIcon },
              { key: 'members', label: 'Team', icon: UserGroupIcon },
              { key: 'files', label: 'Dateien', icon: DocumentIcon },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab-Inhalte */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Projekt-Details */}
            <Card>
              <CardHeader>
                <CardTitle>Projekt-Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {project.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Beschreibung
                      </label>
                      <p className="text-gray-900 dark:text-white">{project.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    {project.startDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Startdatum
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {new Date(project.startDate).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    )}
                    
                    {project.endDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Enddatum
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {new Date(project.endDate).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {project.budget && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Budget
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('de-DE', {
                          style: 'currency',
                          currency: 'EUR'
                        }).format(project.budget)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Aktuelle Aufgaben */}
            <Card>
              <CardHeader>
                <CardTitle>Aktuelle Aufgaben</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.tasks.filter(task => task.status !== 'DONE').slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <Link 
                          href={`/tasks/${task.id}`}
                          className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600"
                        >
                          {task.title}
                        </Link>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${getTaskStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                            {t(`Dashboard.priority.${task.priority}`)}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleStartTimer(task.id)}
                        size="sm"
                        variant="ghost"
                        disabled={isTimerLoading}
                      >
                        <PlayIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {project.tasks.filter(task => task.status !== 'DONE').length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      Keine aktiven Aufgaben
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'tasks' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Alle Aufgaben</CardTitle>
                <Link href={`/projects/${project.id}/tasks/new`}>
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Neue Aufgabe
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <Link 
                          href={`/tasks/${task.id}`}
                          className="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600"
                        >
                          {task.title}
                        </Link>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getTaskStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                            {t(`Dashboard.priority.${task.priority}`)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                        {task.assignedUser && (
                          <span>
                            Zugewiesen an: {task.assignedUser.firstName || task.assignedUser.username}
                          </span>
                        )}
                        {task.dueDate && (
                          <span>
                            Fällig: {new Date(task.dueDate).toLocaleDateString('de-DE')}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleStartTimer(task.id)}
                      size="sm"
                      variant="ghost"
                      disabled={isTimerLoading}
                    >
                      <PlayIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {project.tasks.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Noch keine Aufgaben vorhanden. Erstellen Sie die erste Aufgabe!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'members' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Team-Mitglieder</CardTitle>
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Mitglied hinzufügen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {(member.user.firstName?.[0] || member.user.username[0]).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {member.user.firstName && member.user.lastName 
                            ? `${member.user.firstName} ${member.user.lastName}`
                            : member.user.username
                          }
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-full">
                        {member.role}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Seit {new Date(member.joinedAt).toLocaleDateString('de-DE')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'files' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Projekt-Dateien</CardTitle>
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Datei hochladen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  Noch keine Dateien hochgeladen. Laden Sie die erste Datei hoch!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default withAuth(ProjectDetailPage)
