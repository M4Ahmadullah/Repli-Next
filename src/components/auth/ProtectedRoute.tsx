'use client'

import { useAuth, useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { ReactNode, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRoles?: string[]
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [] 
}: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in')
    }

    // Optional role-based access control
    if (isSignedIn && requiredRoles.length > 0) {
      const userRoles = user?.publicMetadata?.roles as string[] || []
      const hasRequiredRole = requiredRoles.some(role => 
        userRoles.includes(role)
      )

      if (!hasRequiredRole) {
        router.push('/unauthorized')
      }
    }
  }, [isSignedIn, isLoaded, router, requiredRoles, user])

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              Authenticating...
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="animate-spin" size={48} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
} 