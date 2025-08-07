'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Smartphone, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { BotApiClient } from '@/lib/api/bot-client'
import { useWhatsAppStatus } from '@/hooks/useWhatsAppStatus'
import Image from 'next/image';
import { useUser } from '@clerk/nextjs'

interface WhatsAppQRSetupProps {
  botId?: string
  onConnectionSuccess?: () => void
  onConnectionError?: (error: string) => void
}

export const WhatsAppQRSetup: React.FC<WhatsAppQRSetupProps> = ({
  botId,
  onConnectionSuccess,
  onConnectionError
}) => {
  const { user } = useUser()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Remove destructuring of refetch, only use fetchStatus if needed
  const { status, fetchStatus } = useWhatsAppStatus()

  const generateQRCode = async () => {
    // Ensure user and botId are not null before proceeding
    if (!user?.id || !botId) {
      const errorMessage = 'User ID or Bot ID is missing'
      setError(errorMessage)
      setConnectionStatus('error')
      onConnectionError?.(errorMessage)
      return
    }

    try {
      setIsConnecting(true)
      setError(null)
      setConnectionStatus('connecting')
      
      // Safely unwrap user.id and botId (we've already checked they exist)
      const userId = user.id!
      const currentBotId = botId!
      
      const botApiClient = new BotApiClient(userId)
      const response = await botApiClient.connectWhatsApp(currentBotId, userId)

      if (response.success) {
        // QR code should be received via WebSocket
        setConnectionStatus('connecting')
        console.log('QR code generation initiated')
      } else {
        const errorMessage = response.error || 'Failed to generate QR code'
        setError(errorMessage)
        setConnectionStatus('error')
        onConnectionError?.(errorMessage)
      }
    } catch (err: unknown) {
      // Properly handle unknown error type
      const errorMessage = err instanceof Error 
        ? err.message 
        : typeof err === 'string' 
          ? err 
          : 'Failed to generate QR code'
      
      setError(errorMessage)
      setConnectionStatus('error')
      onConnectionError?.(errorMessage)
      console.error('QR code generation error:', err)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    setError(null)
    setConnectionStatus('idle')
    generateQRCode()
  }

  const handleRefresh = () => {
    // Use fetchStatus instead of refetch
    fetchStatus()
  }

  // Modify status handling to be more type-safe
  useEffect(() => {
    // Type-safe access to status properties
    if (status && typeof status === 'object') {
      const qrCodeValue = (status as any).qrCode
      const isConnectedValue = (status as any).isConnected

      if (qrCodeValue && typeof qrCodeValue === 'string') {
        setQrCode(qrCodeValue)
        setConnectionStatus('connecting')
      }

      if (isConnectedValue === true) {
        setConnectionStatus('connected')
        setQrCode(null)
        onConnectionSuccess?.()
      }
    }
  }, [status, onConnectionSuccess])

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connecting':
        return <Loader2 className="h-5 w-5 animate-spin" />
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Smartphone className="h-5 w-5" />
    }
  }

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting to WhatsApp...'
      case 'connected':
        return 'WhatsApp connected successfully!'
      case 'error':
        return 'Connection failed'
      default:
        return 'Ready to connect'
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          WhatsApp Connection
        </CardTitle>
        <CardDescription>
          Scan the QR code with your WhatsApp to connect your bot
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              {retryCount > 0 && (
                <span className="block text-sm mt-1">
                  Retry attempt: {retryCount}
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {qrCode ? (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
                <Image
                  src={qrCode}
                  alt="WhatsApp QR Code"
                  width={200}
                  height={200}
                  className="rounded"
                />
              </div>
            </div>
            <p className="text-sm text-center text-muted-foreground">
              Open WhatsApp on your phone and scan this QR code
            </p>
          </div>
        ) : connectionStatus === 'connected' ? (
          <div className="text-center space-y-2">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <p className="text-green-600 font-medium">WhatsApp Connected!</p>
            <p className="text-sm text-muted-foreground">
              Your bot is now ready to receive messages
            </p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <Smartphone className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Waiting for QR code...</p>
          </div>
        )}

        <div className="flex gap-2">
          {connectionStatus === 'error' && (
            <Button onClick={handleRetry} variant="outline" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
          
          {connectionStatus === 'connected' && (
            <Button onClick={handleRefresh} variant="outline" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          )}

          {isConnecting && (
            <Button disabled className="flex-1">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Connecting...
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center">
          {getStatusText()}
        </div>
      </CardContent>
    </Card>
  )
}