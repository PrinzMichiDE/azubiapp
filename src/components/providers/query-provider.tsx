'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, type ReactNode } from 'react'

// Query Provider Props
interface QueryProviderProps {
  children: ReactNode
}

// Query Provider Komponente
export function QueryProvider({ children }: QueryProviderProps) {
  // Query Client mit optimalen Einstellungen erstellen
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Standardeinstellungen für Queries
            staleTime: 5 * 60 * 1000, // 5 Minuten
            gcTime: 10 * 60 * 1000, // 10 Minuten (früher cacheTime)
            retry: (failureCount, error: any) => {
              // Bei 4xx Fehlern nicht wiederholen
              if (error?.status >= 400 && error?.status < 500) {
                return false
              }
              // Maximal 3 Versuche
              return failureCount < 3
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: true,
          },
          mutations: {
            // Standardeinstellungen für Mutations
            retry: 1,
            retryDelay: 1000,
            onError: (error: any) => {
              // Globale Fehlerbehandlung für Mutations
              console.error('Mutation error:', error)
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query DevTools nur in der Entwicklung */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}
