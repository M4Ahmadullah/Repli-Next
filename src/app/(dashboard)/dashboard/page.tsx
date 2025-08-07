'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { BotSelector } from '@/components/dashboard/bot-selector'
import { BotCreationWizard } from '@/components/dashboard/bot-creation-wizard'
import { BotSettingsModal } from '@/components/dashboard/bot-settings-modal'
import { PendingBotCard } from '@/components/dashboard/pending-bot-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useUser } from '@clerk/nextjs'
import { useState, useEffect, useCallback } from 'react'
import { usePendingBots } from '@/hooks/usePendingBots'
import { Bot as BotType } from '@/lib/types/user'
import { 
  Bot, 
  MessageSquare, 
  TrendingUp, 
  Check,
  AlertCircle,
  Sparkles,
  BarChart3,
  Zap,
  Clock,
  Settings,
  Plus
} from 'lucide-react'

import { DashboardSkeleton } from '@/components/ui/skeleton-loader'

interface UserData {
  id: string
  subscription: {
    plan: string
    dailyLimit: number
    status: string
  }
  bots: BotType[]
  activeBotId?: string
}

export default function DashboardPage() {
  const { user } = useUser()
  const [userData, setUserData] = useState<any>(null)
  const [activeBotId, setActiveBotId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBotWizard, setShowBotWizard] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [selectedBot, setSelectedBot] = useState<any>(null)
  
  // Use the pending bots hook
  const { 
    pendingBots, 
    completionStats, 
    loading: pendingLoading, 
    error: pendingError,
    checkPendingBots,
    updatePendingBot,
    removePendingBot
  } = usePendingBots()

  // WebSocket integration removed - only needed for QR display
  const isConnected = false // No persistent WebSocket connection needed

  const fetchUserData = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const botsResponse = await fetch('/api/bots')
      
      let bots: any[] = []
      if (botsResponse.ok) {
        const botsResponseData = await botsResponse.json()
        bots = botsResponseData.bots || []
      }

      // Set active bot if none selected
      if (!activeBotId && bots.length > 0) {
        const activeBot = bots.find(bot => bot.status === 'active') || bots[0]
        setActiveBotId(activeBot.id)
      }

      setUserData({
        bots: bots,
        stats: null // Load stats on demand
      })
    } catch (error) {
      console.error('Error fetching user data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [user?.id, activeBotId])

  useEffect(() => {
    if (user) {
      // Load data in background without blocking UI
      fetchUserData()
    }
  }, [user?.id])

  // Define all callback functions first
  const handleBotCreated = useCallback((bot: BotType) => {
    setUserData((prev: any) => prev ? {
      ...prev,
      bots: [...prev.bots, bot]
    } : null)
    
    // Set as active bot if no active bot
    if (!activeBotId) {
    setActiveBotId(bot.id)
    }
    
    setShowBotWizard(false)
  }, [activeBotId])

  const handleBotChange = useCallback((botId: string) => {
    console.log('🔄 [DEBUG] Switching to bot:', botId)
    setActiveBotId(botId)
  }, [])

  const handleBotUpdated = (bot: BotType) => {
    setUserData((prev: any) => prev ? {
      ...prev,
      bots: prev.bots.map((b: any) => b.id === bot.id ? bot : b)
    } : null)
  }

  const handleCreateBot = () => {
    setShowBotWizard(true)
  }

  const handleDeleteBot = useCallback(async (botId: string) => {
    try {
      // Call the actual backend API to delete the bot
      const response = await fetch(`/api/bots/${botId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Update local state after successful backend deletion
        setUserData((prev: any) => {
          if (!prev) return null
          
          const updatedBots = prev.bots.filter((bot: any) => bot.id !== botId)
          
          return {
            ...prev,
            bots: updatedBots
          }
        })
        
        // If the deleted bot was active, select another bot
        if (activeBotId === botId) {
          setUserData((prev: any) => {
            if (!prev) return null
            
            const remainingBots = prev.bots.filter((bot: any) => bot.id !== botId)
            if (remainingBots.length > 0) {
              setActiveBotId(remainingBots[0].id)
            } else {
              setActiveBotId(null)
            }
            
            return prev
          })
        }
      } else {
        throw new Error(result.error || 'Failed to delete bot');
      }
    } catch (error) {
      console.error('❌ Bot deletion failed:', error);
      throw error; // Re-throw so the modal can show the error
    }
  }, [activeBotId])

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Access Denied</CardTitle>
              <CardDescription>
                You need to be signed in to view this page.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => window.location.href = '/sign-in'} className="btn-primary">
                <Sparkles className="w-5 h-5 mr-2" />
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Dashboard Error</CardTitle>
              <CardDescription>
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => window.location.reload()} className="btn-primary">
                <Sparkles className="w-5 h-5 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <DashboardSkeleton />
        </div>
      </DashboardLayout>
    )
  }

  // Get active bot data
  const activeBot = userData?.bots?.find((bot: any) => bot.id === activeBotId) || null

  // Check if bot is incomplete
  const isIncompleteBot = (bot: any) => {
    return ['creating', 'training', 'connecting'].includes(bot.status)
  }

  // Get bot status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500'
      case 'creating':
        return 'bg-blue-500'
      case 'connecting':
        return 'bg-orange-500'
      case 'training':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Get bot status text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'creating':
        return 'Creating'
      case 'connecting':
        return 'Connecting'
      case 'training':
        return 'Training'
      default:
        return 'Unknown'
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
            Welcome back, {user.firstName || 'there'}! 👋
          </h1>
            <div className="flex items-center gap-4">
              {/* Create Bot Button */}
              <Button 
                onClick={handleCreateBot}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Bot
              </Button>
            {/* WebSocket Status Indicator */}
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-gray-600">
                  {isConnected ? 'Live' : 'Offline'}
              </span>
              <span className="text-xs text-gray-500">
                Updated {new Date().toLocaleTimeString()}
              </span>
              </div>
            </div>
          </div>
          <p className="text-emerald-600 dark:text-emerald-400">
            Manage your AI-powered WhatsApp bots from your command center
          </p>
        </div>

        {/* Bot Selector */}
        <BotSelector
          activeBotId={activeBotId || undefined}
          bots={userData?.bots || []}
          onBotChange={handleBotChange}
          onCreateBot={handleCreateBot}
        />

        {/* All Bot Cards */}
        {userData?.bots && userData.bots.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">
                Your Bots
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userData.bots.map((bot: BotType) => (
                <PendingBotCard
                  key={bot.id}
                  bot={bot}
                  onBotUpdated={handleBotUpdated}
                  onOpenSettings={() => {
                    setSelectedBot(bot)
                    setShowSettingsModal(true)
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pending Bot Cards */}
        {userData?.bots && userData.bots.filter((bot: any) => 
          ['creating', 'training', 'connecting'].includes(bot.status)
        ).length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              <h2 className="text-xl font-semibold text-orange-900 dark:text-orange-100">
                Complete Bot Setup
              </h2>
                </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userData.bots
                .filter((bot: any) => ['creating', 'training', 'connecting'].includes(bot.status))
                .map((bot: BotType) => (
                  <PendingBotCard
                    key={bot.id}
                    bot={bot}
                    onBotUpdated={handleBotUpdated}
                    onOpenSettings={() => {
                      setSelectedBot(bot)
                      setShowSettingsModal(true)
                    }}
                  />
                ))}
                </div>
          </div>
        )}

        {/* Main Dashboard Content */}
        <div className="space-y-6">
          {/* Active Bot Stats */}
          {activeBot && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Active Bot: {activeBot.name}
                </h2>
                <Badge className={`${getStatusColor(activeBot.status)} text-white`}>
                  {getStatusText(activeBot.status)}
                </Badge>
              </div>

              {/* Bot Status and Actions */}
              <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700 rounded-xl shadow-sm">
                <CardHeader>
                  <CardTitle className="text-emerald-900 dark:text-emerald-100">
                    Bot Status & Actions
                  </CardTitle>
                  <CardDescription className="text-emerald-600 dark:text-emerald-400">
                    Monitor your bot's performance and manage settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-800/50 rounded-lg">
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                          Total Messages
                        </p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {activeBot.analytics?.totalMessages || 0}
                        </p>
                    </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-800/50 rounded-lg">
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                          Response Rate
                        </p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {activeBot.analytics?.responseRate || 0}%
                        </p>
                  </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-800/50 rounded-lg">
                      <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                        <Clock className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                          Avg Response Time
                        </p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {activeBot.analytics?.averageResponseTime ?
                            `${Math.round(activeBot.analytics.averageResponseTime)}ms` :
                            'N/A'
                          }
                        </p>
                      </div>
                    </div>
                      </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      onClick={() => {
                        setSelectedBot(activeBot)
                        setShowSettingsModal(true)
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Bot Settings
                    </Button>
                    <Button variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Analytics
                      </Button>
                    </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Bot Creation Wizard */}
          {showBotWizard && (
            <BotCreationWizard
              isOpen={showBotWizard}
              onBotCreated={handleBotCreated}
              onClose={() => setShowBotWizard(false)}
            />
          )}
        </div>
      </div>

      {/* Bot Settings Modal */}
      {showSettingsModal && selectedBot && (
        <BotSettingsModal
          isOpen={showSettingsModal}
          onClose={() => {
            setShowSettingsModal(false)
            setSelectedBot(null)
          }}
          bot={selectedBot}
          onDeleteBot={handleDeleteBot}
        />
      )}
    </DashboardLayout>
  )
} 