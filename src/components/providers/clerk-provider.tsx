'use client'

import { ClerkProvider } from '@clerk/nextjs'

export function ClerkCustomProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      {children}
    </ClerkProvider>
  )
} 