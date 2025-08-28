'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth, withAuth } from '@/contexts/AuthContext'
import { taskAPI, projectAPI, handleApiError } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  PlayIcon,
  CheckIcon,
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  FolderIcon,
  ArrowPathIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

// Task Interface
interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  estimatedHours?: number
  actualHours?: number
  dueDate?: string
  assignedTo?: string
  projectId: string
  parentTaskId?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  
  // Relationen
  project: {
    id: string
    name: string
    status: string
  }
  creator: {
    id: string
    username: string
    firstName?: string
    lastName?: string
  }
  assignedUser?: {
    id: string
    username: string
    firstName?: string
    lastName?: string
  }
  parentTask?: {
    id: string
    title: string
  }
  
  // Counts
  _count: {
    subtasks: number
    timeEntries: number
    comments: number
  }
}

interface Project {
  id: string
  name: string
  status: string
}

interface TaskStats {
  total: number
  todo: number
  inProgress: number
  review: number
  done: number
  cancelled: number
  overdue: number
  dueToday: number
  dueThisWeek: number
}

function TaskManagement() {
  const t = useTranslations()
  const { user } = useAuth()
  
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filter und Suche
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterPriority, setFilterPriority] = useState<string>('ALL')
  const [filterProject, setFilterProject] = useState<string>('ALL')
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<string>('dueDate')
  const [sortOrder, setSortOrder] = useState<string>('asc')
  
  // UI States
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar'>('list')

  // Daten laden
  useEffect(() => {
    Promise.all([loadTasks(), loadProjects()])
  }, [searchTerm, filterStatus, filterPriority, filterProject, filterAssignee, sortBy, sortOrder])

  const loadTasks = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = {
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== 'ALL' && { status: filterStatus }),
        ...(filterPriority !== 'ALL' && { priority: filterPriority }),
        ...(filterProject !== 'ALL' && { projectId: filterProject }),
        ...(filterAssignee !== 'ALL' && { assignedTo: filterAssignee }),
        page: 1,
        limit: 50,
        sortBy,
        sortOrder
      }

      const response = await taskAPI.getAll(params)
      setTasks(response.tasks || [])

      // Statistiken berechnen
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      const taskStats: TaskStats = {
        total: response.tasks?.length || 0,
        todo: response.tasks?.filter((t: Task) => t.status === 'TODO').length || 0,
        inProgress: response.tasks?.filter((t: Task) => t.status === 'IN_PROGRESS').length || 0,
        review: response.tasks?.filter((t: Task) => t.status === 'REVIEW').length || 0,
        done: response.tasks?.filter((t: Task) => t.status === 'DONE').length || 0,
        cancelled: response.tasks?.filter((t: Task) => t.status === 'CANCELLED').length || 0,
        overdue: response.tasks?.filter((t: Task) => 
          t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
        ).length || 0,
        dueToday: response.tasks?.filter((t: Task) => 
          t.dueDate && new Date(t.dueDate).toDateString() === today.toDateString()
        ).length || 0,
        dueThisWeek: response.tasks?.filter((t: Task) => 
          t.dueDate && new Date(t.dueDate) <= nextWeek && new Date(t.dueDate) >= today
        ).length || 0,
      }

      setStats(taskStats)

    } catch (err) {
      console.error('Fehler beim Laden der Aufgaben:', err)
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const response = await projectAPI.getAll({ limit: 100 })
      setProjects(response.projects || [])
    } catch (err) {
      console.error('Fehler beim Laden der Projekte:', err)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await Promise.all([loadTasks(), loadProjects()])
    setRefreshing(false)
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await taskAPI.update(taskId, { status: newStatus })
      await loadTasks() // Neuladen für aktualisierte Statistiken
    } catch (err) {
      console.error('Fehler beim Aktualisieren der Aufgabe:', err)
      setError(handleApiError(err))
    }
  }

  const startTimer = async (task: Task) => {
    try {
      // Timer-Start würde hier implementiert werden
      console.log('Timer starten für Aufgabe:', task.title)
    } catch (err) {
      console.error('Fehler beim Starten des Timers:', err)
      setError(handleApiError(err))
    }
  }

  // Hilfsfunktionen
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'text-gray-600 bg-gray-100 dark:bg-gray-800'
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'REVIEW': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'DONE': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'CANCELLED': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'MEDIUM': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'HIGH': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      case 'URGENT': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO': return ClockIcon
      case 'IN_PROGRESS': return PlayIcon
      case 'REVIEW': return EyeIcon
      case 'DONE': return CheckCircleIcon
      case 'CANCELLED': return XMarkIcon
      default: return ClockIcon
    }
  }

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('tasks.title')}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {t('tasks.subtitle')}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={refreshData}
                disabled={refreshing}
                variant="outline"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Aktualisieren
              </Button>
              <Button onClick={() => setShowCreateModal(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Neue Aufgabe
              </Button>
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

        {/* Statistiken */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Gesamt
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.total}
                    </p>
                    <p className="text-xs text-blue-600">
                      {stats.done} erledigt
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      In Bearbeitung
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.inProgress}
                    </p>
                    <p className="text-xs text-yellow-600">
                      {stats.todo} offen
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Überfällig
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.overdue}
                    </p>
                    <p className="text-xs text-red-600">
                      Aktion erforderlich
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CalendarIcon className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Diese Woche
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.dueThisWeek}
                    </p>
                    <p className="text-xs text-purple-600">
                      {stats.dueToday} heute
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter und Suche */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Suche */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Aufgaben suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="ALL">Alle Status</option>
              <option value="TODO">Offen</option>
              <option value="IN_PROGRESS">In Bearbeitung</option>
              <option value="REVIEW">Review</option>
              <option value="DONE">Erledigt</option>
              <option value="CANCELLED">Abgebrochen</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="ALL">Alle Prioritäten</option>
              <option value="URGENT">Dringend</option>
              <option value="HIGH">Hoch</option>
              <option value="MEDIUM">Mittel</option>
              <option value="LOW">Niedrig</option>
            </select>

            <select
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="ALL">Alle Projekte</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-md">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'list'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Liste
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'kanban'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Kanban
              </button>
            </div>
          </div>
        </div>

        {/* Aufgaben-Liste */}
        {viewMode === 'list' ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Aufgaben ({tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.map((task) => {
                  const StatusIcon = getStatusIcon(task.status)
                  return (
                    <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <StatusIcon className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                                {task.status.replace('_', ' ')}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                                {task.priority}
                              </span>
                              {task.dueDate && isOverdue(task.dueDate) && (
                                <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full">
                                  Überfällig
                                </span>
                              )}
                            </div>
                            
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                              {task.title}
                            </h3>
                            
                            {task.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span className="flex items-center">
                                <FolderIcon className="h-4 w-4 mr-1" />
                                {task.project.name}
                              </span>
                              
                              {task.assignedUser && (
                                <span className="flex items-center">
                                  <UserIcon className="h-4 w-4 mr-1" />
                                  {task.assignedUser.firstName} {task.assignedUser.lastName}
                                </span>
                              )}
                              
                              {task.dueDate && (
                                <span className="flex items-center">
                                  <CalendarIcon className="h-4 w-4 mr-1" />
                                  {formatDate(task.dueDate)}
                                </span>
                              )}
                              
                              {task._count.subtasks > 0 && (
                                <span>
                                  {task._count.subtasks} Subtasks
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Aktionen */}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {task.status !== 'DONE' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startTimer(task)}
                              title="Timer starten"
                            >
                              <PlayIcon className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedTask(task)}
                            title="Details anzeigen"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            title="Bearbeiten"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          
                          {task.status !== 'DONE' && (
                            <Button
                              size="sm"
                              onClick={() => updateTaskStatus(task.id, 'DONE')}
                              title="Als erledigt markieren"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {tasks.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Keine Aufgaben gefunden für die aktuellen Filter.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          // Kanban Board View
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED'].map((status) => (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
                      {status.replace('_', ' ')} ({tasks.filter(t => t.status === status).length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {tasks
                      .filter(task => task.status === status)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => setSelectedTask(task)}
                        >
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-2">
                            {task.title}
                          </h4>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className={`px-1 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            {task.dueDate && (
                              <span className={isOverdue(task.dueDate) ? 'text-red-600' : ''}>
                                {formatDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Task Detail Modal */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Aufgaben-Details
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedTask(null)}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {selectedTask.title}
                    </h3>
                    {selectedTask.description && (
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedTask.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTask.status)}`}>
                        {selectedTask.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Priorität
                      </label>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedTask.priority)}`}>
                        {selectedTask.priority}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Projekt
                      </label>
                      <p className="text-gray-900 dark:text-white">{selectedTask.project.name}</p>
                    </div>
                    
                    {selectedTask.assignedUser && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Zugewiesen an
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {selectedTask.assignedUser.firstName} {selectedTask.assignedUser.lastName}
                        </p>
                      </div>
                    )}
                    
                    {selectedTask.dueDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Fälligkeitsdatum
                        </label>
                        <p className={`${isOverdue(selectedTask.dueDate) ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                          {formatDate(selectedTask.dueDate)}
                          {isOverdue(selectedTask.dueDate) && ' (Überfällig)'}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Erstellt von
                      </label>
                      <p className="text-gray-900 dark:text-white">
                        {selectedTask.creator.firstName} {selectedTask.creator.lastName}
                      </p>
                    </div>
                  </div>
                  
                  {(selectedTask.estimatedHours || selectedTask.actualHours) && (
                    <div className="grid grid-cols-2 gap-4">
                      {selectedTask.estimatedHours && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Geschätzte Stunden
                          </label>
                          <p className="text-gray-900 dark:text-white">{selectedTask.estimatedHours}h</p>
                        </div>
                      )}
                      
                      {selectedTask.actualHours && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tatsächliche Stunden
                          </label>
                          <p className="text-gray-900 dark:text-white">{selectedTask.actualHours}h</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>Erstellt: {formatDate(selectedTask.createdAt)}</span>
                    <span>Aktualisiert: {formatDate(selectedTask.updatedAt)}</span>
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    {selectedTask.status !== 'DONE' && (
                      <>
                        <Button
                          onClick={() => startTimer(selectedTask)}
                          variant="outline"
                        >
                          <PlayIcon className="h-4 w-4 mr-2" />
                          Timer starten
                        </Button>
                        <Button
                          onClick={() => {
                            updateTaskStatus(selectedTask.id, 'DONE')
                            setSelectedTask(null)
                          }}
                        >
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Als erledigt markieren
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(TaskManagement)
