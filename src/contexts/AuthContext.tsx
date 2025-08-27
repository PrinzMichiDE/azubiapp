'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authAPI, userAPI, handleApiError } from '@/lib/api'

// Benutzer-Interface
interface User {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  avatar?: string
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'TRAINEE'
  isActive: boolean
  emailVerified?: Date
  createdAt: Date
}

// Auth-Context-Interface
interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: {
    email: string
    username: string
    password: string
    firstName: string
    lastName: string
  }) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (profileData: Partial<User>) => Promise<void>
  refreshUser: () => Promise<void>
  error: string | null
  clearError: () => void
}

// Context erstellen
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook für den Auth-Context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth muss innerhalb eines AuthProvider verwendet werden')
  }
  return context
}

// AuthProvider-Komponente
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Benutzer beim App-Start laden
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const userData = localStorage.getItem('user_data')

        if (token && userData) {
          // Gespeicherte Benutzerdaten laden
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)

          // Benutzer-Profil vom Server aktualisieren
          try {
            const profile = await userAPI.getProfile()
            setUser(profile)
            localStorage.setItem('user_data', JSON.stringify(profile))
          } catch (error) {
            console.warn('Fehler beim Laden des Benutzerprofils:', error)
            // Lokale Daten verwenden, falls Server nicht erreichbar
          }
        }
      } catch (error) {
        console.error('Fehler bei der Auth-Initialisierung:', error)
        // Token und Daten löschen bei Fehlern
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  // Benutzer anmelden
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await authAPI.login({ email, password })
      setUser(response.user)
      
    } catch (error) {
      const errorMessage = handleApiError(error)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Benutzer registrieren
  const register = async (userData: {
    email: string
    username: string
    password: string
    firstName: string
    lastName: string
  }) => {
    try {
      setIsLoading(true)
      setError(null)

      await authAPI.register(userData)
      
      // Nach erfolgreicher Registrierung automatisch anmelden
      await login(userData.email, userData.password)
      
    } catch (error) {
      const errorMessage = handleApiError(error)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // Benutzer abmelden
  const logout = async () => {
    try {
      setIsLoading(true)
      await authAPI.logout()
    } catch (error) {
      console.error('Fehler beim Abmelden:', error)
    } finally {
      setUser(null)
      setIsLoading(false)
    }
  }

  // Profil aktualisieren
  const updateProfile = async (profileData: Partial<User>) => {
    try {
      setError(null)
      
      const response = await userAPI.updateProfile(profileData)
      const updatedUser = { ...user, ...response.user }
      
      setUser(updatedUser)
      localStorage.setItem('user_data', JSON.stringify(updatedUser))
      
    } catch (error) {
      const errorMessage = handleApiError(error)
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  // Benutzer-Daten aktualisieren
  const refreshUser = async () => {
    try {
      if (!user) return
      
      const profile = await userAPI.getProfile()
      setUser(profile)
      localStorage.setItem('user_data', JSON.stringify(profile))
      
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Benutzerdaten:', error)
    }
  }

  // Fehler löschen
  const clearError = () => {
    setError(null)
  }

  // Authentifizierungsstatus
  const isAuthenticated = !!user && !!localStorage.getItem('auth_token')

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    error,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// HOC für geschützte Routen
export const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>
) => {
  const WithAuthComponent = (props: P) => {
    const { isAuthenticated, isLoading } = useAuth()

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        window.location.href = '/auth/login'
      }
    }, [isAuthenticated, isLoading])

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      )
    }

    if (!isAuthenticated) {
      return null
    }

    return <WrappedComponent {...props} />
  }

  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name})`

  return WithAuthComponent
}

// Hook für Rollen-basierte Berechtigungen
export const usePermissions = () => {
  const { user } = useAuth()

  const hasRole = (requiredRole: User['role'] | User['role'][]) => {
    if (!user) return false
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    return roles.includes(user.role)
  }

  const isAdmin = () => user?.role === 'ADMIN'
  const isManager = () => ['ADMIN', 'MANAGER'].includes(user?.role || '')
  const canManageUsers = () => isAdmin()
  const canManageProjects = () => isManager()
  const canCreateProjects = () => !user || user.role !== 'TRAINEE'

  return {
    user,
    hasRole,
    isAdmin,
    isManager,
    canManageUsers,
    canManageProjects,
    canCreateProjects,
  }
}
