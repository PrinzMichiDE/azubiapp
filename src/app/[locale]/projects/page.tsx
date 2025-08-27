'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { 
  PlusIcon, 
  FilterIcon, 
  SearchIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Projekt-Interface
interface Project {
  id: string
  name: string
  description: string
  status: string
  priority: string
  startDate: string
  endDate: string
  budget: number
  clientName: string
  progress: number
  members: number
  tasks: number
  timeEntries: number
}

// Projekte-Seite
export default function ProjectsPage() {
  const t = useTranslations('projects')
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  // Mock-Daten laden (später durch echte API-Aufrufe ersetzen)
  useEffect(() => {
    const loadProjects = async () => {
      try {
        // Simuliere API-Aufruf
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setProjects([
          {
            id: '1',
            name: 'Website-Redesign',
            description: 'Komplettes Redesign der Unternehmenswebsite mit modernem Design und verbesserter Benutzerfreundlichkeit.',
            status: 'ACTIVE',
            priority: 'HIGH',
            startDate: '2024-01-15',
            endDate: '2024-03-15',
            budget: 15000,
            clientName: 'TechCorp GmbH',
            progress: 75,
            members: 4,
            tasks: 12,
            timeEntries: 45,
          },
          {
            id: '2',
            name: 'Mobile App Entwicklung',
            description: 'Entwicklung einer iOS und Android App für das Kundenmanagement-System.',
            status: 'ACTIVE',
            priority: 'MEDIUM',
            startDate: '2024-02-01',
            endDate: '2024-05-01',
            budget: 25000,
            clientName: 'Innovate Solutions',
            progress: 45,
            members: 6,
            tasks: 18,
            timeEntries: 67,
          },
          {
            id: '3',
            name: 'Datenbank-Migration',
            description: 'Migration der bestehenden Datenbank auf eine moderne Cloud-Lösung.',
            status: 'ON_HOLD',
            priority: 'LOW',
            startDate: '2024-01-01',
            endDate: '2024-02-28',
            budget: 8000,
            clientName: 'DataFlow Inc.',
            progress: 20,
            members: 2,
            tasks: 8,
            timeEntries: 23,
          },
          {
            id: '4',
            name: 'E-Commerce Plattform',
            description: 'Entwicklung einer vollständigen E-Commerce-Lösung mit Zahlungsabwicklung.',
            status: 'COMPLETED',
            priority: 'HIGH',
            startDate: '2023-10-01',
            endDate: '2024-01-15',
            budget: 30000,
            clientName: 'ShopDirect',
            progress: 100,
            members: 8,
            tasks: 25,
            timeEntries: 120,
          },
        ])
      } catch (error) {
        console.error('Fehler beim Laden der Projekte:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  // Gefilterte Projekte
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.clientName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || project.status === statusFilter
    const matchesPriority = !priorityFilter || project.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {t('projects')}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Verwalten Sie alle Ihre Projekte an einem Ort
              </p>
            </div>
            <Button>
              <PlusIcon className="h-5 w-5 mr-2" />
              {t('newProject')}
            </Button>
          </div>
        </div>

        {/* Filter und Suche */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Suchfeld */}
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Projekte durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Status-Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="">Alle Status</option>
                <option value="ACTIVE">Aktiv</option>
                <option value="COMPLETED">Abgeschlossen</option>
                <option value="ON_HOLD">Pausiert</option>
                <option value="CANCELLED">Abgebrochen</option>
              </select>

              {/* Prioritäts-Filter */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="">Alle Prioritäten</option>
                <option value="LOW">Niedrig</option>
                <option value="MEDIUM">Mittel</option>
                <option value="HIGH">Hoch</option>
                <option value="URGENT">Dringend</option>
              </select>

              {/* Filter-Button */}
              <Button variant="outline" className="flex items-center justify-center">
                <FilterIcon className="h-5 w-5 mr-2" />
                Filter anwenden
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Projekte-Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {project.name}
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Status und Priorität */}
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                    {t(project.status.toLowerCase())}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(project.priority)}`}>
                    {t(project.priority.toLowerCase())}
                  </span>
                </div>

                {/* Projekt-Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    <span>{new Date(project.startDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <UserGroupIcon className="h-4 w-4 mr-2" />
                    <span>{project.members} Mitglieder</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    <span>{project.tasks} Aufgaben</span>
                  </div>
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    <span>{project.timeEntries} Zeiterfassungen</span>
                  </div>
                </div>

                {/* Fortschritt */}
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Fortschritt</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Budget und Kunde */}
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium">€{project.budget.toLocaleString()}</span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {project.clientName}
                  </div>
                </div>

                {/* Aktionen */}
                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Bearbeiten
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Keine Projekte gefunden */}
        {filteredProjects.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Keine Projekte gefunden
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Versuchen Sie, Ihre Suchkriterien zu ändern oder erstellen Sie ein neues Projekt.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
