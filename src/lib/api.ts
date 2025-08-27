import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

// API-Client-Konfiguration
const API_BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:8080'

// Axios-Instanz erstellen
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 Sekunden Timeout
})

// Request-Interceptor für automatische Token-Einbindung
apiClient.interceptors.request.use(
  (config) => {
    // Token aus localStorage abrufen
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response-Interceptor für Error-Handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    // Token abgelaufen oder ungültig
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        window.location.href = '/auth/login'
      }
    }
    
    // Rate-Limit erreicht
    if (error.response?.status === 429) {
      console.warn('Rate limit erreicht:', error.response.data)
    }
    
    return Promise.reject(error)
  }
)

// API-Funktionen für Authentication
export const authAPI = {
  // Benutzer registrieren
  register: async (userData: {
    email: string
    username: string
    password: string
    firstName: string
    lastName: string
  }) => {
    const response = await apiClient.post('/auth/register', userData)
    return response.data
  },

  // Benutzer anmelden
  login: async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', credentials)
    const { user, token } = response.data
    
    // Token und Benutzerdaten speichern
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_data', JSON.stringify(user))
    }
    
    return response.data
  },

  // Benutzer abmelden
  logout: async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
      }
    }
  },
}

// API-Funktionen für Benutzer
export const userAPI = {
  // Profil abrufen
  getProfile: async () => {
    const response = await apiClient.get('/users/profile')
    return response.data.profile
  },

  // Profil aktualisieren
  updateProfile: async (profileData: {
    firstName?: string
    lastName?: string
    email?: string
    username?: string
    avatar?: string
  }) => {
    const response = await apiClient.put('/users/profile', {
      action: 'update-profile',
      ...profileData
    })
    return response.data
  },

  // Passwort ändern
  changePassword: async (passwordData: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }) => {
    const response = await apiClient.put('/users/profile', {
      action: 'change-password',
      ...passwordData
    })
    return response.data
  },
}

// API-Funktionen für Projekte
export const projectAPI = {
  // Alle Projekte abrufen
  getAll: async (params?: {
    status?: string
    priority?: string
    page?: number
    limit?: number
  }) => {
    const response = await apiClient.get('/projects', { params })
    return response.data
  },

  // Einzelprojekt abrufen
  getById: async (id: string) => {
    const response = await apiClient.get(`/projects/${id}`)
    return response.data.project
  },

  // Projekt erstellen
  create: async (projectData: {
    name: string
    description?: string
    status?: string
    priority?: string
    startDate?: string
    endDate?: string
    budget?: number
    clientName?: string
  }) => {
    const response = await apiClient.post('/projects', projectData)
    return response.data
  },

  // Projekt aktualisieren
  update: async (id: string, projectData: Partial<{
    name: string
    description: string
    status: string
    priority: string
    startDate: string
    endDate: string
    budget: number
    clientName: string
  }>) => {
    const response = await apiClient.put(`/projects/${id}`, projectData)
    return response.data
  },

  // Projekt löschen
  delete: async (id: string) => {
    const response = await apiClient.delete(`/projects/${id}`)
    return response.data
  },

  // Projektmitglieder
  getMembers: async (id: string) => {
    const response = await apiClient.get(`/projects/${id}/members`)
    return response.data
  },

  addMember: async (id: string, memberData: { userId: string; role?: string }) => {
    const response = await apiClient.post(`/projects/${id}/members`, memberData)
    return response.data
  },

  updateMemberRole: async (id: string, userId: string, role: string) => {
    const response = await apiClient.put(`/projects/${id}/members`, { userId, role })
    return response.data
  },

  removeMember: async (id: string, userId: string) => {
    const response = await apiClient.delete(`/projects/${id}/members?userId=${userId}`)
    return response.data
  },
}

