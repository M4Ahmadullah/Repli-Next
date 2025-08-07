'use client'

import { useUser } from '@clerk/nextjs'
import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bot, Plus, Settings, BarChart3, MessageSquare, AlertCircle, Sparkles, Trash2 } from 'lucide-react'
import { Bot as BotType } from '@/lib/types/user'
import { BotCreationWizard } from '@/components/dashboard/bot-creation-wizard'
import { BotGridSkeleton } from '@/components/dashboard/bot-card-skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BotSettingsPanel } from '@/components/dashboard/BotSettingsPanel'
import { BotDeletionConfirmation } from '@/components/dashboard/bot-deletion-confirmation'
import { PendingBotCard } from '@/components/dashboard/pending-bot-card'
import { toast } from 'sonner'

export default function BotsPage() {
  const { user, isLoaded } = useUser()
  const [bots, setBots] = useState<BotType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showBotWizard, setShowBotWizard] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [botToDelete, setBotToDelete] = useState<{ id: string; name: string } | null>(null)
  const [selectedBot, setSelectedBot] = useState<{ id: string; name: string } | null>(null)

  const fetchBots = useCallback(async () => {
    try {
      if (!user?.id) {
        setError('User ID not available')
        setLoading(false)
        return
      }

      const response = await fetch('/api/bots?forceRefresh=true')
      if (!response.ok) {
        throw new Error('Failed to fetch bots')
      }

      const data = await response.json()
      if (data.success && data.bots) {
        const formattedBots = data.bots.map((bot: any) => ({
          id: bot.id,
          userId: bot.userId,
          name: bot.name,
          description: bot.description || '',
          whatsappPhoneNumber: bot.whatsappPhoneNumber,
          whatsappConnected: bot.whatsappConnected || false,
          qrCode: bot.qrCode,
          status: bot.status || 'inactive',
          settings: bot.settings || {
            personality: 'professional',
            autoRespond: true,
            businessHours: { enabled: false, timezone: 'UTC', schedule: {} },
            fallbackMessage: 'I will connect you with a human agent.',
            language: 'en'
          },
          trainingData: bot.trainingData || {
            businessInfo: { name: '', description: '' },
            qnaPairs: [],
            documents: [],
            lastTrainingUpdate: new Date()
          },
          analytics: {
            totalMessages: bot.analytics?.totalMessages || bot.messageCount || 0,
            todayMessages: bot.analytics?.todayMessages || 0,
            weeklyMessages: bot.analytics?.weeklyMessages || 0,
            monthlyMessages: bot.analytics?.monthlyMessages || 0,
            responseRate: bot.analytics?.responseRate || 0,
            averageResponseTime: bot.analytics?.averageResponseTime || 0,
            topQuestions: bot.analytics?.topQuestions || [],
            satisfactionScore: bot.analytics?.satisfactionScore || 0,
            lastUpdated: new Date(bot.analytics?.lastUpdated || Date.now())
          },
          createdAt: new Date(bot.createdAt || Date.now()),
          updatedAt: new Date(bot.updatedAt || Date.now())
        }))

        // Sort bots: incomplete first, then by creation date
        const sortedBots = [...formattedBots].sort((a, b) => {
          const aIncomplete = ['creating', 'training', 'connecting'].includes(a.status)
          const bIncomplete = ['creating', 'training', 'connecting'].includes(b.status)
          
          if (aIncomplete && !bIncomplete) return -1
          if (!aIncomplete && bIncomplete) return 1
          
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })

        setBots(sortedBots)
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to fetch bots')
      }
    } catch (error) {
      console.error('Error fetching bots:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch bots')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (isLoaded && user) {
      fetchBots()
    }
  }, [isLoaded, user, fetchBots])

  const handleBotCreated = useCallback((bot: BotType) => {
    setBots(prev => [...prev, bot])
    setShowBotWizard(false)
  }, [])

  const handleDeleteBot = useCallback((botId: string, botName: string) => {
    setBotToDelete({ id: botId, name: botName });
    setShowDeleteConfirmation(true);
  }, [])

  const handleDeleteSuccess = useCallback(() => {
    if (botToDelete) {
      setBots(prev => prev.filter(bot => bot.id !== botToDelete.id));
      // Force refresh bots list to ensure consistency
      setTimeout(() => {
        fetchBots()
      }, 100) // Reduced delay for faster refresh
      setBotToDelete(null);
    }
  }, [botToDelete, fetchBots])

  if (!isLoaded || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          
          {/* Bot Grid Skeleton */}
          <BotGridSkeleton count={6} />
        </div>
      </DashboardLayout>
    )
  }

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
              <CardTitle className="text-2xl">Error Loading Bots</CardTitle>
              <CardDescription>
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button onClick={() => fetchBots()} className="btn-primary">
                <Sparkles className="w-5 h-5 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
              Bot Management
            </h1>
            <p className="text-emerald-600 dark:text-emerald-400">
              Create, manage, and monitor your AI-powered WhatsApp bots
            </p>
          </div>
          <Button 
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={() => setShowBotWizard(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Bot
          </Button>
        </div>

        {/* Bots Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bots.map((bot) => (
            <PendingBotCard
              key={bot.id}
              bot={bot}
              onBotUpdated={(updatedBot) => {
                setBots(prev => prev.map(b => b.id === updatedBot.id ? updatedBot : b))
              }}
              onOpenSettings={() => {
                setSelectedBot({ id: bot.id, name: bot.name });
                setShowSettingsModal(true);
              }}
            />
          ))}
        </div>

        {/* Empty State */}
        {bots.length === 0 && (
          <Card className="bg-white dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700 rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-800 rounded-xl flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                No Bots Yet
              </h3>
              <p className="text-emerald-600 dark:text-emerald-400 text-center mb-4">
                Create your first WhatsApp bot to start automating customer conversations
              </p>
              <Button 
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
                onClick={() => setShowBotWizard(true)}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Bot
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bot Creation Wizard */}
      {showBotWizard && (
        <BotCreationWizard
          isOpen={showBotWizard}
          onClose={() => setShowBotWizard(false)}
          onBotCreated={handleBotCreated}
        />
      )}

      {/* Bot Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={(open) => {
        setShowSettingsModal(open);
        if (!open) {
          setSelectedBot(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bot Settings - {selectedBot?.name}</DialogTitle>
          </DialogHeader>
          <BotSettingsPanel 
            userId={user?.id || ''} 
            botId={selectedBot?.id}
            onDeleteSuccess={() => {
              setBots(prev => prev.filter(bot => bot.id !== selectedBot?.id));
              setShowSettingsModal(false);
              setSelectedBot(null);
              // Force refresh bots list to ensure consistency
              setTimeout(() => {
                fetchBots()
              }, 100);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Bot Deletion Confirmation */}
      {botToDelete && (
        <BotDeletionConfirmation
          isOpen={showDeleteConfirmation}
          onClose={() => {
            setShowDeleteConfirmation(false);
            setBotToDelete(null);
          }}
          botId={botToDelete.id}
          botName={botToDelete.name}
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}
    </DashboardLayout>
  )
} 