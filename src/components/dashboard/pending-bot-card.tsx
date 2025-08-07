'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Bot, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  Play,
  Settings
} from 'lucide-react'
import { Bot as BotType } from '@/lib/types/user'
import { BotCreationWizard } from './bot-creation-wizard'

interface PendingBotCardProps {
  bot: BotType
  onBotUpdated: (bot: BotType) => void
  onOpenSettings?: () => void
}

export function PendingBotCard({ bot, onBotUpdated, onOpenSettings }: PendingBotCardProps) {
  const [showWizard, setShowWizard] = useState(false)

  const getProgressPercentage = () => {
    // Calculate progress based on bot completion state
    let progress = 0;
    
    // Step 1: Bot created (25%)
    if (bot.status !== 'error') {
      progress += 25;
    }
    
    // Step 2: WhatsApp connected (25%)
    if (bot.whatsappConnected) {
      progress += 25;
    }
    
    // Step 3: Training data added (25%)
    if (bot.trainingData && (
      bot.trainingData.qnaPairs?.length > 0 || 
      bot.trainingData.documents?.length > 0 ||
      (bot.trainingData.businessInfo && Object.values(bot.trainingData.businessInfo).some(val => val))
    )) {
      progress += 25;
    }
    
    // Step 4: Bot active (25%)
    if (bot.status === 'active') {
      progress += 25;
    }
    
    return Math.min(progress, 100);
  }

  const getStatusColor = () => {
    switch (bot.status) {
      case 'creating':
        return 'bg-blue-500'
      case 'connecting':
        return 'bg-orange-500'
      case 'training':
        return 'bg-yellow-500'
      case 'active':
        return 'bg-emerald-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusMessage = () => {
    switch (bot.status) {
      case 'creating':
        return 'Setting up your bot...'
      case 'connecting':
        return 'Connecting WhatsApp...'
      case 'training':
        return 'Training AI with your data...'
      case 'active':
        return 'Bot is ready!'
      default:
        return 'Unknown status'
    }
  }

  const getNextStep = () => {
    switch (bot.status) {
      case 'creating':
        return 'Connect WhatsApp'
      case 'connecting':
        return 'Complete AI Training'
      case 'training':
        return 'Activate Bot'
      default:
        return 'Continue Setup'
    }
  }

  const handleContinueSetup = () => {
    setShowWizard(true)
  }

  const handleBotUpdated = (updatedBot: BotType) => {
    onBotUpdated(updatedBot)
    setShowWizard(false)
  }

  return (
    <>
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border border-orange-200 dark:border-orange-700 rounded-xl shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-orange-900 dark:text-orange-100">
                  {bot.name}
                </CardTitle>
                <CardDescription className="text-orange-600 dark:text-orange-400">
                  Setup in progress
                </CardDescription>
              </div>
            </div>
            <Badge className={`${getStatusColor()} text-white`}>
              {bot.status ? bot.status.charAt(0).toUpperCase() + bot.status.slice(1) : 'Unknown'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-orange-600 dark:text-orange-400">Setup Progress</span>
              <span className="text-orange-900 dark:text-orange-100 font-medium">
                {getProgressPercentage()}%
              </span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>

          {/* Status Message */}
          <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
            <Clock className="w-4 h-4" />
            <span>{getStatusMessage()}</span>
          </div>

          {/* Bot Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-orange-600 dark:text-orange-400">Created:</span>
              <p className="text-orange-900 dark:text-orange-100 font-medium">
                {new Date(bot.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="text-orange-600 dark:text-orange-400">WhatsApp:</span>
              <p className="text-orange-900 dark:text-orange-100 font-medium">
                {bot.whatsappConnected ? 'Connected' : 'Not Connected'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleContinueSetup}
              className="bg-orange-500 hover:bg-orange-600 text-white flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              {getNextStep()}
            </Button>
            <Button 
              variant="outline" 
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
              onClick={onOpenSettings}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          {bot.status === 'connecting' && !bot.whatsappConnected && (
            <div className="bg-orange-100 dark:bg-orange-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300">
                <AlertCircle className="w-4 h-4" />
                <span>WhatsApp connection required to continue</span>
              </div>
            </div>
          )}

          {bot.status === 'training' && (
            <div className="bg-yellow-100 dark:bg-yellow-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
                <CheckCircle className="w-4 h-4" />
                <span>AI training in progress - this may take a few minutes</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bot Creation Wizard for continuing setup */}
      {showWizard && (
        <BotCreationWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onBotCreated={handleBotUpdated}
          existingBot={bot}
        />
      )}
    </>
  )
} 