'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Wifi, 
  WifiOff, 
  MessageSquare, 
  Clock, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { io, Socket } from 'socket.io-client'

interface RealTimeData {
  messageCount: number
  connectionStatus: 'connected' | 'disconnected' | 'connecting'
  lastActivity: Date | null
  responseTime: number
  todayMessages: number
  totalMessages: number
}

interface RealTimeStatusProps {
  botId?: string
  className?: string
}

export function RealTimeStatus({ botId, className }: RealTimeStatusProps) {
  const { user } = useUser()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [data, setData] = useState<RealTimeData>({
    messageCount: 0,
    connectionStatus: 'disconnected',
    lastActivity: null,
    responseTime: 0,
    todayMessages: 0,
    totalMessages: 0
  })

  useEffect(() => {
    if (!user?.id) return

    // Initialize WebSocket connection
    const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:8001'
    const newSocket = io(socketUrl, {
      auth: {
        userId: user.id,
        botId: botId
      },
      transports: ['websocket', 'polling']
    })

    // Connection event handlers
    newSocket.on('connect', () => {
      setIsConnected(true)
      setData(prev => ({ ...prev, connectionStatus: 'connected' }))
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      setData(prev => ({ ...prev, connectionStatus: 'disconnected' }))
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setIsConnected(false)
      setData(prev => ({ ...prev, connectionStatus: 'disconnected' }))
    })

    // Real-time data event handlers
    newSocket.on('status_update', (update: Partial<RealTimeData>) => {
      setData(prev => ({
        ...prev,
        ...update,
        lastActivity: update.lastActivity ? new Date(update.lastActivity) : prev.lastActivity
      }))
    })

    newSocket.on('message_count', (count: number) => {
      setData(prev => ({ ...prev, messageCount: count }))
    })

    newSocket.on('today_messages', (count: number) => {
      setData(prev => ({ ...prev, todayMessages: count }))
    })

    newSocket.on('total_messages', (count: number) => {
      setData(prev => ({ ...prev, totalMessages: count }))
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [user?.id, botId])

  // Fallback to polling if WebSocket fails (DISABLED to reduce requests)
  // useEffect(() => {
  //   if (!isConnected && user?.id) {
  //     const interval = setInterval(async () => {
  //       try {
  //         const response = await fetch(`/api/bot/status/${user.id}${botId ? `?botId=${botId}` : ''}`)
  //         if (response.ok) {
  //         const statusData = await response.json()
  //         setData(prev => ({
  //           ...prev,
  //           ...statusData,
  //           lastActivity: statusData.lastActivity ? new Date(statusData.lastActivity) : prev.lastActivity
  //         }))
  //       }
  //     } catch (error) {
  //       console.error('Failed to fetch status:', error)
  //     }
  //   }, 30000) // Poll every 30 seconds as fallback

  //   return () => clearInterval(interval)
  // }
  // }, [isConnected, user?.id, botId])

  const getConnectionIcon = () => {
    switch (data.connectionStatus) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case 'connecting':
        return <Loader2 className="w-5 h-5 text-yellow-500 animate-spin" />
      case 'disconnected':
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />
    }
  }

  const getConnectionBadge = () => {
    switch (data.connectionStatus) {
      case 'connected':
        return <Badge className="bg-emerald-500 text-white">Connected</Badge>
      case 'connecting':
        return <Badge className="bg-yellow-500 text-white">Connecting</Badge>
      case 'disconnected':
      default:
        return <Badge className="bg-red-500 text-white">Disconnected</Badge>
    }
  }

  const formatLastActivity = (date: Date | null) => {
    if (!date) return 'Never'
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`
    return `${Math.floor(minutes / 1440)}d ago`
  }

  return (
    <div className={className}>
      <Card className="elegant-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getConnectionIcon()}
              <div>
                <CardTitle className="text-lg text-green-800 dark:text-green-100">
                  Real-time Status
                </CardTitle>
                <CardDescription className="text-green-600 dark:text-green-300">
                  Live bot performance monitoring
                </CardDescription>
              </div>
            </div>
            {getConnectionBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today's Messages */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-100/80 to-green-100/80 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl border border-emerald-200 dark:border-emerald-700">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-800 dark:text-green-100">
                  {data.todayMessages}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">Today</p>
              </div>
            </div>

            {/* Total Messages */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-100/80 to-teal-100/80 dark:from-green-900/30 dark:to-teal-900/30 rounded-xl border border-green-200 dark:border-green-700">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-800 dark:text-green-100">
                  {data.totalMessages}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">Total</p>
              </div>
            </div>

            {/* Response Time */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-teal-100/80 to-emerald-100/80 dark:from-teal-900/30 dark:to-emerald-900/30 rounded-xl border border-teal-200 dark:border-teal-700">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-800 dark:text-green-100">
                  {data.responseTime}ms
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">Response</p>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-100/80 to-teal-100/80 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-xl border border-emerald-200 dark:border-emerald-700">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                {isConnected ? (
                  <Wifi className="w-5 h-5 text-white" />
                ) : (
                  <WifiOff className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <p className="text-lg font-bold text-green-800 dark:text-green-100">
                  {isConnected ? 'Live' : 'Offline'}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {formatLastActivity(data.lastActivity)}
                </p>
              </div>
            </div>
          </div>

          {/* Connection Details */}
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">WebSocket Status:</span>
              <span className={`font-medium ${isConnected ? 'text-emerald-600' : 'text-red-600'}`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600 dark:text-gray-400">Last Update:</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {formatLastActivity(data.lastActivity)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 