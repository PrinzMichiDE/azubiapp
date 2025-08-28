'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth, withAuth } from '@/contexts/AuthContext'
import { dashboardAPI, projectAPI, taskAPI, timeAPI, handleApiError } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ChartBarIcon,
  DocumentChartBarIcon,
  CalendarIcon,
  ClockIcon,
  FolderIcon,
  CheckCircleIcon,
  UserIcon,
  CurrencyDollarIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

interface ReportData {
  overview: {
    totalProjects: number
    activeProjects: number
    completedProjects: number
    totalTasks: number
    completedTasks: number
    totalHours: number
    billableHours: number
    revenue: number
  }
  projectPerformance: Array<{
    id: string
    name: string
    progress: number
    hoursSpent: number
    estimatedHours: number
    efficiency: number
    status: string
  }>
  timeTracking: {
    thisWeek: number
    lastWeek: number
    thisMonth: number
    lastMonth: number
    dailyAverage: number
    weeklyTrend: number[]
  }
  teamProductivity: Array<{
    id: string
    name: string
    tasksCompleted: number
    hoursLogged: number
    efficiency: number
    projects: number
  }>
}

function ReportsPage() {
  const t = useTranslations()
  const { user } = useAuth()
  
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [selectedReport, setSelectedReport] = useState<'overview' | 'projects' | 'time' | 'team'>('overview')

  useEffect(() => {
    loadReportData()
  }, [selectedPeriod])

  const loadReportData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Simulierte Report-Daten
      const mockReportData: ReportData = {
        overview: {
          totalProjects: 12,
          activeProjects: 8,
          completedProjects: 4,
          totalTasks: 156,
          completedTasks: 98,
          totalHours: 2340,
          billableHours: 1890,
          revenue: 94500
        },
        projectPerformance: [
          { id: '1', name: 'Website Redesign', progress: 85, hoursSpent: 180, estimatedHours: 200, efficiency: 90, status: 'ACTIVE' },
          { id: '2', name: 'Mobile App', progress: 65, hoursSpent: 320, estimatedHours: 400, efficiency: 80, status: 'ACTIVE' },
          { id: '3', name: 'E-Commerce Platform', progress: 100, hoursSpent: 450, estimatedHours: 420, efficiency: 107, status: 'COMPLETED' },
          { id: '4', name: 'Brand Identity', progress: 40, hoursSpent: 120, estimatedHours: 250, efficiency: 48, status: 'ACTIVE' }
        ],
        timeTracking: {
          thisWeek: 42,
          lastWeek: 38,
          thisMonth: 180,
          lastMonth: 165,
          dailyAverage: 7.2,
          weeklyTrend: [35, 42, 38, 45, 42, 40, 38]
        },
        teamProductivity: [
          { id: '1', name: 'Anna Schmidt', tasksCompleted: 24, hoursLogged: 160, efficiency: 95, projects: 3 },
          { id: '2', name: 'Tom Weber', tasksCompleted: 18, hoursLogged: 140, efficiency: 88, projects: 2 },
          { id: '3', name: 'Lisa Müller', tasksCompleted: 21, hoursLogged: 135, efficiency: 92, projects: 4 },
          { id: '4', name: 'Max Mustermann', tasksCompleted: 15, hoursLogged: 120, efficiency: 78, projects: 2 }
        ]
      }

      setReportData(mockReportData)

    } catch (err) {
      console.error('Fehler beim Laden der Report-Daten:', err)
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadReportData()
    setRefreshing(false)
  }

  const exportReport = () => {
    // Mock Export-Funktionalität
    alert('Export-Funktion würde hier implementiert werden')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return 'text-green-600 bg-green-100 dark:bg-green-900/20'
    if (efficiency >= 70) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
    return 'text-red-600 bg-red-100 dark:bg-red-900/20'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Report-Daten konnten nicht geladen werden.</p>
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Reports & Analytics
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Detaillierte Einblicke in Ihre Projektleistung und Produktivität
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="week">Diese Woche</option>
                <option value="month">Dieser Monat</option>
                <option value="quarter">Dieses Quartal</option>
                <option value="year">Dieses Jahr</option>
              </select>
              <Button
                onClick={refreshData}
                disabled={refreshing}
                variant="outline"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Aktualisieren
              </Button>
              <Button onClick={exportReport}>
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Exportieren
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

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {[
              { key: 'overview', name: 'Übersicht', icon: ChartBarIcon },
              { key: 'projects', name: 'Projekte', icon: FolderIcon },
              { key: 'time', name: 'Zeiterfassung', icon: ClockIcon },
              { key: 'team', name: 'Team', icon: UserIcon },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setSelectedReport(tab.key as any)}
                  className={`flex items-center px-1 py-2 text-sm font-medium border-b-2 ${
                    selectedReport === tab.key
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Übersicht */}
        {selectedReport === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <FolderIcon className="h-8 w-8 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Projekte
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {reportData.overview.totalProjects}
                      </p>
                      <p className="text-xs text-blue-600">
                        {reportData.overview.activeProjects} aktiv
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
                        {reportData.overview.completedTasks}/{reportData.overview.totalTasks}
                      </p>
                      <p className="text-xs text-green-600">
                        {Math.round((reportData.overview.completedTasks / reportData.overview.totalTasks) * 100)}% abgeschlossen
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
                        Stunden
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {reportData.overview.totalHours}
                      </p>
                      <p className="text-xs text-purple-600">
                        {reportData.overview.billableHours} abrechenbar
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-8 w-8 text-yellow-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Umsatz
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(reportData.overview.revenue)}
                      </p>
                      <p className="text-xs text-yellow-600">
                        Dieser {selectedPeriod === 'month' ? 'Monat' : 'Zeitraum'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Produktivitätstrend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Diagramm würde hier implementiert werden (Chart.js/Recharts)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Projekte */}
        {selectedReport === 'projects' && (
          <Card>
            <CardHeader>
              <CardTitle>Projekt-Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Projekt</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Fortschritt</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Stunden</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Effizienz</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.projectPerformance.map((project) => (
                      <tr key={project.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900 dark:text-white">{project.name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${project.progress}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400">{project.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <div className="text-gray-900 dark:text-white">{project.hoursSpent}h / {project.estimatedHours}h</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getEfficiencyColor(project.efficiency)}`}>
                            {project.efficiency}%
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {project.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Zeiterfassung */}
        {selectedReport === 'time' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {reportData.timeTracking.thisWeek}h
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Diese Woche</div>
                    <div className={`text-xs mt-1 ${
                      reportData.timeTracking.thisWeek > reportData.timeTracking.lastWeek 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {reportData.timeTracking.thisWeek > reportData.timeTracking.lastWeek ? '+' : ''}
                      {reportData.timeTracking.thisWeek - reportData.timeTracking.lastWeek}h vs. letzte Woche
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {reportData.timeTracking.thisMonth}h
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Dieser Monat</div>
                    <div className={`text-xs mt-1 ${
                      reportData.timeTracking.thisMonth > reportData.timeTracking.lastMonth 
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {reportData.timeTracking.thisMonth > reportData.timeTracking.lastMonth ? '+' : ''}
                      {reportData.timeTracking.thisMonth - reportData.timeTracking.lastMonth}h vs. letzter Monat
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {reportData.timeTracking.dailyAverage}h
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Täglicher Durchschnitt</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {reportData.overview.billableHours}h
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Abrechenbare Stunden</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {Math.round((reportData.overview.billableHours / reportData.overview.totalHours) * 100)}% von Gesamt
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Wöchentlicher Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Zeiterfassungs-Diagramm würde hier implementiert werden
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Team */}
        {selectedReport === 'team' && (
          <Card>
            <CardHeader>
              <CardTitle>Team-Produktivität</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Team-Mitglied</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Aufgaben</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Stunden</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Projekte</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Effizienz</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.teamProductivity.map((member) => (
                      <tr key={member.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900 dark:text-white">{member.name}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-900 dark:text-white">{member.tasksCompleted}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-900 dark:text-white">{member.hoursLogged}h</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-gray-900 dark:text-white">{member.projects}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getEfficiencyColor(member.efficiency)}`}>
                            {member.efficiency}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default withAuth(ReportsPage)