// API-Funktionen für Aufgaben
export const taskAPI = {
  // Alle Aufgaben abrufen
  getAll: async (params?: {
    status?: string
    priority?: string
    projectId?: string
    assignedTo?: string
    page?: number
    limit?: number
  }) => {
    const response = await apiClient.get('/tasks', { params })
    return response.data
  },

  // Einzelaufgabe abrufen
  getById: async (id: string) => {
    const response = await apiClient.get(`/tasks/${id}`)
    return response.data.task
  },

  // Aufgabe erstellen
  create: async (taskData: {
    title: string
    description?: string
    status?: string
    priority?: string
    estimatedHours?: number
    dueDate?: string
    assignedTo?: string
    projectId: string
    parentTaskId?: string
  }) => {
    const response = await apiClient.post('/tasks', taskData)
    return response.data
  },

  // Aufgabe aktualisieren
  update: async (id: string, taskData: Partial<{
    title: string
    description: string
    status: string
    priority: string
    estimatedHours: number
    actualHours: number
    dueDate: string
    assignedTo: string
    parentTaskId: string
  }>) => {
    const response = await apiClient.put(`/tasks/${id}`, taskData)
    return response.data
  },

  // Aufgabe löschen
  delete: async (id: string) => {
    const response = await apiClient.delete(`/tasks/${id}`)
    return response.data
  },
}

// API-Funktionen für Zeiterfassung
export const timeAPI = {
  // Zeiterfassungen abrufen
  getAll: async (params?: {
    userId?: string
    projectId?: string
    taskId?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }) => {
    const response = await apiClient.get('/time-entries', { params })
    return response.data
  },

  // Zeiterfassung erstellen
  create: async (timeData: {
    projectId: string
    taskId?: string
    description?: string
    startTime: string
    endTime?: string
    duration?: number
    isBillable?: boolean
  }) => {
    const response = await apiClient.post('/time-entries', timeData)
    return response.data
  },

  // Timer-Status abrufen
  getTimerStatus: async () => {
    const response = await apiClient.get('/time-entries/timer')
    return response.data
  },

  // Timer starten
  startTimer: async (timerData: {
    projectId: string
    taskId?: string
    description?: string
  }) => {
    const response = await apiClient.post('/time-entries/timer', {
      action: 'start',
      ...timerData
    })
    return response.data
  },

  // Timer stoppen
  stopTimer: async (timerData?: {
    description?: string
    isBillable?: boolean
  }) => {
    const response = await apiClient.post('/time-entries/timer', {
      action: 'stop',
      ...timerData
    })
    return response.data
  },

  // Timer pausieren
  pauseTimer: async () => {
    const response = await apiClient.post('/time-entries/timer', {
      action: 'pause'
    })
    return response.data
  },
}

// API-Funktionen für Dashboard
export const dashboardAPI = {
  // Dashboard-Statistiken abrufen
  getStats: async () => {
    const response = await apiClient.get('/dashboard/stats')
    return response.data
  },
}

// API-Funktionen für Benachrichtigungen
export const notificationAPI = {
  // Benachrichtigungen abrufen
  getAll: async (params?: {
    type?: string
    isRead?: boolean
    page?: number
    limit?: number
  }) => {
    const response = await apiClient.get('/notifications', { params })
    return response.data
  },

  // Benachrichtigungen als gelesen markieren
  markAsRead: async (notificationIds: string[]) => {
    const response = await apiClient.put('/notifications', {
      action: 'mark-read',
      notificationIds
    })
    return response.data
  },

  // Alle Benachrichtigungen als gelesen markieren
  markAllAsRead: async () => {
    const response = await apiClient.put('/notifications', {
      action: 'mark-all-read'
    })
    return response.data
  },

  // Benachrichtigungen löschen
  delete: async (notificationIds: string[]) => {
    const response = await apiClient.delete(`/notifications?ids=${notificationIds.join(',')}`)
    return response.data
  },

  // Alle gelesenen Benachrichtigungen löschen
  deleteAllRead: async () => {
    const response = await apiClient.delete('/notifications?all=true')
    return response.data
  },
}

