'use client'

import { ClerkProviderWrapper } from './providers/clerk-provider'
import { ThemeProvider } from './providers/theme-provider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
      <ClerkProviderWrapper>
        <QueryClientProvider client={queryClient}>
      {children}
        </QueryClientProvider>
      </ClerkProviderWrapper>
    </ThemeProvider>
  )
} 