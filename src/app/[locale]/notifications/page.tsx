'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth, withAuth } from '@/contexts/AuthContext'
import { notificationAPI, handleApiError } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  EyeIcon,
  TrashIcon,
  ArrowPathIcon,
  FunnelIcon,
  EnvelopeIcon,
  ClockIcon,
  UserIcon,
  FolderIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

// Notification Interface
interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  isRead: boolean
  createdAt: string
  
  // Erweiterte Eigenschaften (optional)
  actionUrl?: string
  relatedId?: string
  relatedType?: 'PROJECT' | 'TASK' | 'USER' | 'SYSTEM'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  expiresAt?: string
}

interface NotificationStats {
  total: number
  unread: number
  byType: {
    INFO: number
    SUCCESS: number
    WARNING: number
    ERROR: number
  }
  today: number
  thisWeek: number
}

function NotificationsPage() {
  const t = useTranslations()
  const { user } = useAuth()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filter und Pagination
  const [filterType, setFilterType] = useState<string>('ALL')
  const [filterRead, setFilterRead] = useState<string>('ALL')
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Benachrichtigungen laden
  useEffect(() => {
    loadNotifications(true)
  }, [filterType, filterRead])

  const loadNotifications = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setPage(1)
      }
      setError(null)

      const params = {
        ...(filterType !== 'ALL' && { type: filterType }),
        ...(filterRead !== 'ALL' && { isRead: filterRead === 'READ' }),
        page: reset ? 1 : page,
        limit: 20
      }

      const response = await notificationAPI.getAll(params)
      const newNotifications = response.notifications || []

      if (reset) {
        setNotifications(newNotifications)
      } else {
        setNotifications(prev => [...prev, ...newNotifications])
      }

      setHasMore(newNotifications.length === 20)
      
      // Mock-Statistiken berechnen
      const mockStats: NotificationStats = {
        total: response.pagination?.total || newNotifications.length,
        unread: response.unreadCount || newNotifications.filter((n: Notification) => !n.isRead).length,
        byType: {
          INFO: newNotifications.filter((n: Notification) => n.type === 'INFO').length,
          SUCCESS: newNotifications.filter((n: Notification) => n.type === 'SUCCESS').length,
          WARNING: newNotifications.filter((n: Notification) => n.type === 'WARNING').length,
          ERROR: newNotifications.filter((n: Notification) => n.type === 'ERROR').length,
        },
        today: newNotifications.filter((n: Notification) => 
          new Date(n.createdAt).toDateString() === new Date().toDateString()
        ).length,
        thisWeek: newNotifications.filter((n: Notification) => {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          return new Date(n.createdAt) >= weekAgo
        }).length
      }

      setStats(mockStats)

    } catch (err) {
      console.error('Fehler beim Laden der Benachrichtigungen:', err)
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const refreshNotifications = async () => {
    setRefreshing(true)
    await loadNotifications(true)
    setRefreshing(false)
  }

  const loadMore = async () => {
    if (!hasMore || loading) return
    setPage(prev => prev + 1)
    await loadNotifications(false)
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      await notificationAPI.markAsRead(notificationIds)
      
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, isRead: true }
            : notification
        )
      )
      
      // Statistiken aktualisieren
      if (stats) {
        setStats(prev => prev ? {
          ...prev,
          unread: Math.max(0, prev.unread - notificationIds.length)
        } : null)
      }
      
    } catch (err) {
      console.error('Fehler beim Markieren als gelesen:', err)
      setError(handleApiError(err))
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead()
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      )
      
      if (stats) {
        setStats(prev => prev ? { ...prev, unread: 0 } : null)
      }
      
    } catch (err) {
      console.error('Fehler beim Markieren aller als gelesen:', err)
      setError(handleApiError(err))
    }
  }

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      await notificationAPI.delete(notificationIds)
      
      setNotifications(prev => 
        prev.filter(notification => !notificationIds.includes(notification.id))
      )
      
      setSelectedNotifications([])
      
    } catch (err) {
      console.error('Fehler beim Löschen der Benachrichtigungen:', err)
      setError(handleApiError(err))
    }
  }

  const toggleSelection = (notificationId: string) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    )
  }

  const selectAll = () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id)
    setSelectedNotifications(
      selectedNotifications.length === unreadIds.length ? [] : unreadIds
    )
  }

  // Hilfsfunktionen
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return CheckCircleIcon
      case 'WARNING': return ExclamationTriangleIcon
      case 'ERROR': return XCircleIcon
      case 'INFO':
      default: return InformationCircleIcon
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SUCCESS': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'WARNING': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20'
      case 'ERROR': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      case 'INFO':
      default: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Gerade eben'
    if (diffInMinutes < 60) return `vor ${diffInMinutes} Minuten`
    if (diffInMinutes < 1440) return `vor ${Math.floor(diffInMinutes / 60)} Stunden`
    if (diffInMinutes < 10080) return `vor ${Math.floor(diffInMinutes / 1440)} Tagen`
    
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getNotificationContent = (notification: Notification) => {
    // Mock-erweiterte Inhalte basierend auf dem Typ
    const mockContent = {
      title: notification.title,
      message: notification.message,
      actionText: '',
      actionUrl: notification.actionUrl || '',
    }

    if (notification.title.includes('Aufgabe')) {
      mockContent.actionText = 'Aufgabe anzeigen'
      mockContent.actionUrl = `/tasks/${notification.relatedId || ''}`
    } else if (notification.title.includes('Projekt')) {
      mockContent.actionText = 'Projekt öffnen'
      mockContent.actionUrl = `/projects/${notification.relatedId || ''}`
    } else if (notification.title.includes('Team')) {
      mockContent.actionText = 'Team anzeigen'
      mockContent.actionUrl = `/team`
    }

    return mockContent
  }

  if (loading && notifications.length === 0) {
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
                {t('notifications.title')}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Alle Ihre Benachrichtigungen und Updates an einem Ort
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={refreshNotifications}
                disabled={refreshing}
                variant="outline"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Aktualisieren
              </Button>
              
              {stats && stats.unread > 0 && (
                <Button onClick={markAllAsRead}>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  {t('notifications.markAllAsRead')}
                </Button>
              )}
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
                  <BellIcon className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Gesamt
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.total}
                    </p>
                    <p className="text-xs text-blue-600">
                      Alle Benachrichtigungen
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Ungelesen
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.unread}
                    </p>
                    <p className="text-xs text-red-600">
                      Benötigen Aufmerksamkeit
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ClockIcon className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Heute
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.today}
                    </p>
                    <p className="text-xs text-green-600">
                      Neue heute
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Warnungen
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.byType.WARNING + stats.byType.ERROR}
                    </p>
                    <p className="text-xs text-yellow-600">
                      Wichtige Updates
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <Card>
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
                      <option value="INFO">Information</option>
                      <option value="SUCCESS">Erfolg</option>
                      <option value="WARNING">Warnung</option>
                      <option value="ERROR">Fehler</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={filterRead}
                      onChange={(e) => setFilterRead(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="ALL">Alle</option>
                      <option value="unread">Ungelesen</option>
                      <option value="read">Gelesen</option>
                    </select>
                  </div>

                  {stats && (
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Nach Typ
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-blue-600">Information</span>
                          <span className="text-gray-900 dark:text-white">{stats.byType.INFO}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-green-600">Erfolg</span>
                          <span className="text-gray-900 dark:text-white">{stats.byType.SUCCESS}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-yellow-600">Warnung</span>
                          <span className="text-gray-900 dark:text-white">{stats.byType.WARNING}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-red-600">Fehler</span>
                          <span className="text-gray-900 dark:text-white">{stats.byType.ERROR}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Benachrichtigungen-Liste */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <BellIcon className="h-5 w-5 mr-2" />
                    Benachrichtigungen ({notifications.length})
                  </CardTitle>
                  
                  {selectedNotifications.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsRead(selectedNotifications)}
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Als gelesen markieren
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteNotifications(selectedNotifications)}
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Löschen
                      </Button>
                    </div>
                  )}
                </div>
                
                {stats && stats.unread > 0 && (
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={selectAll}
                    >
                      {selectedNotifications.length === notifications.filter(n => !n.isRead).length 
                        ? 'Auswahl aufheben' 
                        : 'Alle ungelesenen auswählen'
                      }
                    </Button>
                  </div>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {notifications.map((notification) => {
                    const Icon = getTypeIcon(notification.type)
                    const content = getNotificationContent(notification)
                    
                    return (
                      <div 
                        key={notification.id} 
                        className={`border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all ${
                          !notification.isRead 
                            ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' 
                            : 'bg-white dark:bg-gray-800'
                        } hover:shadow-md`}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedNotifications.includes(notification.id)}
                            onChange={() => toggleSelection(notification.id)}
                            className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          
                          {/* Icon */}
                          <div className={`p-2 rounded-full ${getTypeColor(notification.type)} flex-shrink-0`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className={`text-sm font-medium ${
                                  !notification.isRead 
                                    ? 'text-gray-900 dark:text-white' 
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                  {content.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {content.message}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                  {formatDate(notification.createdAt)}
                                </p>
                              </div>
                              
                              {/* Ungelesen-Indikator */}
                              {!notification.isRead && (
                                <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 ml-2 mt-1"></div>
                              )}
                            </div>
                            
                            {/* Actions */}
                            {(content.actionText || !notification.isRead) && (
                              <div className="flex items-center space-x-3 mt-3">
                                {content.actionText && content.actionUrl && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      window.location.href = content.actionUrl
                                    }}
                                  >
                                    {content.actionText}
                                  </Button>
                                )}
                                
                                {!notification.isRead && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => markAsRead([notification.id])}
                                  >
                                    <EyeIcon className="h-4 w-4 mr-1" />
                                    Als gelesen markieren
                                  </Button>
                                )}
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteNotifications([notification.id])}
                                >
                                  <TrashIcon className="h-4 w-4 mr-1" />
                                  Löschen
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Laden weitere */}
                  {hasMore && (
                    <div className="text-center pt-4">
                      <Button
                        onClick={loadMore}
                        disabled={loading}
                        variant="outline"
                      >
                        {loading ? 'Wird geladen...' : 'Weitere laden'}
                      </Button>
                    </div>
                  )}
                  
                  {notifications.length === 0 && (
                    <div className="text-center py-8">
                      <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {filterType !== 'ALL' || filterRead !== 'ALL'
                          ? 'Keine Benachrichtigungen für die aktuellen Filter gefunden.'
                          : t('notifications.noNewNotifications')
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default withAuth(NotificationsPage)
