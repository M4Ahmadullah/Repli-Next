'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Bot, Plus, Settings, BarChart3, MessageSquare, Zap, Check } from 'lucide-react'
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
  bots: BotType[]
  onBotChange: (botId: string) => void
  onCreateBot: () => void
}

export function BotSelector({ activeBotId, bots, onBotChange, onCreateBot }: BotSelectorProps) {
  const { user } = useUser()
  const [loading, setLoading] = useState(false)

  // Remove the duplicate API call since bots are passed as props
  useEffect(() => {
    // Only set loading to false when bots are available
    if (bots.length > 0 || !user?.id) {
      setLoading(false)
    }
  }, [bots, user?.id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500'
      case 'training': return 'bg-yellow-500'
      case 'connecting': return 'bg-blue-500'
      case 'creating': return 'bg-orange-500'
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
      case 'creating': return 'Creating'
      case 'inactive': return 'Inactive'
      case 'error': return 'Error'
      default: return 'Unknown'
    }
  }

  const isIncompleteBot = (bot: BotType) => {
    return ['creating', 'training', 'connecting'].includes(bot.status)
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
              <DropdownMenuContent className="w-80 p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Your Bots</h3>
                    <Button
                      size="sm"
                      onClick={onCreateBot}
                      className="bg-emerald-500 text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      New Bot
                    </Button>
                  </div>
                  
                <DropdownMenuSeparator />
                
                  {/* Bot List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {bots.map((bot) => {
                      const isIncomplete = ['creating', 'training', 'connecting'].includes(bot.status)
                      return (
                        <div
                    key={bot.id}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                            activeBotId === bot.id
                              ? 'bg-emerald-100 dark:bg-emerald-800 border border-emerald-300 dark:border-emerald-600'
                              : ''
                          } ${isIncomplete ? 'border-l-4 border-l-orange-500' : ''}`}
                    onClick={() => onBotChange(bot.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isIncomplete 
                                ? 'bg-gradient-to-r from-orange-500 to-yellow-500' 
                                : 'bg-gradient-to-r from-emerald-500 to-green-500'
                            }`}>
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {bot.name}
                                </h3>
                                {isIncomplete && (
                                  <Badge className="bg-orange-500 text-white text-xs">
                                    Continue Setup
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {bot.description || 'No description'}
                              </p>
                              {isIncomplete && (
                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                                  Status: {bot.status ? bot.status.charAt(0).toUpperCase() + bot.status.slice(1) : 'Unknown'}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {bot.whatsappConnected && (
                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            )}
                            {activeBotId === bot.id && (
                              <Check className="w-4 h-4 text-emerald-500" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                        </div>
                  
                  <DropdownMenuSeparator />
                  
                  {bots.length === 0 && (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Bot className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        No bots yet. Create your first bot to get started.
                      </p>
                      <Button
                        onClick={onCreateBot}
                        className="bg-emerald-500 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Bot
                      </Button>
                    </div>
                  )}
                  </div>
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
                  {activeBot?.analytics?.todayMessages || 0}
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">Today</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold gradient-text mb-1">
                  <BarChart3 className="w-5 h-5" />
                  {activeBot?.analytics?.totalMessages || 0}
                </div>
                <p className="text-sm text-green-600 dark:text-green-400">Total</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-2xl font-bold gradient-text mb-1">
                  <Settings className="w-5 h-5" />
                  {activeBot?.analytics?.responseRate || 0}%
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