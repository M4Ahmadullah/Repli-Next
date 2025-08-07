'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, Settings, Trash2, AlertTriangle, CheckCircle, Clock, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

interface BotSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  bot: any
  onDeleteBot: (botId: string) => void
}

export function BotSettingsModal({ isOpen, onClose, bot, onDeleteBot }: BotSettingsModalProps) {
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (deleteConfirmation !== bot.name) {
      toast.error('Please type the bot name exactly to confirm deletion')
      return
    }

    try {
      setIsDeleting(true)
      await onDeleteBot(bot.id)
      toast.success('Bot deleted successfully!', {
        description: 'The bot has been permanently removed from your account.',
        duration: 4000,
        style: {
          background: '#10b981',
          color: 'white',
          border: '1px solid #059669',
        },
      })
      onClose()
    } catch (error) {
      toast.error('Failed to delete bot', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        duration: 5000,
      })
      console.error('Delete bot error:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500'
      case 'creating':
      case 'training':
      case 'connecting':
        return 'bg-orange-500'
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'creating':
        return 'Creating'
      case 'training':
        return 'Training'
      case 'connecting':
        return 'Connecting'
      case 'error':
        return 'Error'
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] w-[90vw] max-h-[90vh] h-[85vh] overflow-y-auto bg-gradient-to-br from-emerald-50/80 via-green-50/80 to-teal-50/80 dark:from-emerald-900/40 dark:via-green-900/40 dark:to-teal-900/40 backdrop-blur-md border-0 shadow-2xl transition-all duration-300 ease-in-out">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-3">
            <Settings className="w-6 h-6" />
            Bot Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bot Info Card */}
          <Card className="bg-white/60 dark:bg-emerald-900/60 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-emerald-900 dark:text-emerald-100">
                      {bot.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(bot.status)}`}></div>
                      <span className="text-sm text-emerald-600 dark:text-emerald-300">
                        {getStatusText(bot.status)}
                      </span>
                      {bot.whatsappConnected && (
                        <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Description
                  </Label>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {bot.description || 'No description'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Created
                  </Label>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {new Date(bot.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-800/50 rounded-lg">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                      Messages
                    </p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {bot.messageCount || 0}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-800/50 rounded-lg">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                      Response Time
                    </p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {bot.analytics?.averageResponseTime ? 
                        `${Math.round(bot.analytics.averageResponseTime)}ms` : 
                        'N/A'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-800/50 rounded-lg">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                      Health
                    </p>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {bot.health || 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="bg-red-50/60 dark:bg-red-900/40 backdrop-blur-sm border border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  This action cannot be undone. This will permanently delete the bot and all its data.
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="delete-confirmation" className="text-sm font-medium text-red-700 dark:text-red-300">
                    Type "{bot.name}" to confirm deletion
                  </Label>
                  <Input
                    id="delete-confirmation"
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder={`Type "${bot.name}" to confirm`}
                    className="border-0 bg-white/80 dark:bg-emerald-900/80 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <Button
                  onClick={handleDelete}
                  disabled={deleteConfirmation !== bot.name || isDeleting}
                  variant="destructive"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Bot
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
} 