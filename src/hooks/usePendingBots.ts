'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'

interface PendingBot {
  id: string
  name: string
  status: 'creating' | 'connecting' | 'training' | 'active'
  progress: number
  whatsappConnected: boolean
  createdAt: string
  updatedAt: string
}

interface PendingBotsData {
  pendingBots: PendingBot[]
  totalPending: number
  completionStats: {
    creating: number
    connecting: number
    training: number
    active: number
  }
}

export const usePendingBots = () => {
  const { user } = useUser()
  const [pendingBots, setPendingBots] = useState<PendingBot[]>([])
  const [completionStats, setCompletionStats] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkPendingBots = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      // Get all bots and filter for pending ones
      const response = await fetch('/api/bots')
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.bots) {
          // Filter for pending bots (creating, connecting, training)
          const pendingBots = data.bots.filter((bot: any) => 
            ['creating', 'connecting', 'training'].includes(bot.status)
          )
          
          setPendingBots(pendingBots)
          
          // Calculate completion stats
          const stats = {
            creating: pendingBots.filter((b: any) => b.status === 'creating').length,
            connecting: pendingBots.filter((b: any) => b.status === 'connecting').length,
            training: pendingBots.filter((b: any) => b.status === 'training').length,
            active: data.bots.filter((b: any) => b.status === 'active').length
          }
          
          setCompletionStats(stats)
        } else {
          setError(data.error?.message || 'Failed to fetch bots')
        }
      } else {
        setError('Failed to fetch bots')
      }
    } catch (error) {
      console.error('Error checking pending bots:', error)
      setError('Failed to check pending bots')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const updatePendingBot = useCallback((botId: string, updates: Partial<PendingBot>) => {
    setPendingBots(prev => 
      prev.map(bot => 
        bot.id === botId 
          ? { ...bot, ...updates }
          : bot
      )
    )
  }, [])

  const removePendingBot = useCallback((botId: string) => {
    setPendingBots(prev => prev.filter(bot => bot.id !== botId))
  }, [])

  useEffect(() => {
    if (user?.id) {
    checkPendingBots()
    }
  }, [user?.id])

  return {
    pendingBots,
    completionStats,
    loading,
    error,
    checkPendingBots,
    updatePendingBot,
    removePendingBot
  }
} 