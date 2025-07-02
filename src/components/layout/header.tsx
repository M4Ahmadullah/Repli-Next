'use client'

import Link from 'next/link'
import { useAuth, UserButton } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { 
  Menu, 
  X, 
  Bot, 
  Sparkles, 
  BarChart3,
  Zap,
  Shield,
  ArrowRight
} from 'lucide-react'

export function Header() {
  const { isSignedIn, isLoaded } = useAuth()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  
  // Check if we're on an auth page
  const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up')

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { 
      name: 'Features', 
      href: '/#features',
      icon: Zap,
      description: 'Discover AI capabilities'
    },
    { 
      name: 'Pricing', 
      href: '/pricing',
      icon: BarChart3,
      description: 'Simple, transparent plans'
    },
    { 
      name: 'About', 
      href: '/#about',
      icon: Shield,
      description: 'Learn about Repli'
    }
  ]

  if (!isLoaded) {
    return (
      <header className="sticky top-0 z-50 navbar-glass">
        <div className="container-responsive">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 animate-pulse"></div>
              <div className="w-20 h-6 bg-green-200 dark:bg-green-800 rounded-lg animate-pulse"></div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="w-16 h-6 bg-green-200 dark:bg-green-800 rounded-lg animate-pulse"></div>
              <div className="w-16 h-6 bg-green-200 dark:bg-green-800 rounded-lg animate-pulse"></div>
              <div className="w-20 h-10 bg-green-200 dark:bg-green-800 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className={`sticky top-0 z-50 transition-all duration-500 ${
      isScrolled 
        ? 'navbar-glass shadow-xl shadow-green-500/10' 
        : 'bg-transparent'
    }`}>
      <div className="container-responsive">
        <div className="flex items-center h-20 relative">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-4 group absolute left-0">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 flex items-center justify-center shadow-xl shadow-green-500/30 transition-all duration-300 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-green-500/40">
                <Bot className="w-7 h-7 text-white animate-float-gentle" />
              </div>
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold gradient-text-vibrant">Repli</span>
            </div>
          </Link>

          {/* Desktop Navigation - Hidden on auth pages */}
          {!isAuthPage && (
            <nav className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
              {navItems.map((item) => (
                <div key={item.name} className="relative group">
                  <Link href={item.href} className="navbar-item flex items-center space-x-2 px-4 py-2 rounded-xl">
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                  
                  {/* Tooltip */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-green-900/95 text-green-100 text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none backdrop-blur-md border border-green-700/50 shadow-xl whitespace-nowrap">
                    {item.description}
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-green-900/95 rotate-45 border-t border-l border-green-700/50"></div>
                  </div>
                </div>
              ))}
            </nav>
          )}

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-4 absolute right-0">
            <ThemeToggle />
            {!isAuthPage && isSignedIn && (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button className="btn-secondary">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <UserButton />
              </div>
            )}
            {!isAuthPage && !isSignedIn && (
              <div className="flex items-center space-x-4">
                <Link href="/sign-in">
                  <Button className="btn-secondary">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button className="btn-primary group">
                    <Sparkles className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                    Start Free
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-3 absolute right-0">
            <ThemeToggle className="scale-90" />
            {!isAuthPage && (
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-xl transition-all duration-300"
                >
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="right" 
                className="w-80 bg-gradient-to-br from-white/95 to-green-50/90 dark:from-green-950/95 dark:to-emerald-950/90 backdrop-blur-xl border-none shadow-2xl"
              >
                <div className="flex flex-col h-full">
                  {/* Mobile Header */}
                  <div className="flex items-center justify-between pb-6 border-b border-green-200/30 dark:border-green-700/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <span className="text-xl font-bold gradient-text">Repli</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <ThemeToggle className="scale-90" />
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-xl"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Navigation */}
                  <nav className="flex-1 py-6">
                    <div className="space-y-3">
                      {navItems.map((item) => (
                        <Link 
                          key={item.name}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center space-x-4 p-4 rounded-2xl bg-white/50 dark:bg-green-900/30 hover:bg-green-50 dark:hover:bg-green-900/50 transition-all duration-300 group hover:scale-105 hover:shadow-lg"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                            <item.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-green-800 dark:text-green-100">{item.name}</div>
                            <div className="text-sm text-green-600 dark:text-green-400">{item.description}</div>
                          </div>
                          <ArrowRight className="w-5 h-5 text-green-500 group-hover:translate-x-1 transition-transform duration-300" />
                        </Link>
                      ))}
                    </div>
                  </nav>

                  {/* Mobile Auth */}
                  <div className="pt-6 border-t border-green-200/30 dark:border-green-700/30">
                    {isSignedIn ? (
                      <div className="space-y-4">
                        <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button className="w-full btn-primary">
                            <BarChart3 className="w-5 h-5 mr-3" />
                            Go to Dashboard
                            <ArrowRight className="w-5 h-5 ml-3" />
                          </Button>
                        </Link>
                        <div className="flex items-center justify-center p-4 bg-green-50 dark:bg-green-900/30 rounded-2xl">
                          <UserButton />
                          <span className="ml-3 text-green-700 dark:text-green-300 font-medium">Account Settings</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Link href="/sign-in" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button className="w-full btn-secondary">
                            Sign In
                          </Button>
                        </Link>
                        <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)}>
                          <Button className="w-full btn-primary">
                            <Sparkles className="w-5 h-5 mr-3" />
                            Start Free Trial
                            <ArrowRight className="w-5 h-5 ml-3" />
                          </Button>
                        </Link>
                        
                        {/* Mobile CTA */}
                        <div className="mt-6 p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-2xl">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-green-800 dark:text-green-100">Free Trial</h4>
                              <p className="text-xs text-green-600 dark:text-green-400">No credit card required</p>
                            </div>
                          </div>
                          <ul className="space-y-2 text-sm text-green-700 dark:text-green-300">
                            <li className="flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                              <span>10 free messages daily</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                              <span>Setup in 2 minutes</span>
                            </li>
                            <li className="flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                              <span>AI-powered responses</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 