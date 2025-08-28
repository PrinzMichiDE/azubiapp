'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth, withAuth } from '@/contexts/AuthContext'
import { taskAPI, projectAPI, handleApiError } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  ArrowPathIcon,
  FunnelIcon,
  CheckCircleIcon,
  FolderIcon
} from '@heroicons/react/24/outline'

interface CalendarEvent {
  id: string
  title: string
  type: 'TASK' | 'PROJECT' | 'MEETING' | 'DEADLINE'
  date: string
  startTime?: string
  endTime?: string
  isAllDay: boolean
  status: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  projectId?: string
  projectName?: string
  description?: string
  isOverdue?: boolean
}

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  events: CalendarEvent[]
}

function CalendarPage() {
  const t = useTranslations()
  const { user } = useAuth()
  
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  
  // Filter
  const [filterType, setFilterType] = useState<string>('ALL')
  const [filterProject, setFilterProject] = useState<string>('ALL')
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [currentDate, filterType, filterProject])

  useEffect(() => {
    generateCalendarDays()
  }, [currentDate, events])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Lade Tasks und Projekte
      const [tasksResponse, projectsResponse] = await Promise.all([
        taskAPI.getAll({ 
          limit: 100,
          ...(filterProject !== 'ALL' && { projectId: filterProject })
        }),
        projectAPI.getAll({ limit: 100 })
      ])

      setProjects(projectsResponse.projects || [])

      // Konvertiere Tasks zu Kalender-Events
      const taskEvents: CalendarEvent[] = (tasksResponse.tasks || [])
        .filter((task: any) => task.dueDate)
        .map((task: any) => ({
          id: task.id,
          title: task.title,
          type: 'TASK' as const,
          date: task.dueDate,
          isAllDay: true,
          status: task.status,
          priority: task.priority,
          projectId: task.projectId,
          projectName: task.project?.name,
          description: task.description,
          isOverdue: new Date(task.dueDate) < new Date() && task.status !== 'DONE'
        }))

      // Konvertiere Projekte zu Deadline-Events
      const projectEvents: CalendarEvent[] = (projectsResponse.projects || [])
        .filter((project: any) => project.endDate)
        .map((project: any) => ({
          id: `project-${project.id}`,
          title: `${project.name} (Deadline)`,
          type: 'PROJECT' as const,
          date: project.endDate,
          isAllDay: true,
          status: project.status,
          priority: project.priority,
          projectId: project.id,
          projectName: project.name,
          description: project.description,
          isOverdue: new Date(project.endDate) < new Date() && project.status === 'ACTIVE'
        }))

      // Mock-Meeting Events hinzufügen
      const mockMeetings: CalendarEvent[] = [
        {
          id: 'meeting-1',
          title: 'Team Standup',
          type: 'MEETING',
          date: new Date().toISOString().split('T')[0],
          startTime: '09:00',
          endTime: '09:30',
          isAllDay: false,
          status: 'SCHEDULED',
          priority: 'MEDIUM',
          description: 'Tägliches Team-Meeting'
        },
        {
          id: 'meeting-2',
          title: 'Sprint Planning',
          type: 'MEETING',
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          startTime: '14:00',
          endTime: '16:00',
          isAllDay: false,
          status: 'SCHEDULED',
          priority: 'HIGH',
          description: 'Planung für den nächsten Sprint'
        }
      ]

      let allEvents = [...taskEvents, ...projectEvents, ...mockMeetings]

      // Filter anwenden
      if (filterType !== 'ALL') {
        allEvents = allEvents.filter(event => event.type === filterType)
      }

      setEvents(allEvents)

    } catch (err) {
      console.error('Fehler beim Laden der Kalender-Daten:', err)
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const firstDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1
    
    const days: CalendarDay[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Vorherige Monatstage
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      const dateStr = date.toISOString().split('T')[0]
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        events: events.filter(event => event.date === dateStr)
      })
    }

    // Aktuelle Monatstage
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toISOString().split('T')[0]
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        events: events.filter(event => event.date === dateStr)
      })
    }

    // Nächste Monatstage
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      const dateStr = date.toISOString().split('T')[0]
      days.push({
        date,
        isCurrentMonth: false,
        isToday: date.getTime() === today.getTime(),
        events: events.filter(event => event.date === dateStr)
      })
    }

    setCalendarDays(days)
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'TASK': return 'bg-blue-500 text-white'
      case 'PROJECT': return 'bg-purple-500 text-white'
      case 'MEETING': return 'bg-green-500 text-white'
      case 'DEADLINE': return 'bg-red-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'TASK': return CheckCircleIcon
      case 'PROJECT': return FolderIcon
      case 'MEETING': return ClockIcon
      case 'DEADLINE': return ExclamationTriangleIcon
      default: return CalendarIcon
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'border-l-4 border-red-500'
      case 'HIGH': return 'border-l-4 border-orange-500'
      case 'MEDIUM': return 'border-l-4 border-blue-500'
      case 'LOW': return 'border-l-4 border-green-500'
      default: return 'border-l-4 border-gray-500'
    }
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5)
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
                Kalender
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Übersicht über alle Ihre Termine, Deadlines und Aufgaben
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
                Termin hinzufügen
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Filter */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FunnelIcon className="h-5 w-5 mr-2" />
                  Filter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Typ
                    </label>
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="ALL">Alle Typen</option>
                      <option value="TASK">Aufgaben</option>
                      <option value="PROJECT">Projekte</option>
                      <option value="MEETING">Meetings</option>
                      <option value="DEADLINE">Deadlines</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Projekt
                    </label>
                    <select
                      value={filterProject}
                      onChange={(e) => setFilterProject(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="ALL">Alle Projekte</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kommende Events */}
            <Card>
              <CardHeader>
                <CardTitle>Kommende Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events
                    .filter(event => new Date(event.date) >= new Date())
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .slice(0, 5)
                    .map((event) => {
                      const Icon = getEventTypeIcon(event.type)
                      return (
                        <div
                          key={event.id}
                          className={`p-3 rounded-lg cursor-pointer hover:shadow-md transition-shadow ${getPriorityColor(event.priority)} ${
                            event.isOverdue ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800'
                          }`}
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="flex items-start space-x-2">
                            <Icon className="h-4 w-4 text-gray-500 mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {event.title}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(event.date).toLocaleDateString('de-DE')}
                                {!event.isAllDay && event.startTime && ` ${formatTime(event.startTime)}`}
                              </p>
                              {event.projectName && (
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                  {event.projectName}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  
                  {events.filter(event => new Date(event.date) >= new Date()).length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      Keine kommenden Events
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kalender */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth('prev')}
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </Button>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatMonthYear(currentDate)}
                      </h2>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigateMonth('next')}
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      Heute
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex border border-gray-300 dark:border-gray-600 rounded-md">
                      <button
                        onClick={() => setViewMode('month')}
                        className={`px-3 py-1 text-sm ${
                          viewMode === 'month'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Monat
                      </button>
                      <button
                        onClick={() => setViewMode('week')}
                        className={`px-3 py-1 text-sm ${
                          viewMode === 'week'
                            ? 'bg-primary-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Woche
                      </button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Kalender-Grid */}
                <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {/* Wochentage Header */}
                  {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
                    <div key={day} className="bg-gray-50 dark:bg-gray-800 p-2 text-center">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {day}
                      </span>
                    </div>
                  ))}

                  {/* Kalender Tage */}
                  {calendarDays.map((day, index) => (
                    <div
                      key={index}
                      className={`min-h-24 p-1 bg-white dark:bg-gray-900 ${
                        !day.isCurrentMonth ? 'opacity-40' : ''
                      } ${
                        day.isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        day.isToday 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : day.isCurrentMonth 
                            ? 'text-gray-900 dark:text-white' 
                            : 'text-gray-400 dark:text-gray-600'
                      }`}>
                        {day.date.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {day.events.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getEventTypeColor(event.type)} ${
                              event.isOverdue ? 'animate-pulse' : ''
                            }`}
                            onClick={() => setSelectedEvent(event)}
                            title={event.title}
                          >
                            <div className="truncate">
                              {event.title}
                            </div>
                            {!event.isAllDay && event.startTime && (
                              <div className="truncate opacity-75">
                                {formatTime(event.startTime)}
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {day.events.length > 2 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            +{day.events.length - 2} weitere
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Event Details
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedEvent(null)}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedEvent.title}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${getEventTypeColor(selectedEvent.type)}`}>
                        {selectedEvent.type}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedEvent.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                        selectedEvent.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        selectedEvent.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {selectedEvent.priority}
                      </span>
                      {selectedEvent.isOverdue && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          Überfällig
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="block text-gray-500 dark:text-gray-400 mb-1">Datum</label>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(selectedEvent.date).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                    
                    {!selectedEvent.isAllDay && selectedEvent.startTime && (
                      <div>
                        <label className="block text-gray-500 dark:text-gray-400 mb-1">Zeit</label>
                        <p className="text-gray-900 dark:text-white">
                          {formatTime(selectedEvent.startTime)}
                          {selectedEvent.endTime && ` - ${formatTime(selectedEvent.endTime)}`}
                        </p>
                      </div>
                    )}
                    
                    {selectedEvent.projectName && (
                      <div>
                        <label className="block text-gray-500 dark:text-gray-400 mb-1">Projekt</label>
                        <p className="text-gray-900 dark:text-white">{selectedEvent.projectName}</p>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-gray-500 dark:text-gray-400 mb-1">Status</label>
                      <p className="text-gray-900 dark:text-white">{selectedEvent.status}</p>
                    </div>
                  </div>
                  
                  {selectedEvent.description && (
                    <div>
                      <label className="block text-gray-500 dark:text-gray-400 mb-1">Beschreibung</label>
                      <p className="text-gray-900 dark:text-white">{selectedEvent.description}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-3">
                    {selectedEvent.type === 'TASK' && (
                      <Button
                        onClick={() => {
                          window.location.href = `/tasks/${selectedEvent.id}`
                        }}
                        variant="outline"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        Aufgabe anzeigen
                      </Button>
                    )}
                    {selectedEvent.type === 'PROJECT' && (
                      <Button
                        onClick={() => {
                          window.location.href = `/projects/${selectedEvent.projectId}`
                        }}
                        variant="outline"
                      >
                        <EyeIcon className="h-4 w-4 mr-2" />
                        Projekt anzeigen
                      </Button>
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

export default withAuth(CalendarPage)
