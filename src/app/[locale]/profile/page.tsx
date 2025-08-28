'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth, withAuth } from '@/contexts/AuthContext'
import { userAPI, handleApiError } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  UserCircleIcon,
  PencilIcon,
  KeyIcon,
  ChartBarIcon,
  ClockIcon,
  FolderIcon,
  CheckCircleIcon,
  CameraIcon,
  EyeIcon,
  EyeSlashIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  CalendarIcon,
  EnvelopeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

// Validation Schemas
const profileSchema = z.object({
  firstName: z.string().min(1, 'Vorname ist erforderlich'),
  lastName: z.string().min(1, 'Nachname ist erforderlich'),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  username: z.string().min(3, 'Benutzername muss mindestens 3 Zeichen haben'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
  newPassword: z.string().min(8, 'Neues Passwort muss mindestens 8 Zeichen haben'),
  confirmNewPassword: z.string().min(1, 'Passwort-Bestätigung ist erforderlich'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmNewPassword"],
})

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

interface UserProfile {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  role: string
  isActive: boolean
  emailVerified?: string
  createdAt: string
  updatedAt: string
  stats: {
    projects: number
    tasks: number
    timeEntries: number
    hoursLogged: number
  }
  recentActivity: Array<{
    id: string
    type: string
    description: string
    timestamp: string
  }>
  achievements: Array<{
    id: string
    title: string
    description: string
    achievedAt: string
    icon: string
  }>
  memberSince: string
  lastActive: string
}

function ProfilePage() {
  const t = useTranslations()
  const { user, updateUser } = useAuth()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'activity' | 'settings'>('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Profile Form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  // Password Form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  // Profile laden
  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const userProfile = await userAPI.getProfile()
      
      // Mock-Daten für erweiterte Statistiken
      const enhancedProfile: UserProfile = {
        ...userProfile,
        stats: userProfile.stats || {
          projects: 8,
          tasks: 42,
          timeEntries: 156,
          hoursLogged: 234.5
        },
        recentActivity: [
          {
            id: '1',
            type: 'TASK_COMPLETED',
            description: 'Aufgabe "Homepage Design" abgeschlossen',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            type: 'PROJECT_JOINED',
            description: 'Projekt "Mobile App" beigetreten',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            type: 'TIME_LOGGED',
            description: '3.5 Stunden für Projekt "Website Redesign" erfasst',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '4',
            type: 'ACHIEVEMENT_UNLOCKED',
            description: 'Achievement "Erste 100 Stunden" freigeschaltet',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        achievements: [
          {
            id: '1',
            title: 'Erste Schritte',
            description: 'Erstes Profil ausgefüllt',
            achievedAt: userProfile.createdAt,
            icon: '🎯'
          },
          {
            id: '2',
            title: 'Zeiterfasser',
            description: 'Erste 50 Stunden erfasst',
            achievedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            icon: '⏰'
          },
          {
            id: '3',
            title: 'Teamplayer',
            description: '5 Projektmitgliedschaften erreicht',
            achievedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            icon: '👥'
          },
          {
            id: '4',
            title: 'Aufgaben-Meister',
            description: '25 Aufgaben erfolgreich abgeschlossen',
            achievedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
            icon: '✅'
          }
        ],
        memberSince: userProfile.createdAt,
        lastActive: new Date().toISOString()
      }

      setProfile(enhancedProfile)

      // Form mit aktuellen Daten füllen
      profileForm.reset({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        email: userProfile.email,
        username: userProfile.username,
      })

    } catch (err) {
      console.error('Fehler beim Laden des Profils:', err)
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const onSubmitProfile = async (data: ProfileFormData) => {
    try {
      setError(null)
      setSuccess(null)

      const updatedUser = await userAPI.updateProfile(data)
      setProfile(prev => prev ? { ...prev, ...updatedUser.user } : null)
      updateUser(updatedUser.user)
      
      setSuccess(t('profile.profileUpdated'))
      
    } catch (err) {
      console.error('Fehler beim Aktualisieren des Profils:', err)
      setError(handleApiError(err))
    }
  }

  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      setError(null)
      setSuccess(null)

      await userAPI.changePassword(data)
      
      setSuccess(t('profile.passwordUpdated'))
      passwordForm.reset()
      
    } catch (err) {
      console.error('Fehler beim Ändern des Passworts:', err)
      setError(handleApiError(err))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'TASK_COMPLETED': return CheckCircleIcon
      case 'PROJECT_JOINED': return FolderIcon
      case 'TIME_LOGGED': return ClockIcon
      case 'ACHIEVEMENT_UNLOCKED': return ShieldCheckIcon
      default: return UserCircleIcon
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'TASK_COMPLETED': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'PROJECT_JOINED': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'TIME_LOGGED': return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20'
      case 'ACHIEVEMENT_UNLOCKED': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20'
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Profil konnte nicht geladen werden.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('profile.title')}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t('profile.subtitle')}
          </p>
        </div>

        {/* Erfolg/Fehler Meldungen */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center">
              <CheckIcon className="h-5 w-5 text-green-400 mr-2" />
              <span className="text-sm text-green-800 dark:text-green-200">{success}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profil-Übersicht */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="relative mb-4">
                  <div className="h-24 w-24 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto flex items-center justify-center">
                    {profile.avatar ? (
                      <img src={profile.avatar} alt="Avatar" className="h-24 w-24 rounded-full" />
                    ) : (
                      <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                        {(profile.firstName?.[0] || profile.username[0]).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button className="absolute bottom-0 right-1/2 transform translate-x-8 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors">
                    <CameraIcon className="h-4 w-4" />
                  </button>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {profile.firstName && profile.lastName 
                    ? `${profile.firstName} ${profile.lastName}`
                    : profile.username
                  }
                </h2>
                
                <p className="text-gray-600 dark:text-gray-400 mb-2">@{profile.username}</p>
                
                <div className="flex justify-center mb-4">
                  <span className={`px-3 py-1 text-sm rounded-full ${getRoleColor(profile.role)}`}>
                    {profile.role}
                  </span>
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <p className="flex items-center justify-center">
                    <EnvelopeIcon className="h-4 w-4 mr-2" />
                    {profile.email}
                  </p>
                  <p className="flex items-center justify-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Mitglied seit {formatDate(profile.memberSince)}
                  </p>
                  <p className="flex items-center justify-center">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    Zuletzt aktiv: {formatDate(profile.lastActive)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Statistiken */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ChartBarIcon className="h-5 w-5 mr-2" />
                  Statistiken
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Projekte</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{profile.stats.projects}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Aufgaben</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{profile.stats.tasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Zeiterfassungen</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{profile.stats.timeEntries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Erfasste Stunden</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{profile.stats.hoursLogged}h</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShieldCheckIcon className="h-5 w-5 mr-2" />
                  Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {achievement.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hauptinhalt */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="mb-6">
              <nav className="flex space-x-8" aria-label="Tabs">
                {[
                  { key: 'profile', name: 'Profil', icon: UserCircleIcon },
                  { key: 'password', name: 'Passwort', icon: KeyIcon },
                  { key: 'activity', name: 'Aktivität', icon: ClockIcon },
                  { key: 'settings', name: 'Einstellungen', icon: UserCircleIcon },
                ].map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`flex items-center px-1 py-2 text-sm font-medium border-b-2 ${
                        activeTab === tab.key
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

            {/* Tab Content */}
            {activeTab === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PencilIcon className="h-5 w-5 mr-2" />
                    Profil bearbeiten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.firstName')}
                        </label>
                        <input
                          {...profileForm.register('firstName')}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        {profileForm.formState.errors.firstName && (
                          <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.firstName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.lastName')}
                        </label>
                        <input
                          {...profileForm.register('lastName')}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        {profileForm.formState.errors.lastName && (
                          <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.lastName.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.email')}
                        </label>
                        <input
                          {...profileForm.register('email')}
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        {profileForm.formState.errors.email && (
                          <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.username')}
                        </label>
                        <input
                          {...profileForm.register('username')}
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        {profileForm.formState.errors.username && (
                          <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.username.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={profileForm.formState.isSubmitting}
                      >
                        {profileForm.formState.isSubmitting ? 'Wird gespeichert...' : t('profile.updateProfile')}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeTab === 'password' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <KeyIcon className="h-5 w-5 mr-2" />
                    Passwort ändern
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.currentPassword')}
                      </label>
                      <div className="relative">
                        <input
                          {...passwordForm.register('currentPassword')}
                          type={showPassword ? 'text' : 'password'}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.currentPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.newPassword')}
                      </label>
                      <div className="relative">
                        <input
                          {...passwordForm.register('newPassword')}
                          type={showNewPassword ? 'text' : 'password'}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showNewPassword ? (
                            <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {passwordForm.formState.errors.newPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.newPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.confirmNewPassword')}
                      </label>
                      <div className="relative">
                        <input
                          {...passwordForm.register('confirmNewPassword')}
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showConfirmPassword ? (
                            <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {passwordForm.formState.errors.confirmNewPassword && (
                        <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.confirmNewPassword.message}</p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={passwordForm.formState.isSubmitting}
                      >
                        {passwordForm.formState.isSubmitting ? 'Wird geändert...' : t('profile.updatePassword')}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeTab === 'activity' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2" />
                    Letzte Aktivitäten
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.recentActivity.map((activity) => {
                      const Icon = getActivityIcon(activity.type)
                      return (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className={`p-2 rounded-full ${getActivityColor(activity.type)}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white">
                              {activity.description}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(activity.timestamp)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'settings' && (
              <Card>
                <CardHeader>
                  <CardTitle>Einstellungen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Benachrichtigungseinstellungen
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            E-Mail-Benachrichtigungen für neue Aufgaben
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Push-Benachrichtigungen im Browser
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Wöchentliche Zusammenfassung per E-Mail
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                        Datenschutz
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Profil für andere Teammitglieder sichtbar
                          </span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" defaultChecked className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Aktivitätsstatus anzeigen
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button>
                        Einstellungen speichern
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default withAuth(ProfilePage)
