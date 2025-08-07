'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface BotStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  services: {
    ai: { status: string, lastChecked: string }
    whatsapp: { status: string, lastChecked: string }
    firebase: { status: string, lastChecked: string }
  }
  uptime: number
  system: {
    memory: { 
      total: number, 
      used: number, 
      percentage: number 
    }
  }
  warnings?: string[]
}

export function BotStatusMonitor({ userId }: { userId: string }) {
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBotStatus = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/bot/status?userId=${userId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch bot status')
        }
        
        const data = await response.json()
        setBotStatus(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
        setBotStatus(null)
      } finally {
        setLoading(false)
      }
    }

    // Initial fetch
    fetchBotStatus()

    // Periodic refresh every 30 seconds
    const intervalId = setInterval(fetchBotStatus, 30000)

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId)
  }, [userId])

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'healthy': return <CheckCircle2 className="text-green-500" />
      case 'degraded': return <AlertCircle className="text-yellow-500" />
      case 'unhealthy': return <AlertCircle className="text-red-500" />
      default: return <Loader2 className="animate-spin" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bot Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <Loader2 className="animate-spin mr-2" /> Loading status...
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bot Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">
            <AlertCircle className="inline mr-2" />
            {error}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          Bot Status 
          {botStatus && getStatusIcon(botStatus.status)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Overall Status */}
          <div className="flex justify-between items-center">
            <span>Overall Status:</span>
            <Badge 
              variant={
                botStatus?.status === 'healthy' ? 'default' : 
                botStatus?.status === 'degraded' ? 'secondary' : 'destructive'
              }
            >
              {botStatus?.status}
            </Badge>
          </div>

          {/* Service Statuses */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Service Health</h4>
            {Object.entries(botStatus?.services || {}).map(([service, details]) => (
              <div key={service} className="flex justify-between items-center">
                <span className="capitalize">{service} Service:</span>
                <div className="flex items-center">
                  <Badge 
                    variant={
                      details.status === 'healthy' ? 'default' : 
                      details.status === 'degraded' ? 'secondary' : 'destructive'
                    }
                    className="mr-2"
                  >
                    {details.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Last checked: {new Date(details.lastChecked).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* System Metrics */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">System Metrics</h4>
            <div className="flex justify-between">
              <span>Uptime:</span>
              <span>{Math.floor((botStatus?.uptime || 0) / 60)} minutes</span>
            </div>
            <div className="flex justify-between">
              <span>Memory Usage:</span>
              <span>{botStatus?.system.memory.percentage}%</span>
            </div>
          </div>

          {/* Warnings */}
          {botStatus?.warnings && botStatus.warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-red-500">Warnings</h4>
              {botStatus.warnings.map((warning, index) => (
                <div key={index} className="flex items-center text-red-500">
                  <AlertCircle className="mr-2 w-4 h-4" />
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 