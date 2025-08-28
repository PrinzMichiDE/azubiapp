'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth, withAuth, usePermissions } from '@/contexts/AuthContext'
import { adminAPI, dashboardAPI, handleApiError } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  UsersIcon,
  ServerIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CogIcon,
  DatabaseIcon,
  ShieldCheckIcon,
  DocumentMagnifyingGlassIcon,
  ArrowPathIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

// Admin Dashboard Interfaces
interface SystemStats {
  users: {
    total: number
    active: number
    newToday: number
    newThisWeek: number
  }
  projects: {
    total: number
    active: number
    completed: number
    overdue: number
  }
  system: {
    uptime: number
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
    activeConnections: number
  }
  requests: {
    totalToday: number
    averageResponseTime: number
    errorRate: number
    rateLimitHits: number
  }
}

interface RecentActivity {
  id: string
  type: 'USER_CREATED' | 'PROJECT_CREATED' | 'SYSTEM_ERROR' | 'LOGIN_ATTEMPT'
  description: string
  user?: {
    id: string
    username: string
    email: string
  }
  timestamp: string
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'
}

interface ARPTask {
  id: string
  type: 'USER_REGISTRATION' | 'PROJECT_APPROVAL' | 'SYSTEM_MAINTENANCE' | 'DATA_CLEANUP'
  title: string
  description: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  createdAt: string
  processedAt?: string
  result?: string
}

