'use client'

import { usePathname } from 'next/navigation'
import { Header } from './header'
import { Footer } from './footer'
import { AuthLoadingWrapper } from './auth-loading-wrapper'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Check if we're on an auth page
  const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up')
  
  // Check if we're on a dashboard page
  const isDashboardPage = pathname?.startsWith('/dashboard')
  
  if (isAuthPage) {
    // Auth pages: header with just logo and theme toggle, no footer
    return (
      <div className="min-h-screen">
        <Header />
        <main>
          {children}
        </main>
      </div>
    )
  }
  
  if (isDashboardPage) {
    // Dashboard pages: wrap with auth loading wrapper and no header/footer
    return (
      <AuthLoadingWrapper>
        {children}
      </AuthLoadingWrapper>
    )
  }
  
  // Regular pages: include header and footer
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950 dark:via-green-950 dark:to-teal-950">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
} 