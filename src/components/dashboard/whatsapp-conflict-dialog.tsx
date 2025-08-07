'use client'

import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, Bot, User, Clock, Phone } from 'lucide-react'

interface WhatsAppConnectionConflict {
  botId: string
  botName: string
  userId: string
  connectedAt: string
  phoneNumber: string
}

interface WhatsAppConflictDialogProps {
  isOpen: boolean
  onClose: () => void
  conflict: WhatsAppConnectionConflict
  errorType: 'whatsapp_already_connected_to_user_bot' | 'whatsapp_in_use_by_other_user'
  onDisconnect?: () => void
}

export function WhatsAppConflictDialog({ 
  isOpen, 
  onClose, 
  conflict, 
  errorType,
  onDisconnect 
}: WhatsAppConflictDialogProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getErrorTitle = () => {
    switch (errorType) {
      case 'whatsapp_already_connected_to_user_bot':
        return 'WhatsApp Already Connected'
      case 'whatsapp_in_use_by_other_user':
        return 'WhatsApp In Use by Another User'
      default:
        return 'Connection Conflict'
    }
  }

  const getErrorDescription = () => {
    switch (errorType) {
      case 'whatsapp_already_connected_to_user_bot':
        return `This WhatsApp number is already connected to another bot in your account. You can only connect one WhatsApp number to one bot at a time.`
      case 'whatsapp_in_use_by_other_user':
        return `This WhatsApp number is already connected to another user's bot. Please use a different WhatsApp number.`
      default:
        return 'There is a conflict with this WhatsApp connection.'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            {getErrorTitle()}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {getErrorDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300">
              {errorType === 'whatsapp_already_connected_to_user_bot' 
                ? `Connected to: ${conflict.botName}`
                : `Connected to another user's bot`
              }
            </AlertDescription>
          </Alert>

          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Connected Bot:</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{conflict.botName}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Phone Number:</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{conflict.phoneNumber}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Connected Since:</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">{formatDate(conflict.connectedAt)}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            {errorType === 'whatsapp_already_connected_to_user_bot' && onDisconnect && (
              <Button 
                onClick={onDisconnect}
                variant="outline"
                className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                Disconnect from {conflict.botName}
              </Button>
            )}
            
            <Button 
              onClick={onClose}
              className="flex-1"
            >
              {errorType === 'whatsapp_already_connected_to_user_bot' ? 'Use Different Number' : 'OK'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 