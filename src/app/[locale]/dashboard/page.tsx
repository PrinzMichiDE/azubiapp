'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  ChartBarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  PlusIcon,
  CalendarIcon,
  UserGroupIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// Dashboard-Statistiken
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

// Aktuelle Projekte
interface Project {
  id: string
  name: string
  status: string
  priority: string
  progress: number
  dueDate: string
  members: number
}

// Dashboard-Seite
export default function DashboardPage() {
  const t = useTranslations('Dashboard')
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

  // Mock-Daten laden (später durch echte API-Aufrufe ersetzen)
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Simuliere API-Aufruf
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setStats({
          totalProjects: 12,
          activeProjects: 8,
          completedProjects: 4,
          totalTasks: 45,
          completedTasks: 32,
          pendingTasks: 13,
          totalHours: 156.5,
          thisWeekHours: 32.5,
        })

        setRecentProjects([
          {
            id: '1',
            name: 'Website-Redesign',
            status: 'ACTIVE',
            priority: 'HIGH',
            progress: 75,
            dueDate: '2024-02-15',
            members: 4,
          },
          {
            id: '2',
            name: 'Mobile App Entwicklung',
            status: 'ACTIVE',
            priority: 'MEDIUM',
            progress: 45,
            dueDate: '2024-03-01',
            members: 6,
          },
          {
            id: '3',
            name: 'Datenbank-Migration',
            status: 'ON_HOLD',
            priority: 'LOW',
            progress: 20,
            dueDate: '2024-02-28',
            members: 2,
          },
        ])
      } catch (error) {
        console.error('Fehler beim Laden der Dashboard-Daten:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Status-Farbe
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100'
      case 'COMPLETED': return 'text-blue-600 bg-blue-100'
      case 'ON_HOLD': return 'text-yellow-600 bg-yellow-100'
      case 'CANCELLED': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Prioritäts-Farbe
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-100'
      case 'HIGH': return 'text-orange-600 bg-orange-100'
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100'
      case 'LOW': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('subtitle')}
          </p>
        </div>

        {/* Statistiken */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('stats.totalProjects')}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.totalProjects}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('stats.activeProjects')}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.activeProjects}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <ClockIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('stats.totalHours')}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.totalHours}h
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <ExclamationTriangleIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {t('stats.pendingTasks')}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.pendingTasks}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Aktuelle Projekte */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('recentProjects.title')}
              </h2>
              <Button size="sm" variant="outline">
                <PlusIcon className="h-4 w-4 mr-2" />
                {t('recentProjects.addNew')}
              </Button>
            </div>
            
            <div className="space-y-4">
              {recentProjects.map((project) => (
                <div key={project.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {project.name}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                        {t(`projectStatus.${project.status}`)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}>
                        {t(`priority.${project.priority}`)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        {project.members}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {new Date(project.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('quickActions.title')}
              </h2>
            </div>
            
            <div className="space-y-4">
              <Button className="w-full justify-start" variant="outline">
                <ClockIcon className="h-5 w-5 mr-3" />
                {t('quickActions.startTimer')}
              </Button>
              
              <Button className="w-full justify-start" variant="outline">
                <PlusIcon className="h-5 w-5 mr-3" />
                {t('quickActions.createTask')}
              </Button>
              
              <Button className="w-full justify-start" variant="outline">
                <ChartBarIcon className="h-5 w-5 mr-3" />
                {t('quickActions.viewReports')}
              </Button>
              
              <Button className="w-full justify-start" variant="outline">
                <UserGroupIcon className="h-5 w-5 mr-3" />
                {t('quickActions.manageTeam')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
