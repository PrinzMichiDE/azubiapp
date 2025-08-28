'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth, withAuth, usePermissions } from '@/contexts/AuthContext'
import { adminAPI, handleApiError } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  CogIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  ArrowPathIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'

// ARP Task Interface
interface ARPTask {
  id: string
  type: 'USER_REGISTRATION' | 'PROJECT_APPROVAL' | 'SYSTEM_MAINTENANCE' | 'DATA_CLEANUP' | 'BACKUP' | 'EMAIL_NOTIFICATIONS' | 'REPORT_GENERATION'
  title: string
  description: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'SCHEDULED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  createdAt: string
  scheduledFor?: string
  processedAt?: string
  completedAt?: string
  result?: string
  error?: string
  progress?: number
  estimatedDuration?: number
  actualDuration?: number
  parameters?: {
    [key: string]: any
  }
  creator?: {
    id: string
    username: string
    firstName?: string
    lastName?: string
  }
}

// ARP Statistics Interface
interface ARPStats {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
  averageProcessingTime: number
  successRate: number
  tasksToday: number
  tasksThisWeek: number
}

function ARPCenter() {
  const t = useTranslations('admin')
  const { user } = useAuth()
  const { isAdmin } = usePermissions()
  
  const [tasks, setTasks] = useState<ARPTask[]>([])
  const [stats, setStats] = useState<ARPStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTask, setSelectedTask] = useState<ARPTask | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [filterType, setFilterType] = useState<string>('ALL')

  // Redirect if not admin
  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Zugriff verweigert
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Sie haben keine Berechtigung zum Zugriff auf das ARP-Center.
          </p>
          <Link href="/admin">
            <Button>Zurück zum Admin-Center</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Daten laden
  useEffect(() => {
    loadARPData()
  }, [filterStatus, filterType])

  const loadARPData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Simulierte ARP-Daten (würde normalerweise von API kommen)
      const mockTasks: ARPTask[] = [
        {
          id: 'arp_001',
          type: 'USER_REGISTRATION',
          title: 'Benutzer-Freischaltungen verarbeiten',
          description: '5 neue Benutzer warten auf Admin-Freischaltung',
          status: 'PENDING',
          priority: 'MEDIUM',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          estimatedDuration: 300, // 5 Minuten
          parameters: {
            userCount: 5,
            autoApprove: false
          },
          creator: {
            id: 'system',
            username: 'System'
          }
        },
        {
          id: 'arp_002',
          type: 'PROJECT_APPROVAL',
          title: 'Budget-Genehmigung: Enterprise Solution',
          description: 'Projekt benötigt Budget-Genehmigung von €50,000',
          status: 'PENDING',
          priority: 'HIGH',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          parameters: {
            projectId: 'proj_123',
            budgetAmount: 50000,
            currency: 'EUR'
          },
          creator: {
            id: 'user_456',
            username: 'project_manager',
            firstName: 'Anna',
            lastName: 'Schmidt'
          }
        },
        {
          id: 'arp_003',
          type: 'SYSTEM_MAINTENANCE',
          title: 'Nächtliche Datenbank-Optimierung',
          description: 'Automatische Datenbank-Bereinigung und Index-Optimierung',
          status: 'COMPLETED',
          priority: 'LOW',
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          processedAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
          actualDuration: 3600, // 1 Stunde
          result: 'Erfolgreich: 245MB freigegeben, 15 Indizes optimiert',
          parameters: {
            cleanupTempFiles: true,
            optimizeIndexes: true,
            compactDatabase: true
          }
        },
        {
          id: 'arp_004',
          type: 'DATA_CLEANUP',
          title: 'Alte Upload-Dateien bereinigen',
          description: 'Dateien älter als 90 Tage aus temporären Ordnern entfernen',
          status: 'PROCESSING',
          priority: 'LOW',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          processedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          progress: 65,
          estimatedDuration: 1800, // 30 Minuten
          parameters: {
            maxAge: 90,
            dryRun: false,
            directories: ['/tmp/uploads', '/tmp/cache']
          }
        },
        {
          id: 'arp_005',
          type: 'BACKUP',
          title: 'Wöchentliche Datenbank-Sicherung',
          description: 'Vollständige Datenbank-Sicherung erstellen',
          status: 'SCHEDULED',
          priority: 'MEDIUM',
          createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // In 2 Stunden
          estimatedDuration: 900, // 15 Minuten
          parameters: {
            fullBackup: true,
            compress: true,
            encryption: true
          }
        },
        {
          id: 'arp_006',
          type: 'EMAIL_NOTIFICATIONS',
          title: 'Projektdeadline-Erinnerungen',
          description: 'E-Mail-Benachrichtigungen für bald fällige Projekte senden',
          status: 'FAILED',
          priority: 'MEDIUM',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          processedAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000).toISOString(),
          actualDuration: 120,
          error: 'SMTP-Server nicht erreichbar: Verbindung verweigert',
          parameters: {
            daysAhead: 7,
            includeOverdue: true,
            recipientRole: 'MANAGER'
          }
        },
        {
          id: 'arp_007',
          type: 'REPORT_GENERATION',
          title: 'Monatlicher Projektbericht',
          description: 'Automatische Erstellung des monatlichen Management-Berichts',
          status: 'COMPLETED',
          priority: 'HIGH',
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          processedAt: new Date(Date.now() - 7.5 * 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
          actualDuration: 1800, // 30 Minuten
          result: 'Bericht erstellt: 15 Projekte, 45 Aufgaben, 2.340 Stunden erfasst',
          parameters: {
            month: new Date().getMonth(),
            year: new Date().getFullYear(),
            format: 'PDF',
            includeCharts: true
          }
        }
      ]

      const mockStats: ARPStats = {
        total: mockTasks.length,
        pending: mockTasks.filter(t => t.status === 'PENDING').length,
        processing: mockTasks.filter(t => t.status === 'PROCESSING').length,
        completed: mockTasks.filter(t => t.status === 'COMPLETED').length,
        failed: mockTasks.filter(t => t.status === 'FAILED').length,
        averageProcessingTime: 1245, // Sekunden
        successRate: 85.7, // Prozent
        tasksToday: 4,
        tasksThisWeek: 23
      }

      // Filter anwenden
      let filteredTasks = mockTasks
      if (filterStatus !== 'ALL') {
        filteredTasks = filteredTasks.filter(task => task.status === filterStatus)
      }
      if (filterType !== 'ALL') {
        filteredTasks = filteredTasks.filter(task => task.type === filterType)
      }

      setTasks(filteredTasks)
      setStats(mockStats)

    } catch (err) {
      console.error('Fehler beim Laden der ARP-Daten:', err)
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadARPData()
    setRefreshing(false)
  }

  const executeTask = async (taskId: string) => {
    try {
      // Simuliere Task-Ausführung
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'PROCESSING' as const, processedAt: new Date().toISOString(), progress: 0 }
          : task
      ))

      // Simuliere Fortschritt
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 20
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)
          
          // Task als abgeschlossen markieren
          setTasks(prev => prev.map(task => 
            task.id === taskId 
              ? { 
                  ...task, 
                  status: 'COMPLETED' as const, 
                  completedAt: new Date().toISOString(),
                  progress: 100,
                  result: 'Erfolgreich ausgeführt'
                }
              : task
          ))
        } else {
          setTasks(prev => prev.map(task => 
            task.id === taskId 
              ? { ...task, progress }
              : task
          ))
        }
      }, 500)

    } catch (err) {
      console.error('Fehler beim Ausführen der Aufgabe:', err)
      setError(handleApiError(err))
    }
  }

  const cancelTask = async (taskId: string) => {
    try {
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'CANCELLED' as const }
          : task
      ))
    } catch (err) {
      console.error('Fehler beim Abbrechen der Aufgabe:', err)
      setError(handleApiError(err))
    }
  }

  // Hilfsfunktionen
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'PROCESSING': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'PENDING': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'SCHEDULED': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
      case 'FAILED': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'CANCELLED': return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return CheckCircleIcon
      case 'PROCESSING': return CogIcon
      case 'PENDING': return ClockIcon
      case 'SCHEDULED': return CalendarIcon
      case 'FAILED': return XCircleIcon
      case 'CANCELLED': return StopIcon
      default: return ClockIcon
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
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
              <div className="flex items-center space-x-3 mb-2">
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Admin Center
                  </Button>
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                ARP - Automated Request Processing
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Automatisierte Prozesse und System-Aufgaben verwalten
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
                      {stats.tasksThisWeek} diese Woche
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
                      Ausstehend
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.pending}
                    </p>
                    <p className="text-xs text-yellow-600">
                      {stats.processing} in Bearbeitung
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
                      Erfolgreich
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.completed}
                    </p>
                    <p className="text-xs text-green-600">
                      {stats.successRate}% Erfolgsrate
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CogIcon className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Ø Dauer
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatDuration(stats.averageProcessingTime)}
                    </p>
                    <p className="text-xs text-purple-600">
                      Durchschnitt
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="ALL">Alle</option>
                <option value="PENDING">Ausstehend</option>
                <option value="PROCESSING">In Bearbeitung</option>
                <option value="COMPLETED">Abgeschlossen</option>
                <option value="FAILED">Fehlgeschlagen</option>
                <option value="SCHEDULED">Geplant</option>
                <option value="CANCELLED">Abgebrochen</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Typ
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="ALL">Alle</option>
                <option value="USER_REGISTRATION">Benutzer-Registrierung</option>
                <option value="PROJECT_APPROVAL">Projekt-Genehmigung</option>
                <option value="SYSTEM_MAINTENANCE">System-Wartung</option>
                <option value="DATA_CLEANUP">Daten-Bereinigung</option>
                <option value="BACKUP">Backup</option>
                <option value="EMAIL_NOTIFICATIONS">E-Mail-Benachrichtigungen</option>
                <option value="REPORT_GENERATION">Bericht-Erstellung</option>
              </select>
            </div>
          </div>
        </div>

        {/* Task-Liste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CogIcon className="h-5 w-5 mr-2" />
              ARP-Aufgaben ({tasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => {
                const StatusIcon = getStatusIcon(task.status)
                return (
                  <div key={task.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <StatusIcon className="h-6 w-6 text-gray-400 mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                              {task.status}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
                              {task.type.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                            {task.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {task.description}
                          </p>
                          
                          {/* Progress Bar für Processing */}
                          {task.status === 'PROCESSING' && task.progress !== undefined && (
                            <div className="mb-2">
                              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                <span>Fortschritt</span>
                                <span>{Math.round(task.progress)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${task.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Ergebnis oder Fehler */}
                          {task.result && (
                            <div className="mb-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-sm text-green-800 dark:text-green-200">
                              <strong>Ergebnis:</strong> {task.result}
                            </div>
                          )}
                          
                          {task.error && (
                            <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-800 dark:text-red-200">
                              <strong>Fehler:</strong> {task.error}
                            </div>
                          )}
                          
                          {/* Zeitinformationen */}
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <span>
                              Erstellt: {new Date(task.createdAt).toLocaleString('de-DE')}
                            </span>
                            {task.scheduledFor && (
                              <span>
                                Geplant: {new Date(task.scheduledFor).toLocaleString('de-DE')}
                              </span>
                            )}
                            {task.estimatedDuration && (
                              <span>
                                Geschätzt: {formatDuration(task.estimatedDuration)}
                              </span>
                            )}
                            {task.actualDuration && (
                              <span>
                                Dauer: {formatDuration(task.actualDuration)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Aktionen */}
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedTask(task)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        
                        {task.status === 'PENDING' && (
                          <Button
                            size="sm"
                            onClick={() => executeTask(task.id)}
                          >
                            <PlayIcon className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {task.status === 'PROCESSING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => cancelTask(task.id)}
                          >
                            <StopIcon className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {task.status === 'FAILED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => executeTask(task.id)}
                          >
                            <ArrowPathIcon className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {tasks.length === 0 && (
                <div className="text-center py-8">
                  <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Keine ARP-Aufgaben gefunden für die aktuellen Filter.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Task Detail Modal */}
        {selectedTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    ARP-Aufgabe Details
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedTask(null)}
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Titel
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedTask.title}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Beschreibung
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedTask.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTask.status)}`}>
                        {selectedTask.status}
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
                  </div>
                  
                  {selectedTask.parameters && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Parameter
                      </label>
                      <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm overflow-x-auto">
                        {JSON.stringify(selectedTask.parameters, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default withAuth(ARPCenter)