// API-Funktionen für Datei-Upload
export const fileAPI = {
  // Dateien abrufen
  getAll: async (params?: {
    projectId?: string
    taskId?: string
    fileType?: string
    page?: number
    limit?: number
  }) => {
    const response = await apiClient.get('/upload', { params })
    return response.data
  },

  // Datei hochladen
  upload: async (file: File, metadata?: {
    projectId?: string
    taskId?: string
    description?: string
  }) => {
    const formData = new FormData()
    formData.append('file', file)
    
    if (metadata?.projectId) formData.append('projectId', metadata.projectId)
    if (metadata?.taskId) formData.append('taskId', metadata.taskId)
    if (metadata?.description) formData.append('description', metadata.description)

    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  // Datei löschen
  delete: async (fileId: string) => {
    const response = await apiClient.delete(`/upload?id=${fileId}`)
    return response.data
  },
}

// API-Funktionen für Admin (NEU)
export const adminAPI = {
  // System-Statistiken abrufen
  getSystemStats: async () => {
    const response = await apiClient.get('/admin/system/stats')
    return response.data
  },

  // Alle Benutzer verwalten
  getUsers: async (params?: {
    role?: string
    isActive?: boolean
    search?: string
    page?: number
    limit?: number
  }) => {
    const response = await apiClient.get('/admin/users', { params })
    return response.data
  },

  // Benutzer erstellen
  createUser: async (userData: {
    email: string
    username: string
    password: string
    firstName: string
    lastName: string
    role: string
  }) => {
    const response = await apiClient.post('/admin/users', userData)
    return response.data
  },

  // Benutzer aktualisieren
  updateUser: async (userId: string, userData: {
    email?: string
    username?: string
    firstName?: string
    lastName?: string
    role?: string
    isActive?: boolean
  }) => {
    const response = await apiClient.put(`/admin/users/${userId}`, userData)
    return response.data
  },

  // Benutzer deaktivieren/löschen
  deleteUser: async (userId: string) => {
    const response = await apiClient.delete(`/admin/users/${userId}`)
    return response.data
  },

  // Passwort zurücksetzen
  resetPassword: async (userId: string, newPassword: string) => {
    const response = await apiClient.put(`/admin/users/${userId}/password`, {
      newPassword
    })
    return response.data
  },

  // Alle Projekte mit Admin-Berechtigung
  getAllProjects: async (params?: {
    status?: string
    search?: string
    page?: number
    limit?: number
  }) => {
    const response = await apiClient.get('/admin/projects', { params })
    return response.data
  },

  // System-Logs abrufen
  getSystemLogs: async (params?: {
    level?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }) => {
    const response = await apiClient.get('/admin/system/logs', { params })
    return response.data
  },

  // ARP-Tasks verwalten
  getARPTasks: async (params?: {
    status?: string
    type?: string
    priority?: string
    page?: number
    limit?: number
  }) => {
    const response = await apiClient.get('/admin/arp/tasks', { params })
    return response.data
  },

  // ARP-Task erstellen
  createARPTask: async (taskData: {
    type: string
    title: string
    description: string
    priority: string
    scheduledFor?: string
    parameters?: object
  }) => {
    const response = await apiClient.post('/admin/arp/tasks', taskData)
    return response.data
  },

  // ARP-Task ausführen
  executeARPTask: async (taskId: string) => {
    const response = await apiClient.post(`/admin/arp/tasks/${taskId}/execute`)
    return response.data
  },

  // ARP-Task abbrechen
  cancelARPTask: async (taskId: string) => {
    const response = await apiClient.post(`/admin/arp/tasks/${taskId}/cancel`)
    return response.data
  },

  // System-Backup erstellen
  createBackup: async () => {
    const response = await apiClient.post('/admin/system/backup')
    return response.data
  },

  // System-Wartung
  performMaintenance: async (maintenanceType: string) => {
    const response = await apiClient.post('/admin/system/maintenance', {
      type: maintenanceType
    })
    return response.data
  },

  // Datenbank-Statistiken
  getDatabaseStats: async () => {
    const response = await apiClient.get('/admin/system/database')
    return response.data
  },

  // Audit-Log abrufen
  getAuditLog: async (params?: {
    userId?: string
    action?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
  }) => {
    const response = await apiClient.get('/admin/audit', { params })
    return response.data
  },
}

// Error-Handler Hilfsfunktion
export const handleApiError = (error: any) => {
  if (error.response?.data?.error) {
    return error.response.data.error
  }
  if (error.message) {
    return error.message
  }
  return 'Ein unbekannter Fehler ist aufgetreten'
}