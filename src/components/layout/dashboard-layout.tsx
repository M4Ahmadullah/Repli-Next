'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Bot, 
  BarChart3, 
  MessageSquare, 
  Settings, 
  Users, 
  CreditCard,
  Menu,
  X,
  Home,
  Bell,
  Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { NotificationDropdown } from '@/components/ui/notification-dropdown'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const sidebarItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: Home,
    description: 'Dashboard overview'
  },
  {
    title: 'Bots',
    href: '/dashboard/bots',
    icon: Bot,
    description: 'Manage your AI bots'
  },
  {
    title: 'Conversations',
    href: '/dashboard/conversations',
    icon: MessageSquare,
    description: 'View conversations'
  },
  {
    title: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    description: 'Performance metrics'
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Bot configuration'
  },
  {
    title: 'Team',
    href: '/dashboard/team',
    icon: Users,
    description: 'Team management'
  },
  {
    title: 'Billing',
    href: '/dashboard/billing',
    icon: CreditCard,
    description: 'Subscription & billing'
  }
]

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useUser()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-emerald-950">
      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-emerald-900 border-r border-emerald-200 dark:border-emerald-700 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        
        {/* Sidebar Header - Same height as navbar */}
        <div className="flex items-center h-16 px-4 border-b border-emerald-200 dark:border-emerald-700 relative">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-emerald-900 dark:text-emerald-100">Repli</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center mx-auto">
              <Bot className="w-5 h-5 text-white" />
            </div>
          )}
          
          {/* Toggle button positioned at the right edge of sidebar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`hidden lg:flex text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 absolute ${
              sidebarCollapsed ? 'right-1' : 'right-2'
            } top-1/2 transform -translate-y-1/2`}
          >
            {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-emerald-600 hover:text-emerald-700 absolute right-2 top-1/2 transform -translate-y-1/2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  active 
                    ? 'bg-emerald-100 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-600' 
                    : 'text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-800/30'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center justify-center w-5 h-5">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                </div>
                {!sidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.title}</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 truncate">{item.description}</div>
                  </div>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        {/* Top Navigation */}
        <header className="bg-white dark:bg-emerald-900 border-b border-emerald-200 dark:border-emerald-700 px-4 lg:px-6 py-4 h-16 flex items-center">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden text-emerald-600 hover:text-emerald-700"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-emerald-400" />
                <Input 
                  placeholder="Search..." 
                  className="pl-10 w-48 lg:w-64 bg-emerald-50 dark:bg-emerald-800 border-emerald-200 dark:border-emerald-600 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Badge className="hidden sm:inline-flex bg-emerald-100 text-emerald-700 dark:bg-emerald-800/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-600">
                Free Plan
              </Badge>
              
              <ThemeToggle />
              
              <NotificationDropdown />

              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                    userButtonPopoverCard: "bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700",
                    userButtonPopoverActionButton: "text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-800"
                  }
                }}
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
} 