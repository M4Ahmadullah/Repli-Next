'use client'

import { ClerkCustomProvider } from './providers/clerk-provider'
import { ThemeProvider } from './providers/theme-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useState } from 'react'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      },
    },
  }))

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ClerkCustomProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </ClerkCustomProvider>
      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={4000}
        toastOptions={{
          style: {
            background: '#10b981',
            color: 'white',
            border: '1px solid #059669',
          },
        }}
      />
    </ThemeProvider>
  )
} 