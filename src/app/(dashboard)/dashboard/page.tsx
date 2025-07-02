'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { BotSelector } from '@/components/dashboard/bot-selector'
import { BotCreationWizard } from '@/components/dashboard/bot-creation-wizard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  Bot, 
  MessageSquare, 
  TrendingUp, 
  Settings, 
  BarChart3,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Check
} from 'lucide-react'
import { Bot as BotType } from '@/lib/types/user'

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
  const { user, isLoaded } = useUser()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [activeBotId, setActiveBotId] = useState<string | null>(null)
  const [showBotWizard, setShowBotWizard] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchUserData = useCallback(async () => {
    try {
      if (!user?.id) return

      // Fetch user data and bots
      const [userResponse, botsResponse] = await Promise.all([
        fetch(`/api/users/${user.id}`),
        fetch('/api/bots')
      ])

      let bots: BotType[] = []
      let subscription = { plan: 'free', dailyLimit: 10, status: 'active' }

      if (userResponse.ok) {
        const userResult = await userResponse.json()
        if (userResult.success) {
          subscription = userResult.user.subscription
        }
      }

      if (botsResponse.ok) {
        const botsResult = await botsResponse.json()
        if (botsResult.success) {
          bots = botsResult.bots || []
        }
      }

      // Set active bot to first bot if none selected
      if (bots.length > 0 && !activeBotId) {
        setActiveBotId(bots[0].id)
      }

      setUserData({
        id: user.id,
        subscription,
        bots,
        activeBotId: activeBotId || bots[0]?.id
      })

    } catch (error) {
      console.error('Failed to fetch user data:', error)
      // Fallback to default data structure
      setUserData({
        id: user?.id || '',
        subscription: {
          plan: 'free',
          dailyLimit: 10,
          status: 'active'
        },
        bots: [],
        activeBotId: undefined
      })
    } finally {
      setLoading(false)
    }
  }, [user, activeBotId])

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserData()
    }
  }, [isLoaded, user, fetchUserData])

    // Define all callback functions first
  const handleBotCreated = useCallback((bot: BotType) => {
    setUserData(prev => prev ? {
      ...prev,
      bots: [...prev.bots, bot]
    } : null)
    setActiveBotId(bot.id)
    setShowBotWizard(false)
    fetchUserData() // Refresh data
  }, [fetchUserData])

  const handleBotChange = (botId: string) => {
    setActiveBotId(botId)
  }

  const handleCreateBot = () => {
    setShowBotWizard(true)
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-100 via-green-100 to-teal-100 dark:from-emerald-900 dark:via-green-900 dark:to-teal-900">
        <div className="text-center">
          <div className="animate-spin w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-8 shadow-xl shadow-emerald-500/30"></div>
          <p className="text-green-700 dark:text-green-300 text-xl font-semibold">Loading your AI dashboard...</p>
          <p className="text-green-600 dark:text-green-400 text-sm mt-2">Preparing your WhatsApp AI experience</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950 dark:via-green-950 dark:to-teal-950">
        <Card className="elegant-card max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-green-800 dark:text-green-100">Access Denied</CardTitle>
            <CardDescription className="text-green-600 dark:text-green-300">
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
    )
  }

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'free': return 'secondary'
      case 'starter': return 'default'
      case 'growth': return 'default'
      case 'enterprise': return 'default'
      default: return 'secondary'
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'from-gray-500 to-slate-500'
      case 'starter': return 'from-emerald-500 to-green-500'
      case 'growth': return 'from-green-500 to-teal-500'
      case 'enterprise': return 'from-teal-500 to-emerald-500'
      default: return 'from-gray-500 to-slate-500'
    }
  }

  const activeBot = userData?.bots.find(bot => bot.id === activeBotId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950 dark:via-green-950 dark:to-teal-950">
      <div className="container mx-auto container-padding section-padding">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="gradient-text-vibrant">Welcome back</span>, {user.firstName || 'there'}! 👋
              </h1>
              <p className="text-xl text-green-700 dark:text-green-200">
                Manage your AI-powered WhatsApp bots from your command center
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge 
                variant={getPlanBadgeVariant(userData?.subscription.plan || 'free')}
                className={`bg-gradient-to-r ${getPlanColor(userData?.subscription.plan || 'free')} text-white border-0 px-4 py-2 text-base font-semibold shadow-lg`}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {userData?.subscription.plan?.toUpperCase() || 'FREE'} Plan
              </Badge>
            </div>
          </div>
        </div>

        {/* Bot Selector */}
        <div className="mb-8">
          <BotSelector
            activeBotId={activeBotId || undefined}
            onBotChange={handleBotChange}
            onCreateBot={handleCreateBot}
          />
        </div>

        {/* Active Bot Stats */}
        {activeBot && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="elegant-card hover:scale-105 transition-transform duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-semibold text-green-800 dark:text-green-100">Messages Today</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold gradient-text mb-2">
                  {activeBot.analytics.todayMessages || 0}
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  of {userData?.subscription.dailyLimit || 10} daily limit
                </p>
              </CardContent>
            </Card>

            <Card className="elegant-card hover:scale-105 transition-transform duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-semibold text-green-800 dark:text-green-100">Total Messages</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold gradient-text mb-2">
                  {activeBot.analytics.totalMessages || 0}
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">All time</p>
              </CardContent>
            </Card>

            <Card className="elegant-card hover:scale-105 transition-transform duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-semibold text-green-800 dark:text-green-100">Success Rate</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold gradient-text mb-2">
                  {activeBot.analytics.responseRate || 0}%
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Response accuracy</p>
            </CardContent>
          </Card>

            <Card className="elegant-card hover:scale-105 transition-transform duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-base font-semibold text-green-800 dark:text-green-100">WhatsApp Status</CardTitle>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Zap className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold gradient-text mb-2">
                  {activeBot.whatsappConnected ? '✅' : '❌'}
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  {activeBot.whatsappConnected ? 'Connected' : 'Not Connected'}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 border border-green-200 dark:border-green-700 p-1 rounded-2xl">
            <TabsTrigger 
              value="overview" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-xl font-semibold"
            >
              <Bot className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="setup" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-xl font-semibold"
            >
              <Settings className="w-4 h-4" />
              Setup
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-xl font-semibold"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="messages" 
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-500 data-[state=active]:text-white rounded-xl font-semibold"
            >
              <MessageSquare className="w-4 h-4" />
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {activeBot ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="elegant-card">
            <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl text-green-800 dark:text-green-100">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      Bot Status
                    </CardTitle>
                    <CardDescription className="text-green-600 dark:text-green-300 text-base">
                      Real-time monitoring of {activeBot.name}
                    </CardDescription>
            </CardHeader>
            <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-100/80 to-green-100/80 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl border border-emerald-200 dark:border-emerald-700">
                        <span className="font-medium text-green-800 dark:text-green-100">Status</span>
                        <Badge className={`${
                          activeBot.status === 'active' ? 'bg-emerald-500' :
                          activeBot.status === 'training' ? 'bg-yellow-500' :
                          activeBot.status === 'creating' ? 'bg-blue-500' :
                          'bg-gray-500'
                        } text-white`}>
                          {activeBot.status.charAt(0).toUpperCase() + activeBot.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-100/80 to-green-100/80 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl border border-emerald-200 dark:border-emerald-700">
                        <span className="font-medium text-green-800 dark:text-green-100">WhatsApp</span>
                        <Badge className={`${activeBot.whatsappConnected ? 'bg-emerald-500' : 'bg-red-500'} text-white`}>
                          {activeBot.whatsappConnected ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </div>
                      {activeBot.whatsappPhoneNumber && (
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-100/80 to-green-100/80 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl border border-emerald-200 dark:border-emerald-700">
                          <span className="font-medium text-green-800 dark:text-green-100">Phone Number</span>
                          <span className="text-green-700 dark:text-green-200 font-mono">{activeBot.whatsappPhoneNumber}</span>
                        </div>
                      )}
                    </div>
            </CardContent>
          </Card>

                <Card className="elegant-card">
            <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl text-green-800 dark:text-green-100">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      WhatsApp Setup
                    </CardTitle>
                    <CardDescription className="text-green-600 dark:text-green-300 text-base">
                      Connect your WhatsApp Business account
                    </CardDescription>
            </CardHeader>
            <CardContent>
                    {activeBot.whatsappConnected ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Check className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-green-800 dark:text-green-100 mb-2">
                          WhatsApp Connected!
                        </h3>
                        <p className="text-green-600 dark:text-green-300">
                          Your bot is ready to receive and respond to messages
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-gray-500/20 to-slate-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <MessageSquare className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-green-800 dark:text-green-100 mb-2">
                          WhatsApp Not Connected
                        </h3>
                        <p className="text-green-600 dark:text-green-300 mb-4">
                          Connect your WhatsApp Business account to start receiving messages
                        </p>
                        <Button className="btn-primary">
                          Connect WhatsApp
                        </Button>
                      </div>
                    )}
            </CardContent>
          </Card>
        </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-green-600 dark:text-green-300">Select a bot to view its overview</p>
              </div>
            )}

            {activeBot && !activeBot.whatsappConnected && (
              <Card className="elegant-card border-emerald-200 dark:border-emerald-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl text-green-800 dark:text-green-100">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    Getting Started
                  </CardTitle>
                  <CardDescription className="text-green-600 dark:text-green-300 text-base">
                    Complete these steps to activate your WhatsApp AI bot and start automating customer service
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-emerald-100/80 to-green-100/80 dark:from-emerald-900/30 dark:to-green-900/30 rounded-2xl border border-emerald-200 dark:border-emerald-700 shadow-lg">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg shadow-emerald-500/30">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-800 dark:text-green-100 text-lg">Connect WhatsApp Business</p>
                      <p className="text-green-600 dark:text-green-300">Link your WhatsApp Business number to get started</p>
                    </div>
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-gray-100/60 to-slate-100/60 dark:from-gray-800/30 dark:to-slate-800/30 rounded-2xl border border-gray-200 dark:border-gray-700 opacity-60">
                    <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-slate-400 text-white rounded-2xl flex items-center justify-center text-lg font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-700 dark:text-gray-300 text-lg">Configure AI Settings</p>
                      <p className="text-gray-500 dark:text-gray-400">Set up your bot&apos;s personality and responses</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-gray-100/60 to-slate-100/60 dark:from-gray-800/30 dark:to-slate-800/30 rounded-2xl border border-gray-200 dark:border-gray-700 opacity-60">
                    <div className="w-12 h-12 bg-gradient-to-r from-gray-400 to-slate-400 text-white rounded-2xl flex items-center justify-center text-lg font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-700 dark:text-gray-300 text-lg">Test Your Bot</p>
                      <p className="text-gray-500 dark:text-gray-400">Send a test message to verify everything works perfectly</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="setup">
            {activeBot ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="elegant-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl text-green-800 dark:text-green-100">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                        <MessageSquare className="w-6 h-6 text-white" />
                      </div>
                      WhatsApp Setup
                    </CardTitle>
                    <CardDescription className="text-green-600 dark:text-green-300 text-base">
                      Connect your WhatsApp Business account
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {activeBot.whatsappConnected ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-green-800 dark:text-green-100 mb-2">
                          WhatsApp Connected!
                        </h3>
                        <p className="text-green-600 dark:text-green-300 mb-4">
                          Phone: {activeBot.whatsappPhoneNumber}
                        </p>
                        <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-r from-gray-500/20 to-slate-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <MessageSquare className="w-8 h-8 text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-green-800 dark:text-green-100 mb-2">
                          WhatsApp Not Connected
                        </h3>
                        <p className="text-green-600 dark:text-green-300 mb-4">
                          Connect your WhatsApp Business account to start receiving messages
                        </p>
                        <Button className="btn-primary">
                          Generate QR Code
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="elegant-card">
            <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl text-green-800 dark:text-green-100">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
                        <Settings className="w-6 h-6 text-white" />
                      </div>
                      AI Configuration
                    </CardTitle>
                    <CardDescription className="text-green-600 dark:text-green-300 text-base">
                      Configure your bot&apos;s personality and behavior to match your brand
                    </CardDescription>
            </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-100/80 to-green-100/80 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl border border-emerald-200 dark:border-emerald-700">
                        <span className="font-medium text-green-800 dark:text-green-100">Personality</span>
                        <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white">
                          {activeBot.settings.personality.charAt(0).toUpperCase() + activeBot.settings.personality.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-100/80 to-green-100/80 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl border border-emerald-200 dark:border-emerald-700">
                        <span className="font-medium text-green-800 dark:text-green-100">Auto Respond</span>
                        <Badge className={`${activeBot.settings.autoRespond ? 'bg-emerald-500' : 'bg-gray-500'} text-white`}>
                          {activeBot.settings.autoRespond ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-100/80 to-green-100/80 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl border border-emerald-200 dark:border-emerald-700">
                        <span className="font-medium text-green-800 dark:text-green-100">Business Hours</span>
                        <Badge className={`${activeBot.settings.businessHours.enabled ? 'bg-emerald-500' : 'bg-gray-500'} text-white`}>
                          {activeBot.settings.businessHours.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <Button className="w-full btn-secondary">
                        Configure AI Settings
                      </Button>
                    </div>
            </CardContent>
          </Card>
        </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-green-600 dark:text-green-300">Select a bot to configure its settings</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="elegant-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl text-green-800 dark:text-green-100">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  Bot Analytics
                </CardTitle>
                <CardDescription className="text-green-600 dark:text-green-300 text-base">
                  Detailed insights into your bot&apos;s performance and customer interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-40 text-green-600 dark:text-green-400">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                      <BarChart3 className="w-8 h-8 opacity-60" />
                    </div>
                    <p className="text-lg font-semibold">Analytics dashboard coming soon...</p>
                    <p className="text-sm mt-2">Advanced metrics and reporting features in development</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card className="elegant-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl text-green-800 dark:text-green-100">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  Message History
                </CardTitle>
                <CardDescription className="text-green-600 dark:text-green-300 text-base">
                  View and manage your bot&apos;s conversations with customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-40 text-green-600 dark:text-green-400">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 opacity-60" />
                    </div>
                    <p className="text-lg font-semibold">Message history coming soon...</p>
                    <p className="text-sm mt-2">Conversation management and history features in development</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bot Creation Wizard */}
      {showBotWizard && (
        <BotCreationWizard
          isOpen={showBotWizard}
          onClose={() => setShowBotWizard(false)}
          onBotCreated={handleBotCreated}
        />
      )}
    </div>
  )
} 