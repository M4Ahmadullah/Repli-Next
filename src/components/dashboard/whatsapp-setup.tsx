'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Smartphone, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const webhookSchema = z.object({
  whatsappPhoneNumber: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number with country code'),
})

type WebhookFormData = z.infer<typeof webhookSchema>

interface WhatsAppSetupProps {
  userId: string
  isConnected?: boolean
  phoneNumber?: string
  onWebhookConfigured?: () => void
}

export function WhatsAppSetup({ 
  userId, 
  isConnected = false, 
  phoneNumber,
  onWebhookConfigured 
}: WhatsAppSetupProps) {
  const [isConfiguring, setIsConfiguring] = useState(false)
  const [webhookStatus, setWebhookStatus] = useState<{
    success?: boolean
    message?: string
    webhookUrl?: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      whatsappPhoneNumber: phoneNumber || '',
    },
  })

  const configureWebhook = async (data: WebhookFormData) => {
    setIsConfiguring(true)
    setWebhookStatus(null)

    try {
      const response = await fetch('/api/bot/webhook/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          whatsappPhoneNumber: data.whatsappPhoneNumber,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setWebhookStatus({
          success: true,
          message: result.message,
          webhookUrl: result.webhookUrl,
        })
        onWebhookConfigured?.()
      } else {
        setWebhookStatus({
          success: false,
          message: result.error || 'Failed to configure webhook',
        })
      }
    } catch (error) {
      console.error('Webhook configuration error:', error)
      setWebhookStatus({
        success: false,
        message: 'Network error. Please try again.',
      })
    } finally {
      setIsConfiguring(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            WhatsApp Integration
          </CardTitle>
          {isConnected && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
        <CardDescription>
          Connect your WhatsApp Business number to start receiving messages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected && phoneNumber ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-800">WhatsApp Connected</p>
                <p className="text-sm text-green-600">
                  Phone Number: {phoneNumber}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(configureWebhook)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="whatsappPhoneNumber">
                WhatsApp Business Phone Number
              </Label>
              <Input
                id="whatsappPhoneNumber"
                placeholder="+1234567890"
                {...register('whatsappPhoneNumber')}
                className={errors.whatsappPhoneNumber ? 'border-red-500' : ''}
              />
              {errors.whatsappPhoneNumber && (
                <p className="text-sm text-red-600">
                  {errors.whatsappPhoneNumber.message}
                </p>
              )}
              <p className="text-xs text-gray-600">
                Include country code (e.g., +1 for US, +44 for UK)
              </p>
            </div>

            <Button
              type="submit"
              disabled={isConfiguring}
              className="w-full"
            >
              {isConfiguring ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Configuring Webhook...
                </>
              ) : (
                'Connect WhatsApp'
              )}
            </Button>
          </form>
        )}

        {webhookStatus && (
          <div
            className={`rounded-lg p-4 ${
              webhookStatus.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-start gap-2">
              {webhookStatus.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`font-medium ${
                    webhookStatus.success ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {webhookStatus.success ? 'Success!' : 'Configuration Failed'}
                </p>
                <p
                  className={`text-sm ${
                    webhookStatus.success ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {webhookStatus.message}
                </p>
                {webhookStatus.webhookUrl && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                    Webhook URL: {webhookStatus.webhookUrl}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-blue-800 mb-1">Setup Instructions</p>
              <div className="text-sm text-blue-700 space-y-1">
                <p>1. Make sure you have WhatsApp Business API access</p>
                <p>2. Enter your verified WhatsApp Business phone number</p>
                <p>3. Configure your webhook URL in your WhatsApp Business dashboard</p>
                <p>4. Test the connection by sending a message to your bot</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 