function AdminDashboard() {
  const t = useTranslations('admin')
  const { user } = useAuth()
  const { isAdmin } = usePermissions()
  
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [arpTasks, setArpTasks] = useState<ARPTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Redirect if not admin
  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ShieldCheckIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Zugriff verweigert
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Sie haben keine Berechtigung zum Zugriff auf das Admin-Center.
          </p>
          <Link href="/dashboard">
            <Button>Zurück zum Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Daten laden
  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Simulierte Admin-Daten (würde normalerweise von API kommen)
      const mockStats: SystemStats = {
        users: {
          total: 156,
          active: 142,
          newToday: 3,
          newThisWeek: 18
        },
        projects: {
          total: 89,
          active: 67,
          completed: 22,
          overdue: 5
        },
        system: {
          uptime: 99.7,
          cpuUsage: 45.2,
          memoryUsage: 67.8,
          diskUsage: 34.1,
          activeConnections: 89
        },
        requests: {
          totalToday: 12456,
          averageResponseTime: 145,
          errorRate: 0.3,
          rateLimitHits: 23
        }
      }

      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'USER_CREATED',
          description: 'Neuer Benutzer registriert',
          user: { id: 'u1', username: 'newuser', email: 'new@example.com' },
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          severity: 'SUCCESS'
        },
        {
          id: '2',
          type: 'PROJECT_CREATED',
          description: 'Neues Projekt "Mobile App" erstellt',
          user: { id: 'u2', username: 'manager', email: 'manager@example.com' },
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          severity: 'INFO'
        },
        {
          id: '3',
          type: 'SYSTEM_ERROR',
          description: 'Database connection timeout',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          severity: 'ERROR'
        },
        {
          id: '4',
          type: 'LOGIN_ATTEMPT',
          description: 'Fehlgeschlagener Login-Versuch',
          user: { id: 'u3', username: 'hacker', email: 'bad@example.com' },
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          severity: 'WARNING'
        }
      ]

      const mockARPTasks: ARPTask[] = [
        {
          id: 'arp1',
          type: 'USER_REGISTRATION',
          title: 'Benutzer-Freischaltung ausstehend',
          description: '3 neue Benutzer warten auf Admin-Freischaltung',
          status: 'PENDING',
          priority: 'MEDIUM',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'arp2',
          type: 'PROJECT_APPROVAL',
          title: 'Projekt-Genehmigung erforderlich',
          description: 'Projekt "Enterprise Solution" benötigt Budget-Genehmigung',
          status: 'PENDING',
          priority: 'HIGH',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'arp3',
          type: 'SYSTEM_MAINTENANCE',
          title: 'Datenbank-Wartung',
          description: 'Automatische Datenbank-Optimierung durchgeführt',
          status: 'COMPLETED',
          priority: 'LOW',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          processedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          result: 'Erfolgreich abgeschlossen: 145MB freigegeben'
        },
        {
          id: 'arp4',
          type: 'DATA_CLEANUP',
          title: 'Temporäre Dateien bereinigen',
          status: 'PROCESSING',
          description: 'Alte Upload-Dateien werden bereinigt',
          priority: 'LOW',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        }
      ]

      setStats(mockStats)
      setRecentActivity(mockActivity)
      setArpTasks(mockARPTasks)

    } catch (err) {
      console.error('Fehler beim Laden der Admin-Daten:', err)
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadAdminData()
    setRefreshing(false)
  }

  // Hilfsfunktionen
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'SUCCESS': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'INFO': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'WARNING': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'ERROR': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'PROCESSING': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'PENDING': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'FAILED': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'HIGH': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20'
      case 'MEDIUM': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'LOW': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const formatUptime = (uptime: number) => {
    const days = Math.floor(uptime)
    const hours = Math.floor((uptime - days) * 24)
    return `${days}d ${hours}h`
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
                Admin Center
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                System-Übersicht und Verwaltungstools
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
              <Link href="/admin/users">
                <Button>
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Benutzerverwaltung
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

        {/* System-Statistiken */}
        {stats && (
          <>
            {/* Übersichtskarten */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Benutzer */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <UsersIcon className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Benutzer
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.users.total}
                      </p>
                      <p className="text-xs text-green-600">
                        {stats.users.active} aktiv
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Projekte */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-8 w-8 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Projekte
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.projects.total}
                      </p>
                      <p className="text-xs text-green-600">
                        {stats.projects.active} aktiv
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* System-Uptime */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <ServerIcon className="h-8 w-8 text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Uptime
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.system.uptime}%
                      </p>
                      <p className="text-xs text-purple-600">
                        {formatUptime(7.8)} verfügbar
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* API-Requests */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DatabaseIcon className="h-8 w-8 text-orange-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        API-Requests
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.requests.totalToday.toLocaleString()}
                      </p>
                      <p className="text-xs text-orange-600">
                        Heute
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* System-Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* System-Metriken */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ServerIcon className="h-5 w-5 mr-2" />
                    System-Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* CPU */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>CPU-Auslastung</span>
                        <span>{stats.system.cpuUsage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${stats.system.cpuUsage}%` }}
                        />
                      </div>
                    </div>

                    {/* Memory */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Arbeitsspeicher</span>
                        <span>{stats.system.memoryUsage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${stats.system.memoryUsage}%` }}
                        />
                      </div>
                    </div>

                    {/* Disk */}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Festplatte</span>
                        <span>{stats.system.diskUsage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${stats.system.diskUsage}%` }}
                        />
                      </div>
                    </div>

                    {/* Verbindungen */}
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Aktive Verbindungen
                        </span>
                        <span className="font-medium">
                          {stats.system.activeConnections}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* ARP Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CogIcon className="h-5 w-5 mr-2" />
                    ARP - Automatisierte Prozesse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {arpTasks.slice(0, 4).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {task.description}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button size="sm" variant="ghost">
                            <EyeIcon className="h-4 w-4" />
                          </Button>
                          {task.status === 'PENDING' && (
                            <Button size="sm" variant="ghost">
                              <PlayIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    <Link href="/admin/arp">
                      <Button variant="outline" className="w-full">
                        Alle ARP-Aufgaben anzeigen
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/admin/users">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <UsersIcon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Benutzerverwaltung
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Benutzer verwalten und Rollen zuweisen
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/projects">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <ChartBarIcon className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Projekt-Übersicht
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Alle Projekte verwalten und überwachen
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/system">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <ServerIcon className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 dark:text-white">
                  System-Monitor
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  System-Performance und Logs
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/arp">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6 text-center">
                <CogIcon className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 dark:text-white">
                  ARP-Center
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Automatisierte Prozesse verwalten
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Letzte Aktivitäten */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              Letzte Aktivitäten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getSeverityColor(activity.severity)}`}>
                      {activity.severity}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.description}
                      </p>
                      {activity.user && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          von {activity.user.username} ({activity.user.email})
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(activity.timestamp).toLocaleString('de-DE')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default withAuth(AdminDashboard)
