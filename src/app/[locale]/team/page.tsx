'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth, withAuth } from '@/contexts/AuthContext'
import { userAPI, projectAPI, handleApiError } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  UsersIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ChartBarIcon,
  FolderIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  UserCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

interface TeamMember {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'TRAINEE'
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  
  stats: {
    projects: number
    tasks: number
    timeEntries: number
    hoursLogged: number
  }
  
  currentProjects: Array<{
    id: string
    name: string
    role: string
    progress: number
  }>
  
  skills?: string[]
  department?: string
  position?: string
  phoneNumber?: string
  birthDate?: string
}

interface TeamStats {
  totalMembers: number
  activeMembers: number
  departments: Array<{
    name: string
    count: number
  }>
  roles: Array<{
    role: string
    count: number
  }>
  recentJoins: number
}

function TeamPage() {
  const t = useTranslations()
  const { user } = useAuth()
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [stats, setStats] = useState<TeamStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  
  // Filter
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('ALL')
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    loadTeamData()
  }, [searchTerm, filterRole, filterDepartment])

  const loadTeamData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Mock Team-Daten (würde normalerweise von API kommen)
      const mockTeamMembers: TeamMember[] = [
        {
          id: '1',
          email: 'anna.schmidt@azubi.com',
          username: 'anna_schmidt',
          firstName: 'Anna',
          lastName: 'Schmidt',
          role: 'MANAGER',
          isActive: true,
          lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          createdAt: '2024-01-15T00:00:00.000Z',
          department: 'Development',
          position: 'Team Lead',
          phoneNumber: '+49 123 456789',
          skills: ['Project Management', 'React', 'TypeScript', 'Leadership'],
          stats: {
            projects: 5,
            tasks: 42,
            timeEntries: 156,
            hoursLogged: 234.5
          },
          currentProjects: [
            { id: '1', name: 'Website Redesign', role: 'Project Manager', progress: 85 },
            { id: '2', name: 'Mobile App', role: 'Tech Lead', progress: 65 }
          ]
        },
        {
          id: '2',
          email: 'tom.weber@azubi.com',
          username: 'tom_weber',
          firstName: 'Tom',
          lastName: 'Weber',
          role: 'USER',
          isActive: true,
          lastLoginAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          createdAt: '2024-01-20T00:00:00.000Z',
          department: 'Design',
          position: 'UI/UX Designer',
          phoneNumber: '+49 123 456790',
          skills: ['Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping'],
          stats: {
            projects: 3,
            tasks: 28,
            timeEntries: 98,
            hoursLogged: 187.2
          },
          currentProjects: [
            { id: '1', name: 'Website Redesign', role: 'Designer', progress: 85 },
            { id: '3', name: 'Brand Identity', role: 'Lead Designer', progress: 40 }
          ]
        },
        {
          id: '3',
          email: 'lisa.mueller@azubi.com',
          username: 'lisa_mueller',
          firstName: 'Lisa',
          lastName: 'Müller',
          role: 'USER',
          isActive: true,
          lastLoginAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          createdAt: '2024-02-01T00:00:00.000Z',
          department: 'Development',
          position: 'Frontend Developer',
          phoneNumber: '+49 123 456791',
          skills: ['Vue.js', 'JavaScript', 'CSS', 'HTML'],
          stats: {
            projects: 4,
            tasks: 35,
            timeEntries: 124,
            hoursLogged: 198.7
          },
          currentProjects: [
            { id: '2', name: 'Mobile App', role: 'Frontend Developer', progress: 65 },
            { id: '4', name: 'E-Commerce Platform', role: 'Developer', progress: 30 }
          ]
        },
        {
          id: '4',
          email: 'max.mustermann@azubi.com',
          username: 'max_mustermann',
          firstName: 'Max',
          lastName: 'Mustermann',
          role: 'TRAINEE',
          isActive: true,
          lastLoginAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          createdAt: '2024-02-15T00:00:00.000Z',
          department: 'Development',
          position: 'Trainee',
          phoneNumber: '+49 123 456792',
          skills: ['HTML', 'CSS', 'JavaScript', 'Learning'],
          stats: {
            projects: 1,
            tasks: 12,
            timeEntries: 45,
            hoursLogged: 67.5
          },
          currentProjects: [
            { id: '5', name: 'Training Project', role: 'Trainee', progress: 70 }
          ]
        }
      ]

      // Filter anwenden
      let filteredMembers = mockTeamMembers
      
      if (searchTerm) {
        filteredMembers = filteredMembers.filter(member => 
          member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.department?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      if (filterRole !== 'ALL') {
        filteredMembers = filteredMembers.filter(member => member.role === filterRole)
      }
      
      if (filterDepartment !== 'ALL') {
        filteredMembers = filteredMembers.filter(member => member.department === filterDepartment)
      }

      setTeamMembers(filteredMembers)

      // Statistiken berechnen
      const teamStats: TeamStats = {
        totalMembers: mockTeamMembers.length,
        activeMembers: mockTeamMembers.filter(m => m.isActive).length,
        departments: [
          { name: 'Development', count: mockTeamMembers.filter(m => m.department === 'Development').length },
          { name: 'Design', count: mockTeamMembers.filter(m => m.department === 'Design').length },
          { name: 'Management', count: mockTeamMembers.filter(m => m.department === 'Management').length }
        ],
        roles: [
          { role: 'ADMIN', count: mockTeamMembers.filter(m => m.role === 'ADMIN').length },
          { role: 'MANAGER', count: mockTeamMembers.filter(m => m.role === 'MANAGER').length },
          { role: 'USER', count: mockTeamMembers.filter(m => m.role === 'USER').length },
          { role: 'TRAINEE', count: mockTeamMembers.filter(m => m.role === 'TRAINEE').length }
        ],
        recentJoins: mockTeamMembers.filter(m => 
          new Date(m.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length
      }

      setStats(teamStats)

    } catch (err) {
      console.error('Fehler beim Laden der Team-Daten:', err)
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadTeamData()
    setRefreshing(false)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'MANAGER': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'USER': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'TRAINEE': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Gerade online'
    if (diffInMinutes < 60) return `vor ${diffInMinutes} Minuten`
    if (diffInMinutes < 1440) return `vor ${Math.floor(diffInMinutes / 60)} Stunden`
    return `vor ${Math.floor(diffInMinutes / 1440)} Tagen`
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
                Team-Übersicht
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Verwalten Sie Ihr Team und bleiben Sie über die Aktivitäten informiert
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
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Mitglied einladen
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
                  <UsersIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Team-Mitglieder
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.totalMembers}
                    </p>
                    <p className="text-xs text-blue-600">
                      {stats.activeMembers} aktiv
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Manager
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.roles.find(r => r.role === 'MANAGER')?.count || 0}
                    </p>
                    <p className="text-xs text-green-600">
                      Führungskräfte
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <UserCircleIcon className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Entwickler
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.departments.find(d => d.name === 'Development')?.count || 0}
                    </p>
                    <p className="text-xs text-purple-600">
                      Development Team
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <CalendarIcon className="h-8 w-8 text-orange-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Neue Mitglieder
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.recentJoins}
                    </p>
                    <p className="text-xs text-orange-600">
                      Letzte 30 Tage
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
                  placeholder="Team-Mitglieder suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Filter */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="ALL">Alle Rollen</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="USER">Benutzer</option>
              <option value="TRAINEE">Azubi</option>
            </select>

            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="ALL">Alle Abteilungen</option>
              <option value="Development">Development</option>
              <option value="Design">Design</option>
              <option value="Management">Management</option>
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
                Karten
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

        {/* Team-Mitglieder */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="text-center">
                    {/* Avatar */}
                    <div className="h-16 w-16 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.username} className="h-16 w-16 rounded-full" />
                      ) : (
                        <span className="text-xl font-bold text-gray-700 dark:text-gray-300">
                          {(member.firstName?.[0] || member.username[0]).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {member.firstName && member.lastName 
                        ? `${member.firstName} ${member.lastName}`
                        : member.username
                      }
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {member.position || member.role}
                    </p>
                    
                    <div className="flex justify-center mb-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(member.role)}`}>
                        {member.role}
                      </span>
                    </div>

                    {/* Kontakt */}
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center justify-center">
                        <EnvelopeIcon className="h-4 w-4 mr-2" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      {member.phoneNumber && (
                        <div className="flex items-center justify-center">
                          <PhoneIcon className="h-4 w-4 mr-2" />
                          <span>{member.phoneNumber}</span>
                        </div>
                      )}
                      {member.lastLoginAt && (
                        <div className="flex items-center justify-center">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          <span>{formatLastSeen(member.lastLoginAt)}</span>
                        </div>
                      )}
                    </div>

                    {/* Statistiken */}
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="text-center">
                        <div className="font-semibold text-gray-900 dark:text-white">{member.stats.projects}</div>
                        <div className="text-gray-500">Projekte</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900 dark:text-white">{member.stats.tasks}</div>
                        <div className="text-gray-500">Aufgaben</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900 dark:text-white">{member.stats.hoursLogged}h</div>
                        <div className="text-gray-500">Stunden</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-gray-900 dark:text-white">{member.currentProjects.length}</div>
                        <div className="text-gray-500">Aktiv</div>
                      </div>
                    </div>

                    {/* Skills */}
                    {member.skills && member.skills.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap justify-center gap-1">
                          {member.skills.slice(0, 3).map((skill, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                              {skill}
                            </span>
                          ))}
                          {member.skills.length > 3 && (
                            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
                              +{member.skills.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Aktionen */}
                    <div className="flex justify-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedMember(member)}
                      >
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                      <Button size="sm" variant="ghost">
                        <EnvelopeIcon className="h-4 w-4" />
                      </Button>
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
                        Mitglied
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rolle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Abteilung
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Projekte
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Letzter Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Aktionen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {teamMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mr-3">
                              {member.avatar ? (
                                <img src={member.avatar} alt={member.username} className="h-10 w-10 rounded-full" />
                              ) : (
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                  {(member.firstName?.[0] || member.username[0]).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {member.firstName && member.lastName 
                                  ? `${member.firstName} ${member.lastName}`
                                  : member.username
                                }
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(member.role)}`}>
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {member.department || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {member.currentProjects.length} aktiv
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {member.lastLoginAt ? formatLastSeen(member.lastLoginAt) : 'Noch nie'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedMember(member)}
                            >
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <EnvelopeIcon className="h-4 w-4" />
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

        {teamMembers.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || filterRole !== 'ALL' || filterDepartment !== 'ALL'
                ? 'Keine Team-Mitglieder für die aktuellen Filter gefunden.'
                : 'Noch keine Team-Mitglieder vorhanden.'
              }
            </p>
          </div>
        )}

        {/* Member Detail Modal */}
        {selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Team-Mitglied Details
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedMember(null)}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
                
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-center space-x-4">
                    <div className="h-20 w-20 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      {selectedMember.avatar ? (
                        <img src={selectedMember.avatar} alt={selectedMember.username} className="h-20 w-20 rounded-full" />
                      ) : (
                        <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                          {(selectedMember.firstName?.[0] || selectedMember.username[0]).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {selectedMember.firstName && selectedMember.lastName 
                          ? `${selectedMember.firstName} ${selectedMember.lastName}`
                          : selectedMember.username
                        }
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedMember.position || selectedMember.role}
                      </p>
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(selectedMember.role)} mt-1 inline-block`}>
                        {selectedMember.role}
                      </span>
                    </div>
                  </div>

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        E-Mail
                      </label>
                      <p className="text-gray-900 dark:text-white">{selectedMember.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Benutzername
                      </label>
                      <p className="text-gray-900 dark:text-white">@{selectedMember.username}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Abteilung
                      </label>
                      <p className="text-gray-900 dark:text-white">{selectedMember.department || '-'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Telefon
                      </label>
                      <p className="text-gray-900 dark:text-white">{selectedMember.phoneNumber || '-'}</p>
                    </div>
                  </div>

                  {/* Skills */}
                  {selectedMember.skills && selectedMember.skills.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fähigkeiten
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedMember.skills.map((skill, index) => (
                          <span key={index} className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Current Projects */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Aktuelle Projekte
                    </label>
                    <div className="space-y-3">
                      {selectedMember.currentProjects.map((project) => (
                        <div key={project.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">{project.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{project.role}</p>
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{project.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Statistics */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Statistiken
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedMember.stats.projects}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Projekte</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedMember.stats.tasks}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Aufgaben</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedMember.stats.timeEntries}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Zeiterfassungen</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedMember.stats.hoursLogged}h</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Stunden</div>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      <label className="block font-medium mb-1">Mitglied seit</label>
                      <p>{new Date(selectedMember.createdAt).toLocaleDateString('de-DE')}</p>
                    </div>
                    {selectedMember.lastLoginAt && (
                      <div>
                        <label className="block font-medium mb-1">Letzter Login</label>
                        <p>{formatLastSeen(selectedMember.lastLoginAt)}</p>
                      </div>
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

export default withAuth(TeamPage)
