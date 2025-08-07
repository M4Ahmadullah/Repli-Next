import React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface SkeletonProps {
  className?: string
  variant?: 'default' | 'card' | 'bot-card' | 'text' | 'avatar' | 'button'
  lines?: number
  width?: string
  height?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  variant = 'default',
  lines = 1,
  width,
  height 
}) => {
  const baseClasses = "animate-pulse bg-gradient-to-r from-emerald-400/40 via-emerald-300/60 to-emerald-400/40 dark:from-emerald-500/40 dark:via-emerald-400/60 dark:to-emerald-500/40 rounded-lg backdrop-blur-xl border border-emerald-300/50 dark:border-emerald-400/50 shadow-lg shadow-emerald-300/20 dark:shadow-emerald-400/20"
  
  if (variant === 'card') {
    return (
      <div className={cn("bg-gradient-to-br from-emerald-50/60 via-white/40 to-emerald-100/60 dark:from-emerald-900/30 dark:via-gray-800/40 dark:to-emerald-800/30 rounded-xl shadow-lg border border-emerald-200/50 dark:border-emerald-700/50 p-6 backdrop-blur-xl", className)}>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-400/50 via-emerald-300/60 to-emerald-400/50 dark:from-emerald-500/50 dark:via-emerald-400/60 dark:to-emerald-500/50 rounded-full backdrop-blur-xl border border-emerald-300/50 dark:border-emerald-400/50 shadow-inner shadow-emerald-300/30 dark:shadow-emerald-400/30"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gradient-to-r from-emerald-400/50 via-emerald-300/60 to-emerald-400/50 dark:from-emerald-500/50 dark:via-emerald-400/60 dark:to-emerald-500/50 rounded w-3/4 backdrop-blur-xl border border-emerald-300/50 dark:border-emerald-400/50 shadow-inner shadow-emerald-300/30 dark:shadow-emerald-400/30"></div>
              <div className="h-3 bg-gradient-to-r from-emerald-400/50 via-emerald-300/60 to-emerald-400/50 dark:from-emerald-500/50 dark:via-emerald-400/60 dark:to-emerald-500/50 rounded w-1/2 backdrop-blur-xl border border-emerald-300/50 dark:border-emerald-400/50 shadow-inner shadow-emerald-300/30 dark:shadow-emerald-400/30"></div>
            </div>
          </div>
          <div className="space-y-2">
            {Array.from({ length: lines }).map((_, i) => (
              <div key={i} className="h-3 bg-gradient-to-r from-emerald-400/50 via-emerald-300/60 to-emerald-400/50 dark:from-emerald-500/50 dark:via-emerald-400/60 dark:to-emerald-500/50 rounded backdrop-blur-xl border border-emerald-300/50 dark:border-emerald-400/50 shadow-inner shadow-emerald-300/30 dark:shadow-emerald-400/30" style={{ width: `${100 - (i * 10)}%` }}></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'bot-card') {
    return (
      <div className={cn("bg-gradient-to-br from-emerald-50/60 via-white/40 to-emerald-100/60 dark:from-emerald-900/30 dark:via-gray-800/40 dark:to-emerald-800/30 rounded-xl shadow-lg border border-emerald-200/50 dark:border-emerald-700/50 p-6 backdrop-blur-xl", className)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500/50 via-emerald-400/60 to-emerald-500/50 dark:from-emerald-600/50 dark:via-emerald-500/60 dark:to-emerald-600/50 rounded-xl backdrop-blur-xl border border-emerald-400/50 dark:border-emerald-500/50 shadow-inner shadow-emerald-400/30 dark:shadow-emerald-500/30"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gradient-to-r from-emerald-400/50 via-emerald-300/60 to-emerald-400/50 dark:from-emerald-500/50 dark:via-emerald-400/60 dark:to-emerald-500/50 rounded w-32 backdrop-blur-xl border border-emerald-300/50 dark:border-emerald-400/50 shadow-inner shadow-emerald-300/30 dark:shadow-emerald-400/30"></div>
                <div className="h-3 bg-gradient-to-r from-emerald-400/50 via-emerald-300/60 to-emerald-400/50 dark:from-emerald-500/50 dark:via-emerald-400/60 dark:to-emerald-500/50 rounded w-24 backdrop-blur-xl border border-emerald-300/50 dark:border-emerald-400/50 shadow-inner shadow-emerald-300/30 dark:shadow-emerald-400/30"></div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-400/50 via-emerald-300/60 to-emerald-400/50 dark:from-emerald-500/50 dark:via-emerald-400/60 dark:to-emerald-500/50 rounded-lg backdrop-blur-xl border border-emerald-300/50 dark:border-emerald-400/50 shadow-inner shadow-emerald-300/30 dark:shadow-emerald-400/30"></div>
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-400/50 via-emerald-300/60 to-emerald-400/50 dark:from-emerald-500/50 dark:via-emerald-400/60 dark:to-emerald-500/50 rounded-lg backdrop-blur-xl border border-emerald-300/50 dark:border-emerald-400/50 shadow-inner shadow-emerald-300/30 dark:shadow-emerald-400/30"></div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="h-8 bg-gradient-to-r from-emerald-400/50 via-emerald-300/60 to-emerald-400/50 dark:from-emerald-500/50 dark:via-emerald-400/60 dark:to-emerald-500/50 rounded mb-1 backdrop-blur-xl border border-emerald-300/50 dark:border-emerald-400/50 shadow-inner shadow-emerald-300/30 dark:shadow-emerald-400/30"></div>
              <div className="h-3 bg-gradient-to-r from-emerald-400/50 via-emerald-300/60 to-emerald-400/50 dark:from-emerald-500/50 dark:via-emerald-400/60 dark:to-emerald-500/50 rounded w-12 mx-auto backdrop-blur-xl border border-emerald-300/50 dark:border-emerald-400/50 shadow-inner shadow-emerald-300/30 dark:shadow-emerald-400/30"></div>
            </div>
            <div className="text-center">
              <div className="h-8 bg-gradient-to-r from-emerald-400/50 via-emerald-300/60 to-emerald-400/50 dark:from-emerald-500/50 dark:via-emerald-400/60 dark:to-emerald-500/50 rounded mb-1 backdrop-blur-xl border border-emerald-300/50 dark:border-emerald-400/50 shadow-inner shadow-emerald-300/30 dark:shadow-emerald-400/30"></div>
              <div className="h-3 bg-gradient-to-r from-emerald-400/50 via-emerald-300/60 to-emerald-400/50 dark:from-emerald-500/50 dark:via-emerald-400/60 dark:to-emerald-500/50 rounded w-12 mx-auto backdrop-blur-xl border border-emerald-300/50 dark:border-emerald-400/50 shadow-inner shadow-emerald-300/30 dark:shadow-emerald-400/30"></div>
            </div>
            <div className="text-center">
              <div className="h-8 bg-gradient-to-r from-emerald-400/50 via-emerald-300/60 to-emerald-400/50 dark:from-emerald-500/50 dark:via-emerald-400/60 dark:to-emerald-500/50 rounded mb-1 backdrop-blur-xl border border-emerald-300/50 dark:border-emerald-400/50 shadow-inner shadow-emerald-300/30 dark:shadow-emerald-400/30"></div>
              <div className="h-3 bg-gradient-to-r from-emerald-400/50 via-emerald-300/60 to-emerald-400/50 dark:from-emerald-500/50 dark:via-emerald-400/60 dark:to-emerald-500/50 rounded w-12 mx-auto backdrop-blur-xl border border-emerald-300/50 dark:border-emerald-400/50 shadow-inner shadow-emerald-300/30 dark:shadow-emerald-400/30"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className={cn(baseClasses, className)}
            style={{ 
              width: width || `${100 - (i * 15)}%`,
              height: height || '1rem'
            }}
          ></div>
        ))}
      </div>
    )
  }

  if (variant === 'avatar') {
    return (
      <div 
        className={cn(baseClasses, "rounded-full", className)}
        style={{ width: width || '2.5rem', height: height || '2.5rem' }}
      ></div>
    )
  }

  if (variant === 'button') {
    return (
      <div 
        className={cn(baseClasses, "rounded-lg", className)}
        style={{ width: width || '6rem', height: height || '2.5rem' }}
      ></div>
    )
  }

  return (
    <div 
      className={cn(baseClasses, className)}
      style={{ width: width || '100%', height: height || '1rem' }}
    ></div>
  )
}

// Bot Selector Skeleton
export const BotSelectorSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <Skeleton variant="bot-card" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} variant="card" />
        ))}
      </div>
    </div>
  )
}

// Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
      </div>

      {/* Bot Selector Skeleton */}
      <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700 rounded-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
              </div>
            </div>
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center space-y-2">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bot Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700 rounded-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-20"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8"></div>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                </div>
                <div className="space-y-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                </div>
              </div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 