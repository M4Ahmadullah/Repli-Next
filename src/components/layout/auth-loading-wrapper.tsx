'use client'

import { useAuth } from '@clerk/nextjs'
import { LoadingWidget } from '@/components/ui/loading-widget'

interface AuthLoadingWrapperProps {
  children: React.ReactNode
}

export function AuthLoadingWrapper({ children }: AuthLoadingWrapperProps) {
  const { isLoaded } = useAuth()

  // Show loading widget while Clerk is loading
  if (!isLoaded) {
    return <LoadingWidget title="Loading Repli" description="Preparing your dashboard..." showStats={true} />
  }

  // Once loaded, render children (middleware will handle auth protection)
  return <>{children}</>
} 