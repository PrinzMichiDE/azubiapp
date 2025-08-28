'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { 
  PlayIcon, 
  PauseIcon, 
  StopIcon, 
  PlusIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  RectangleStackIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Zeiterfassung-Interface
interface TimeEntry {
  id: string
  projectName: string
  taskName: string
  description: string
  startTime: Date
  endTime?: Date
  duration: number // in Sekunden
  isBillable: boolean
}

// Zeiterfassung-Seite
export default function TimeTrackingPage() {
  const t = useTranslations('timeTracking')
  const [isRunning, setIsRunning] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedTask, setSelectedTask] = useState('')
  const [description, setDescription] = useState('')
  const [isBillable, setIsBillable] = useState(false)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<Date | null>(null)

  // Timer starten
  const startTimer = () => {
    if (!selectedProject || !selectedTask) {
      alert('Bitte wählen Sie ein Projekt und eine Aufgabe aus.')
      return
    }

    setIsRunning(true)
    startTimeRef.current = new Date()
    setCurrentTime(0)
    
    intervalRef.current = setInterval(() => {
      setCurrentTime(prev => prev + 1)
    }, 1000)
  }

  // Timer pausieren
  const pauseTimer = () => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  // Timer stoppen und Zeiterfassung speichern
  const stopTimer = () => {
    if (!startTimeRef.current) return

    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - startTimeRef.current.getTime()) / 1000)

    const newTimeEntry: TimeEntry = {
      id: Date.now().toString(),
      projectName: selectedProject,
      taskName: selectedTask,
      description: description || 'Keine Beschreibung',
      startTime: startTimeRef.current,
      endTime: endTime,
      duration: duration,
      isBillable: isBillable,
    }

    setTimeEntries(prev => [newTimeEntry, ...prev])
    
    // Reset
    setCurrentTime(0)
    setDescription('')
    setSelectedProject('')
    setSelectedTask('')
    setIsBillable(false)
    startTimeRef.current = null
  }

  // Zeit formatieren
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Gesamtzeit berechnen
  const totalTime = timeEntries.reduce((sum, entry) => sum + entry.duration, 0)

  // Mock-Projekte (später durch API ersetzen)
  const projects = [
    { id: '1', name: 'Website-Redesign' },
    { id: '2', name: 'Mobile App Entwicklung' },
    { id: '3', name: 'Datenbank-Migration' },
  ]

  // Mock-Aufgaben (später durch API ersetzen)
  const tasks = [
    { id: '1', name: 'Design-Entwicklung' },
    { id: '2', name: 'Frontend-Implementierung' },
    { id: '3', name: 'Backend-API' },
    { id: '4', name: 'Testing' },
  ]

  // Cleanup bei Unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Zeiterfassung
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Erfassen Sie Ihre Arbeitszeit für Projekte und Aufgaben
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Timer-Karte */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ClockIcon className="h-6 w-6 mr-2" />
                  Aktiver Timer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Projekt- und Aufgabenauswahl */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Projekt
                    </label>
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      disabled={isRunning}
                    >
                      <option value="">Projekt auswählen</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.name}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Aufgabe
                    </label>
                    <select
                      value={selectedTask}
                      onChange={(e) => setSelectedTask(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      disabled={isRunning}
                    >
                      <option value="">Aufgabe auswählen</option>
                      {tasks.map(task => (
                        <option key={task.id} value={task.name}>
                          {task.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Beschreibung */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Beschreibung
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Beschreiben Sie Ihre Arbeit..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    rows={3}
                    disabled={isRunning}
                  />
                </div>

                {/* Abrechenbar Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="billable"
                    checked={isBillable}
                    onChange={(e) => setIsBillable(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    disabled={isRunning}
                  />
                  <label htmlFor="billable" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Abrechenbar
                  </label>
                </div>

                {/* Timer-Anzeige */}
                <div className="text-center">
                  <div className="text-6xl font-mono text-primary-600 dark:text-primary-400 mb-4">
                    {formatTime(currentTime)}
                  </div>
                  
                  {/* Timer-Buttons */}
                  <div className="flex justify-center space-x-4">
                    {!isRunning ? (
                      <Button onClick={startTimer} size="lg" className="px-8">
                        <PlayIcon className="h-5 w-5 mr-2" />
                        Start
                      </Button>
                    ) : (
                      <>
                        <Button onClick={pauseTimer} variant="outline" size="lg" className="px-8">
                          <PauseIcon className="h-5 w-5 mr-2" />
                          Pause
                        </Button>
                        <Button onClick={stopTimer} variant="destructive" size="lg" className="px-8">
                          <StopIcon className="h-5 w-5 mr-2" />
                          Stopp
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistiken */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Heute</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {formatTime(totalTime)}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Gesamtarbeitszeit
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Diese Woche</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  32:15:30
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Wöchentliche Arbeitszeit
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schnellstart</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <RectangleStackIcon className="h-4 w-4 mr-2" />
                  Website-Redesign
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <RectangleStackIcon className="h-4 w-4 mr-2" />
                  Mobile App
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Neues Projekt
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Zeiterfassungs-Historie */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Zeiterfassungs-Historie</CardTitle>
            </CardHeader>
            <CardContent>
              {timeEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Noch keine Zeiterfassungen vorhanden
                </div>
              ) : (
                <div className="space-y-4">
                  {timeEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <RectangleStackIcon className="h-4 w-4 mr-1" />
                            {entry.projectName}
                          </div>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <UserIcon className="h-4 w-4 mr-1" />
                            {entry.taskName}
                          </div>
                          {entry.isBillable && (
                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              Abrechenbar
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {entry.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>
                            {entry.startTime.toLocaleTimeString()} - {entry.endTime?.toLocaleTimeString()}
                          </span>
                          <span>
                            {entry.startTime.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-mono font-semibold text-primary-600 dark:text-primary-400">
                          {formatTime(entry.duration)}
                        </div>
                        <Button variant="ghost" size="sm" className="mt-2">
                          Bearbeiten
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
