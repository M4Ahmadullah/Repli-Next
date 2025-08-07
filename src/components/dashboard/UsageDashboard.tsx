'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, RefreshCw, MessageSquare, Users, TrendingUp, Activity } from 'lucide-react'

interface UsageData {
  totalMessages: number
  totalUsers: number
  averageResponseTime: number
  systemHealth: string
  last24Hours: {
    messages: number
    users: number
    avgResponseTime: number
  }
  activeBots: number
  totalBots: number
}

export default function UsageDashboard() {
  const { user } = useUser()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/usage/${user.id}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setUsage(data)
    } catch (error) {
      console.error('Error fetching usage:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch usage data')
    } finally {
      setLoading(false)
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage]);

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-500">Healthy</Badge>
      case 'degraded':
        return <Badge variant="secondary" className="bg-yellow-500">Degraded</Badge>
      case 'unhealthy':
        return <Badge variant="destructive">Unhealthy</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="w-6 h-6 animate-spin mr-2" />
          <span>Loading usage data...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Error: {error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            onClick={fetchUsage} 
            className="mt-4"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!usage) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            No usage data available
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Usage Dashboard</h2>
          <p className="text-gray-600">Monitor your bot usage and system performance</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">System Health:</span>
          {getHealthBadge(usage.systemHealth)}
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchUsage}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {usage.last24Hours.messages} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {usage.last24Hours.users} active in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.averageResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              {usage.last24Hours.avgResponseTime}ms avg last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bots</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usage.activeBots}</div>
            <p className="text-xs text-muted-foreground">
              of {usage.totalBots} total bots
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Response Time Performance</span>
              <span className="text-sm text-muted-foreground">
                {usage.averageResponseTime < 1000 ? 'Excellent' : 
                 usage.averageResponseTime < 2000 ? 'Good' : 'Needs Improvement'}
              </span>
            </div>
            <Progress 
              value={Math.max(0, 100 - (usage.averageResponseTime / 30))} 
              className="h-2" 
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Bot Utilization</span>
              <span className="text-sm text-muted-foreground">
                {usage.totalBots > 0 ? Math.round((usage.activeBots / usage.totalBots) * 100) : 0}%
              </span>
            </div>
            <Progress 
              value={usage.totalBots > 0 ? (usage.activeBots / usage.totalBots) * 100 : 0} 
              className="h-2" 
            />
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {usage.systemHealth === 'healthy' ? '✓' : '⚠'}
              </div>
              <p className="text-sm font-medium">System Health</p>
              <p className="text-xs text-gray-600">{usage.systemHealth}</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {usage.activeBots}
              </div>
              <p className="text-sm font-medium">Active Bots</p>
              <p className="text-xs text-gray-600">Running normally</p>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {usage.averageResponseTime}ms
              </div>
              <p className="text-sm font-medium">Avg Response</p>
              <p className="text-xs text-gray-600">System performance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 