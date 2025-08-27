'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth, withAuth, usePermissions } from '@/contexts/AuthContext'
import { adminAPI, handleApiError } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  UsersIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  KeyIcon,
  EnvelopeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

// User Interface
interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'TRAINEE'
  isActive: boolean
  emailVerified?: string
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  
  // Statistiken
  stats?: {
    projects: number
    tasks: number
    timeEntries: number
    hoursLogged: number
  }
}

// User Management Stats
interface UserStats {
  total: number
  active: number
  inactive: number
  admins: number
  managers: number
  users: number
  trainees: number
  newThisMonth: number
  newThisWeek: number
}

function UserManagement() {
  const t = useTranslations('admin')
  const { user: currentUser } = useAuth()
  const { isAdmin } = usePermissions()
  
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState<string>('ALL')
  const [filterActive, setFilterActive] = useState<string>('ALL')

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
            Sie haben keine Berechtigung zur Benutzerverwaltung.
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
    loadUsers()
  }, [searchTerm, filterRole, filterActive])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      // Simulierte Benutzer-Daten (würde normalerweise von API kommen)
      const mockUsers: User[] = [
        {
          id: 'user_001',
          email: 'admin@azubi.com',
          username: 'admin',
          firstName: 'System',
          lastName: 'Administrator',
          role: 'ADMIN',
          isActive: true,
          emailVerified: '2024-01-01T00:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-20T10:00:00.000Z',
          lastLoginAt: '2024-01-20T09:30:00.000Z',
          stats: {
            projects: 5,
            tasks: 12,
            timeEntries: 45,
            hoursLogged: 120.5
          }
        },
        {
          id: 'user_002',
          email: 'anna.schmidt@azubi.com',
          username: 'anna_schmidt',
          firstName: 'Anna',
          lastName: 'Schmidt',
          role: 'MANAGER',
          isActive: true,
          emailVerified: '2024-01-05T00:00:00.000Z',
          createdAt: '2024-01-05T00:00:00.000Z',
          updatedAt: '2024-01-19T14:20:00.000Z',
          lastLoginAt: '2024-01-19T14:15:00.000Z',
          stats: {
            projects: 8,
            tasks: 25,
            timeEntries: 89,
            hoursLogged: 245.2
          }
        },
        {
          id: 'user_003',
          email: 'tom.weber@azubi.com',
          username: 'tom_weber',
          firstName: 'Tom',
          lastName: 'Weber',
          role: 'USER',
          isActive: true,
          emailVerified: '2024-01-08T00:00:00.000Z',
          createdAt: '2024-01-08T00:00:00.000Z',
          updatedAt: '2024-01-18T16:45:00.000Z',
          lastLoginAt: '2024-01-18T16:40:00.000Z',
          stats: {
            projects: 3,
            tasks: 18,
            timeEntries: 67,
            hoursLogged: 189.7
          }
        },
        {
          id: 'user_004',
          email: 'lisa.mueller@azubi.com',
          username: 'lisa_mueller',
          firstName: 'Lisa',
          lastName: 'Müller',
          role: 'USER',
          isActive: true,
          emailVerified: '2024-01-10T00:00:00.000Z',
          createdAt: '2024-01-10T00:00:00.000Z',
          updatedAt: '2024-01-17T11:30:00.000Z',
          lastLoginAt: '2024-01-17T11:25:00.000Z',
          stats: {
            projects: 2,
            tasks: 14,
            timeEntries: 34,
            hoursLogged: 95.3
          }
        },
        {
          id: 'user_005',
          email: 'max.mustermann@azubi.com',
          username: 'max_mustermann',
          firstName: 'Max',
          lastName: 'Mustermann',
          role: 'TRAINEE',
          isActive: true,
          emailVerified: '2024-01-15T00:00:00.000Z',
          createdAt: '2024-01-15T00:00:00.000Z',
          updatedAt: '2024-01-16T09:15:00.000Z',
          lastLoginAt: '2024-01-16T09:10:00.000Z',
          stats: {
            projects: 1,
            tasks: 8,
            timeEntries: 15,
            hoursLogged: 32.1
          }
        },
        {
          id: 'user_006',
          email: 'inactive.user@azubi.com',
          username: 'inactive_user',
          firstName: 'Inactive',
          lastName: 'User',
          role: 'USER',
          isActive: false,
          emailVerified: '2024-01-12T00:00:00.000Z',
          createdAt: '2024-01-12T00:00:00.000Z',
          updatedAt: '2024-01-15T12:00:00.000Z',
          lastLoginAt: '2024-01-14T10:00:00.000Z',
          stats: {
            projects: 1,
            tasks: 3,
            timeEntries: 8,
            hoursLogged: 15.5
          }
        }
      ]

      const mockStats: UserStats = {
        total: mockUsers.length,
        active: mockUsers.filter(u => u.isActive).length,
        inactive: mockUsers.filter(u => !u.isActive).length,
        admins: mockUsers.filter(u => u.role === 'ADMIN').length,
        managers: mockUsers.filter(u => u.role === 'MANAGER').length,
        users: mockUsers.filter(u => u.role === 'USER').length,
        trainees: mockUsers.filter(u => u.role === 'TRAINEE').length,
        newThisMonth: 4,
        newThisWeek: 2
      }

      // Filter anwenden
      let filteredUsers = mockUsers
      
      if (searchTerm) {
        filteredUsers = filteredUsers.filter(user => 
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }
      
      if (filterRole !== 'ALL') {
        filteredUsers = filteredUsers.filter(user => user.role === filterRole)
      }
      
      if (filterActive !== 'ALL') {
        filteredUsers = filteredUsers.filter(user => 
          filterActive === 'ACTIVE' ? user.isActive : !user.isActive
        )
      }

      setUsers(filteredUsers)
      setStats(mockStats)

    } catch (err) {
      console.error('Fehler beim Laden der Benutzer:', err)
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadUsers()
    setRefreshing(false)
  }

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    try {
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isActive: !isActive } : user
      ))
      
      // API-Call würde hier stehen
      // await adminAPI.updateUser(userId, { isActive: !isActive })
      
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Benutzers:', err)
      setError(handleApiError(err))
      // Revert bei Fehler
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, isActive } : user
      ))
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?')) {
      return
    }

    try {
      setUsers(prev => prev.filter(user => user.id !== userId))
      
      // API-Call würde hier stehen
      // await adminAPI.deleteUser(userId)
      
    } catch (err) {
      console.error('Fehler beim Löschen des Benutzers:', err)
      setError(handleApiError(err))
    }
  }

  // Hilfsfunktionen
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'MANAGER': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'USER': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'TRAINEE': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return ShieldCheckIcon
      case 'MANAGER': return UsersIcon
      case 'USER': return UserCircleIcon
      case 'TRAINEE': return UserCircleIcon
      default: return UserCircleIcon
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
              <div className="flex items-center space-x-3 mb-2">
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Admin Center
                  </Button>
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Benutzerverwaltung
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Benutzer verwalten, Rollen zuweisen und Aktivitäten überwachen
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
                Benutzer hinzufügen
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
                      Gesamt
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.total}
                    </p>
                    <p className="text-xs text-blue-600">
                      {stats.active} aktiv
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ShieldCheckIcon className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Administratoren
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.admins}
                    </p>
                    <p className="text-xs text-red-600">
                      {stats.managers} Manager
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <UserCircleIcon className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Benutzer
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.users}
                    </p>
                    <p className="text-xs text-green-600">
                      {stats.trainees} Azubis
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
                      Neu diese Woche
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.newThisWeek}
                    </p>
                    <p className="text-xs text-purple-600">
                      {stats.newThisMonth} diesen Monat
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter und Suche */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center space-x-4 space-y-2">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Benutzer suchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div>
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
            </div>
            
            <div>
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="ALL">Alle Status</option>
                <option value="ACTIVE">Aktiv</option>
                <option value="INACTIVE">Inaktiv</option>
              </select>
            </div>
          </div>
        </div>

        {/* Benutzer-Liste */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UsersIcon className="h-5 w-5 mr-2" />
              Benutzer ({users.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => {
                const RoleIcon = getRoleIcon(user.role)
                return (
                  <div key={user.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Avatar */}
                        <div className="h-12 w-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username} className="h-12 w-12 rounded-full" />
                          ) : (
                            <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                              {(user.firstName?.[0] || user.username[0]).toUpperCase()}
                            </span>
                          )}
                        </div>
                        
                        {/* Benutzer-Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}`
                                : user.username
                              }
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                              {user.role}
                            </span>
                            {user.isActive ? (
                              <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/20 text-green-600 rounded-full">
                                Aktiv
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-600 rounded-full">
                                Inaktiv
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                              <p className="flex items-center">
                                <EnvelopeIcon className="h-4 w-4 mr-2" />
                                {user.email}
                              </p>
                              <p className="flex items-center mt-1">
                                <UserCircleIcon className="h-4 w-4 mr-2" />
                                @{user.username}
                              </p>
                            </div>
                            
                            <div>
                              <p>Erstellt: {new Date(user.createdAt).toLocaleDateString('de-DE')}</p>
                              {user.lastLoginAt && (
                                <p>Letzter Login: {new Date(user.lastLoginAt).toLocaleDateString('de-DE')}</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Statistiken */}
                          {user.stats && (
                            <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                              <div className="text-center">
                                <p className="font-medium text-gray-900 dark:text-white">{user.stats.projects}</p>
                                <p className="text-xs text-gray-500">Projekte</p>
                              </div>
                              <div className="text-center">
                                <p className="font-medium text-gray-900 dark:text-white">{user.stats.tasks}</p>
                                <p className="text-xs text-gray-500">Aufgaben</p>
                              </div>
                              <div className="text-center">
                                <p className="font-medium text-gray-900 dark:text-white">{user.stats.timeEntries}</p>
                                <p className="text-xs text-gray-500">Zeiten</p>
                              </div>
                              <div className="text-center">
                                <p className="font-medium text-gray-900 dark:text-white">{user.stats.hoursLogged}h</p>
                                <p className="text-xs text-gray-500">Stunden</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Aktionen */}
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedUser(user)}
                        >
                          <EyeIcon className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                        >
                          <KeyIcon className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleUserActive(user.id, user.isActive)}
                        >
                          {user.isActive ? (
                            <XCircleIcon className="h-4 w-4 text-red-500" />
                          ) : (
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                        
                        {user.id !== currentUser?.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteUser(user.id)}
                          >
                            <TrashIcon className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              
              {users.length === 0 && (
                <div className="text-center py-8">
                  <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Keine Benutzer gefunden für die aktuellen Filter.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Detail Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Benutzer-Details
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedUser(null)}
                  >
                    <XCircleIcon className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      {selectedUser.avatar ? (
                        <img src={selectedUser.avatar} alt={selectedUser.username} className="h-16 w-16 rounded-full" />
                      ) : (
                        <span className="text-xl font-medium text-gray-700 dark:text-gray-300">
                          {(selectedUser.firstName?.[0] || selectedUser.username[0]).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {selectedUser.firstName && selectedUser.lastName 
                          ? `${selectedUser.firstName} ${selectedUser.lastName}`
                          : selectedUser.username
                        }
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">@{selectedUser.username}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        E-Mail
                      </label>
                      <p className="text-gray-900 dark:text-white">{selectedUser.email}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Rolle
                      </label>
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(selectedUser.role)}`}>
                        {selectedUser.role}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Status
                      </label>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedUser.isActive 
                          ? 'text-green-600 bg-green-100 dark:bg-green-900/20'
                          : 'text-red-600 bg-red-100 dark:bg-red-900/20'
                      }`}>
                        {selectedUser.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        E-Mail verifiziert
                      </label>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedUser.emailVerified 
                          ? 'text-green-600 bg-green-100 dark:bg-green-900/20'
                          : 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
                      }`}>
                        {selectedUser.emailVerified ? 'Ja' : 'Nein'}
                      </span>
                    </div>
                  </div>
                  
                  {selectedUser.stats && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Aktivitäts-Statistiken
                      </label>
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedUser.stats.projects}</p>
                          <p className="text-xs text-gray-500">Projekte</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedUser.stats.tasks}</p>
                          <p className="text-xs text-gray-500">Aufgaben</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedUser.stats.timeEntries}</p>
                          <p className="text-xs text-gray-500">Zeiterfassungen</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">{selectedUser.stats.hoursLogged}h</p>
                          <p className="text-xs text-gray-500">Erfasste Stunden</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Erstellt am
                      </label>
                      <p>{new Date(selectedUser.createdAt).toLocaleString('de-DE')}</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Zuletzt aktualisiert
                      </label>
                      <p>{new Date(selectedUser.updatedAt).toLocaleString('de-DE')}</p>
                    </div>
                    
                    {selectedUser.lastLoginAt && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Letzter Login
                        </label>
                        <p>{new Date(selectedUser.lastLoginAt).toLocaleString('de-DE')}</p>
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

export default withAuth(UserManagement)
