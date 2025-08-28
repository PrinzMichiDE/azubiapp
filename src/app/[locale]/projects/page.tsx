'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth, withAuth } from '@/contexts/AuthContext'
import { projectAPI, handleApiError } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  FolderIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

interface Project {
  id: string
  name: string
  description?: string
  status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  startDate?: string
  endDate?: string
  budget?: number
  clientName?: string
  createdAt: string
  updatedAt: string
  
  _count: {
    tasks: number
    members: number
    timeEntries: number
  }
}

interface ProjectStats {
  total: number
  active: number
  completed: number
  onHold: number
  cancelled: number
  overdue: number
}

function ProjectsPage() {
  const t = useTranslations()
  const { user } = useAuth()
  
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<ProjectStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filter und Suche
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterPriority, setFilterPriority] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<string>('updatedAt')
  const [sortOrder, setSortOrder] = useState<string>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    loadProjects()
  }, [searchTerm, filterStatus, filterPriority, sortBy, sortOrder])

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = {
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== 'ALL' && { status: filterStatus }),
        ...(filterPriority !== 'ALL' && { priority: filterPriority }),
        page: 1,
        limit: 50,
        sortBy,
        sortOrder
      }

      const response = await projectAPI.getAll(params)
      setProjects(response.projects || [])

      // Statistiken berechnen
      const projectStats: ProjectStats = {
        total: response.projects?.length || 0,
        active: response.projects?.filter((p: Project) => p.status === 'ACTIVE').length || 0,
        completed: response.projects?.filter((p: Project) => p.status === 'COMPLETED').length || 0,
        onHold: response.projects?.filter((p: Project) => p.status === 'ON_HOLD').length || 0,
        cancelled: response.projects?.filter((p: Project) => p.status === 'CANCELLED').length || 0,
        overdue: response.projects?.filter((p: Project) => 
          p.endDate && new Date(p.endDate) < new Date() && p.status === 'ACTIVE'
        ).length || 0,
      }

      setStats(projectStats)

    } catch (err) {
      console.error('Fehler beim Laden der Projekte:', err)
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadProjects()
    setRefreshing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'COMPLETED': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'ON_HOLD': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const isOverdue = (endDate: string) => {
    return new Date(endDate) < new Date()
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
                Projekte
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Verwalten Sie alle Ihre Projekte an einem Ort
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
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Neues Projekt
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
                  <FolderIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Gesamt
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.total}
                    </p>
                    <p className="text-xs text-blue-600">
                      Alle Projekte
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ChartBarIcon className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Aktiv
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.active}
                    </p>
                    <p className="text-xs text-green-600">
                      In Bearbeitung
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
                      Abgeschlossen
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.completed}
                    </p>
                    <p className="text-xs text-purple-600">
                      Erfolgreich
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
                  placeholder="Projekte suchen..."
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
              <option value="ACTIVE">Aktiv</option>
              <option value="COMPLETED">Abgeschlossen</option>
              <option value="ON_HOLD">Pausiert</option>
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

            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 text-sm ${
                  viewMode === 'grid'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                Raster
              </button>
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
            </div>
          </div>
        </div>

        {/* Projekt-Liste */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(project.priority)}`}>
                          {project.priority}
                        </span>
                        {project.endDate && isOverdue(project.endDate) && project.status === 'ACTIVE' && (
                          <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full">
                            Überfällig
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {project.clientName && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Kunde:</strong> {project.clientName}
                      </p>
                    )}
                    
                    {project.endDate && (
                      <p className={`text-sm ${
                        isOverdue(project.endDate) && project.status === 'ACTIVE'
                          ? 'text-red-600'
                          : 'text-gray-600 dark:text-gray-400'
                      }`}>
                        <CalendarIcon className="h-4 w-4 inline mr-1" />
                        Deadline: {formatDate(project.endDate)}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        {project._count.members} Mitglieder
                      </span>
                      <span>
                        {project._count.tasks} Aufgaben
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex space-x-2">
                        <Link href={`/projects/${project.id}`}>
                          <Button size="sm" variant="outline">
                            <EyeIcon className="h-4 w-4 mr-1" />
                            Anzeigen
                          </Button>
                        </Link>
                        <Button size="sm" variant="ghost">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(project.updatedAt)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Liste View
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Projekt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Priorität
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Deadline
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {projects.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {project.name}
                            </div>
                            {project.clientName && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {project.clientName}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                            {project.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(project.priority)}`}>
                            {project.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {project._count.members} Mitglieder
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {project.endDate ? (
                            <span className={isOverdue(project.endDate) && project.status === 'ACTIVE' ? 'text-red-600' : ''}>
                              {formatDate(project.endDate)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link href={`/projects/${project.id}`}>
                              <Button size="sm" variant="outline">
                                <EyeIcon className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button size="sm" variant="ghost">
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {projects.length === 0 && (
          <div className="text-center py-12">
            <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || filterStatus !== 'ALL' || filterPriority !== 'ALL'
                ? 'Keine Projekte für die aktuellen Filter gefunden.'
                : 'Noch keine Projekte erstellt. Beginnen Sie mit Ihrem ersten Projekt!'
              }
            </p>
            {!(searchTerm || filterStatus !== 'ALL' || filterPriority !== 'ALL') && (
              <Button className="mt-4">
                <PlusIcon className="h-4 w-4 mr-2" />
                Erstes Projekt erstellen
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(ProjectsPage)