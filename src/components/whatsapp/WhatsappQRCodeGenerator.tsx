'use client'

import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, RefreshCw } from 'lucide-react'

interface WhatsappQRResponse {
  qrCode: string
  expiresAt: string
}

interface WhatsappQRCodeGeneratorProps {
  userId?: string
  botId?: string
}

export function WhatsappQRCodeGenerator({ userId, botId }: WhatsappQRCodeGeneratorProps) {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function generateQRCode() {
    try {
      setIsLoading(true)
      
      if (!userId) {
        throw new Error('User ID is required')
      }
      
      const url = new URL('/api/whatsapp/qr-code', window.location.origin)
      if (userId) url.searchParams.set('userId', userId)
      if (botId) url.searchParams.set('botId', botId)
      
      const response = await fetch(url.toString(), {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate QR code')
      }

      const data: WhatsappQRResponse = await response.json()
      setQrCode(data.qrCode)
      setExpiresAt(new Date(data.expiresAt))
      
      toast.success('QR Code Generated', {
        description: 'Scan the QR code to connect your WhatsApp'
      })
    } catch (error) {
      console.error('QR Code Generation Error:', error)
      toast.error('QR Code Error', {
        description: 'Could not generate QR code. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // DISABLED: No automatic QR generation to prevent rate limiting
    console.log('⏸️ [DEBUG] WhatsappQRCodeGenerator: Automatic QR generation DISABLED to prevent rate limiting');
    return;
    
    generateQRCode()
  }, [])

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          WhatsApp Connection
          <Button 
            variant="outline" 
            size="icon" 
            onClick={generateQRCode} 
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
            <p className="mt-4 text-emerald-600">Generating QR Code...</p>
          </div>
        ) : qrCode ? (
          <div className="flex flex-col items-center">
            <QRCodeSVG value={qrCode} size={300} />
            <p className="mt-4 text-sm text-gray-600">
              Expires at: {expiresAt?.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Scan this QR code with your WhatsApp mobile app to connect
            </p>
          </div>
        ) : (
          <p>Unable to generate QR code. Please try again.</p>
        )}
      </CardContent>
    </Card>
  )
} 