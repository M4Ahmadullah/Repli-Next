'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, MessageCircle, TrendingUp, Clock } from 'lucide-react'

interface BotStatus {
  isActive: boolean
  lastActivity?: Date
  health: 'healthy' | 'unhealthy' | 'unknown'
  errorMessage?: string
  stats: {
    todayMessages: number
    totalMessages: number
    profileCompletions: number
    successRate: number
  }
}

interface BotStatusMonitorProps {
  userId: string
  refreshInterval?: number
}

export function BotStatusMonitor({ userId, refreshInterval = 30000 }: BotStatusMonitorProps) {
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchBotStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/bot/status/${userId}`)
      const data = await response.json()
      
      if (data.success) {
        setBotStatus(data.status)
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch bot status:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchBotStatus()
    const interval = setInterval(fetchBotStatus, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchBotStatus, refreshInterval])

  const getStatusColor = (health: string, isActive: boolean) => {
    if (!isActive) return 'secondary'
    switch (health) {
      case 'healthy': return 'default'
      case 'unhealthy': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusText = (health: string, isActive: boolean) => {
    if (!isActive) return 'Inactive'
    switch (health) {
      case 'healthy': return 'Active'
      case 'unhealthy': return 'Error'
      default: return 'Unknown'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            WhatsApp Bot Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Checking bot status...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            WhatsApp Bot Status
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true)
              fetchBotStatus()
            }}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          Real-time status of your WhatsApp AI bot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {botStatus && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge variant={getStatusColor(botStatus.health, botStatus.isActive)}>
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    botStatus.isActive && botStatus.health === 'healthy' 
                      ? 'bg-green-500' 
                      : 'bg-gray-400'
                  }`} />
                  {getStatusText(botStatus.health, botStatus.isActive)}
                </div>
              </Badge>
            </div>

            {botStatus.lastActivity && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Activity</span>
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="w-3 h-3" />
                  {new Date(botStatus.lastActivity).toLocaleString()}
                </div>
              </div>
            )}

            {botStatus.errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{botStatus.errorMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {botStatus.stats.todayMessages}
                </div>
                <div className="text-xs text-gray-600">Messages Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {botStatus.stats.totalMessages}
                </div>
                <div className="text-xs text-gray-600">Total Messages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {botStatus.stats.profileCompletions}
                </div>
                <div className="text-xs text-gray-600">Profiles Completed</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  <span className="text-2xl font-bold text-orange-600">
                    {botStatus.stats.successRate}%
                  </span>
                </div>
                <div className="text-xs text-gray-600">Success Rate</div>
              </div>
            </div>

            <div className="pt-2 text-xs text-gray-500 text-center">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
} 