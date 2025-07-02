'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Bot, Plus, Settings, BarChart3, MessageSquare, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bot as BotType } from '@/lib/types/user'

interface BotSelectorProps {
  activeBotId?: string
  onBotChange: (botId: string) => void
  onCreateBot: () => void
}

export function BotSelector({ activeBotId, onBotChange, onCreateBot }: BotSelectorProps) {
  const { user } = useUser()
  const [bots, setBots] = useState<BotType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchUserBots()
    }
  }, [user?.id])

  const fetchUserBots = async () => {
    try {
      const response = await fetch('/api/bots')
      if (response.ok) {
        const data = await response.json()
        setBots(data.bots || [])
      }
    } catch (error) {
      console.error('Error fetching bots:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500'
      case 'training': return 'bg-yellow-500'
      case 'connecting': return 'bg-blue-500'
      case 'inactive': return 'bg-gray-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active'
      case 'training': return 'Training'
      case 'connecting': return 'Connecting'
      case 'inactive': return 'Inactive'
      case 'error': return 'Error'
      default: return 'Unknown'
    }
  }

  const activeBot = bots.find(bot => bot.id === activeBotId)

  if (loading) {
    return (
      <Card className="elegant-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-24"></div>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (bots.length === 0) {
    return (
      <Card className="elegant-card border-dashed border-2 border-emerald-300 dark:border-emerald-700">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl flex items-center justify-center mb-6">
            <Bot className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-xl font-semibold text-green-800 dark:text-green-100 mb-2">
            No Bots Yet
          </h3>
          <p className="text-green-600 dark:text-green-300 mb-6 max-w-sm">
            Create your first AI-powered WhatsApp bot to get started with automated customer service.
          </p>
          <Button onClick={onCreateBot} className="btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            Create Your First Bot
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Active Bot Display */}
      <Card className="elegant-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl text-green-800 dark:text-green-100">
                  {activeBot?.name || 'Select a Bot'}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  {activeBot && (
                    <>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(activeBot.status)}`}></div>
                      <span className="text-sm text-green-600 dark:text-green-300">
                        {getStatusText(activeBot.status)}
                      </span>
                      {activeBot.whatsappConnected && (
                        <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bot Selector Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-emerald-200 dark:border-emerald-700">
                  Switch Bot
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel className="text-green-800 dark:text-green-100">
                  Your Bots ({bots.length})
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {bots.map((bot) => (
                  <DropdownMenuItem
                    key={bot.id}
                    onClick={() => onBotChange(bot.id)}
                    className={`flex items-center gap-3 p-3 cursor-pointer ${
                      bot.id === activeBotId ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-green-800 dark:text-green-100">
                          {bot.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(bot.status)}`}></div>
                          <span className="text-xs text-green-600 dark:text-green-400">
                            {getStatusText(bot.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {bot.id === activeBotId && (
                      <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs">
                        Active
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onCreateBot} className="flex items-center gap-3 p-3 cursor-pointer text-emerald-600 dark:text-emerald-400">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="font-medium">Create New Bot</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        {/* Active Bot Quick Stats */}
        {activeBot && (
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold gradient-text mb-1">
                  <MessageSquare className="w-5 h-5" />
                  {activeBot.analytics.todayMessages}
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">Today</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold gradient-text mb-1">
                  <BarChart3 className="w-5 h-5" />
                  {activeBot.analytics.totalMessages}
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">Total</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold gradient-text mb-1">
                  <Settings className="w-5 h-5" />
                  {activeBot.analytics.responseRate}%
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">Success</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
} 