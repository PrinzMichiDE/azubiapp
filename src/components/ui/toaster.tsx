'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

// Toast-Typen
export type ToastType = 'success' | 'error' | 'warning' | 'info'

// Toast-Interface
export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

// Toast-Context
interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

// Toast Provider Hook
export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast Provider Props
interface ToastProviderProps {
  children: ReactNode
}

// Toast Provider
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  // Toast hinzufügen
  const addToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    }

    setToasts((prev) => [...prev, newToast])

    // Toast automatisch entfernen
    if (newToast.duration) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
  }

  // Toast entfernen
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  // Alle Toasts löschen
  const clearToasts = () => {
    setToasts([])
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
    </ToastContext.Provider>
  )
}

// Toast-Komponente
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  // Icon basierend auf Toast-Typ
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-success-500" />
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-error-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-warning-500" />
      case 'info':
        return <InformationCircleIcon className="w-5 h-5 text-info-500" />
      default:
        return <InformationCircleIcon className="w-5 h-5 text-primary-500" />
    }
  }

  // Hintergrundfarbe basierend auf Toast-Typ
  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-success-50 dark:bg-success-950/20 border-success-200 dark:border-success-800'
      case 'error':
        return 'bg-error-50 dark:bg-error-950/20 border-error-200 dark:border-error-800'
      case 'warning':
        return 'bg-warning-50 dark:bg-warning-950/20 border-warning-200 dark:border-warning-800'
      case 'info':
        return 'bg-info-50 dark:bg-info-950/20 border-info-200 dark:border-info-800'
      default:
        return 'bg-primary-50 dark:bg-primary-950/20 border-primary-200 dark:border-primary-800'
    }
  }

  return (
    <div
      className={`${getBackgroundColor()} border rounded-lg p-4 shadow-soft max-w-sm w-full animate-slide-up`}
      role="alert"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            {toast.title}
          </h4>
          {toast.message && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {toast.message}
            </p>
          )}
        </div>
        
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
          aria-label="Toast schließen"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Toaster-Komponente
export function Toaster() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}
