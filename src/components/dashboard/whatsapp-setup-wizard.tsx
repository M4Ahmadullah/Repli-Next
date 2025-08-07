'use client'

import { useState, useEffect, useCallback } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Loader2, Smartphone, CheckCircle, XCircle, RefreshCw, ArrowRight } from 'lucide-react'
import { BotApiClient } from '@/lib/api/bot-client'
import { useWhatsAppStatus } from '@/hooks/useWhatsAppStatus'
import Image from 'next/image';

interface Step {
  id: number
  title: string
  description: string
  status: 'pending' | 'completed' | 'error' | 'current'
}

interface WhatsAppSession {
  sessionId: string
  isConnected: boolean
  connectionStatus: string
  phoneNumber?: string
  displayName?: string
  lastSeen?: string
  qrCode?: string
  qrCodeExpiry?: string
  createdAt: string
  expiresAt: string
}

interface WhatsAppStatus {
  userId: string
  session: WhatsAppSession
  realTimeStatus: {
    isConnected: boolean
    connectionState: string
    queuedMessages: number
    lastSeen: string
  }
  latestConnectionAttempt: {
    connectionId: string
    status: string
    attempts: number
    startTime: string
    errorReason?: string
  }
}

export default function WhatsAppSetupWizard() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [steps, setSteps] = useState<Step[]>([
    {
      id: 1,
      title: 'Welcome',
      description: 'Set up WhatsApp integration for your bot',
      status: 'current'
    },
    {
      id: 2,
      title: 'Choose Connection',
      description: 'Select how to connect WhatsApp',
      status: 'pending'
    },
    {
      id: 3,
      title: 'Generate QR Code',
      description: 'Create a QR code for WhatsApp login',
      status: 'pending'
    },
    {
      id: 4,
      title: 'Scan QR Code',
      description: 'Scan the QR code with your WhatsApp mobile app',
      status: 'pending'
    },
    {
      id: 5,
      title: 'Connection Test',
      description: 'Verify the WhatsApp connection is working',
      status: 'pending'
    },
    {
      id: 6,
      title: 'Complete',
      description: 'WhatsApp integration is ready',
      status: 'pending'
    }
  ])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const [usePreviousNumber, setUsePreviousNumber] = useState<boolean | null>(null)
  const [previousPhoneNumber, setPreviousPhoneNumber] = useState<string | null>(null)

  // Use the centralized WhatsApp status hook
  const {
    status,
    isPolling,
    startPolling,
    stopPolling,
    initiateConnection: initiateConnectionFromHook
  } = useWhatsAppStatus()

  const getFirebaseToken = async () => {
    try {
      const token = await getToken()
      if (!token) {
        throw new Error('No Firebase token available')
      }
      return token
    } catch (error) {
      console.error('Error getting Firebase token:', error)
      throw error
    }
  }

  const updateStepStatus = useCallback((stepId: number, status: Step['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status }
        : step
    ))
  }, [])

  const handleGenerateQRCode = async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      console.log('🔍 [DEBUG] WhatsAppSetupWizard: Checking session status first')
      
      // Step 1: Check session status to see if user has existing credentials
      const statusResponse = await fetch(`/api/v1/whatsapp/session-status/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!statusResponse.ok) {
        throw new Error('Failed to check session status')
      }

      const sessionStatus = await statusResponse.json()
      console.log('🔍 [DEBUG] WhatsAppSetupWizard: Session status:', sessionStatus)

      // Step 2: Handle based on user choice and session status
      if (usePreviousNumber === true && sessionStatus.canUseExisting) {
        // User chose to use existing session and it's available
        console.log('🔍 [DEBUG] WhatsAppSetupWizard: Using existing session')
        
        const connectResponse = await fetch(`/api/v1/whatsapp/connect/temp-bot-id`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: user.id,
            useExistingSession: true
          })
        })

        if (connectResponse.ok) {
          const connectResult = await connectResponse.json()
          
          if (connectResult.action === 'use-existing') {
            setPreviousPhoneNumber(connectResult.phoneNumber)
            updateStepStatus(3, 'completed')
            updateStepStatus(4, 'completed')
            setCurrentStep(5)
            setConnectionStatus('connected')
            return
          }
        }
      }

      // Step 3: Generate new QR code (either user chose new or no existing session)
      console.log('🔍 [DEBUG] WhatsAppSetupWizard: Generating new QR code')
      const botApiClient = new BotApiClient(user.id)
      const response = await botApiClient.initiateWhatsAppConnection(user.id)
      console.log('🔍 [DEBUG] WhatsAppSetupWizard: Response:', response)
      
      if (response.success) {
        // Extract QR code from the correct location in the response
        const qrCodeData = response.data?.qrCode || response.qrCode
        console.log('🔍 [DEBUG] WhatsAppSetupWizard: QR code data found:', !!qrCodeData)
        
        if (qrCodeData) {
          // Ensure QR code has proper data URL format
          let formattedQrCode = qrCodeData
          if (!qrCodeData.startsWith('data:')) {
            formattedQrCode = `data:image/png;base64,${qrCodeData}`
          }
          
          setQrCode(formattedQrCode)
          console.log('✅ [DEBUG] WhatsAppSetupWizard: QR code set successfully')
        } else {
          console.log('⚠️ [DEBUG] WhatsAppSetupWizard: No QR code data in response')
          console.log('🔍 [DEBUG] WhatsAppSetupWizard: Available data keys:', Object.keys(response || {}))
          if (response.data) {
            console.log('🔍 [DEBUG] WhatsAppSetupWizard: Data keys:', Object.keys(response.data || {}))
          }
        }
        
        setConnectionStatus('connecting')
        updateStepStatus(3, 'completed')
        setCurrentStep(4)
        
        // Start polling for connection status using the centralized hook
        startPolling()
      } else {
        throw new Error(response.error?.message || 'Failed to generate QR code')
      }
    } catch (error) {
      console.error('❌ [DEBUG] WhatsAppSetupWizard: Error generating QR code:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate QR code')
      updateStepStatus(3, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const botApiClient = new BotApiClient(user.id)
      const response = await botApiClient.getWhatsAppStatus(user.id)
      
      if (response.success && response.data?.session?.isConnected) {
        updateStepStatus(4, 'completed')
        updateStepStatus(5, 'current')
        setCurrentStep(5)
        setConnectionStatus('connected')
      } else {
        throw new Error('WhatsApp connection test failed')
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      setError(error instanceof Error ? error.message : 'Connection test failed')
      updateStepStatus(4, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = () => {
    updateStepStatus(5, 'completed')
    // Redirect to dashboard or show success message
  }

  // Update connection status based on WhatsApp status (DISABLED polling to reduce requests)
  useEffect(() => {
    if (status?.session?.isConnected) {
      setConnectionStatus('connected')
      updateStepStatus(3, 'completed')
      updateStepStatus(4, 'current')
      setCurrentStep(4)
      // stopPolling() // DISABLED to reduce requests
    } else if (isPolling) {
      setConnectionStatus('connecting')
    } else {
      setConnectionStatus('disconnected')
    }
  }, [status?.session?.isConnected, isPolling, updateStepStatus])

  // Clear QR code when connection is established
  useEffect(() => {
    if (status?.session?.isConnected && qrCode) {
      setQrCode(null)
    }
  }, [status?.session?.isConnected, qrCode])

  const getStepIcon = (step: Step) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'current':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
    }
  }

  const getProgressPercentage = () => {
    const completedSteps = steps.filter(step => step.status === 'completed').length
    return (completedSteps / steps.length) * 100
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <Smartphone className="w-16 h-16 mx-auto text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Welcome to WhatsApp Setup</h3>
              <p className="text-gray-600 mb-6">
                Connect your WhatsApp account to enable automated messaging for your bot.
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">What you'll need:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Your WhatsApp mobile app</li>
                <li>• A stable internet connection</li>
                <li>• Your phone nearby to scan the QR code</li>
              </ul>
            </div>

            <Button 
              onClick={() => {
                updateStepStatus(1, 'completed')
                setCurrentStep(2)
              }}
              className="w-full"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Choose Connection</h3>
              <p className="text-gray-600 mb-4">
                Select how you want to connect your WhatsApp account.
              </p>
            </div>

            <Button 
              onClick={() => {
                setUsePreviousNumber(true)
                updateStepStatus(2, 'completed')
                setCurrentStep(3)
              }}
              className="w-full"
            >
              Use Existing WhatsApp Number
            </Button>

            <Button 
              onClick={() => {
                setUsePreviousNumber(false)
                updateStepStatus(2, 'completed')
                setCurrentStep(3)
              }}
              className="w-full"
            >
              Generate New QR Code
            </Button>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Generate QR Code</h3>
              <p className="text-gray-600 mb-4">
                {usePreviousNumber === true 
                  ? 'Checking for existing WhatsApp connection...'
                  : 'We\'ll create a QR code that you can scan with your WhatsApp mobile app.'
                }
              </p>
            </div>

            {usePreviousNumber === true && previousPhoneNumber ? (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Using Previous Connection</span>
                </div>
                <p className="text-sm text-green-700">
                  <strong>Phone Number:</strong> {previousPhoneNumber}
                </p>
              </div>
            ) : (
            <Button 
              onClick={handleGenerateQRCode}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {usePreviousNumber === true ? 'Checking Connection...' : 'Generating QR Code...'}
                </>
              ) : (
                  usePreviousNumber === true ? 'Use Previous Number' : 'Generate QR Code'
              )}
            </Button>
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
              <p className="text-gray-600 mb-4">
                Open WhatsApp on your phone and scan this QR code.
              </p>
            </div>

            {qrCode && (
              <div className="flex items-center justify-center">
                <Image src={qrCode} alt="WhatsApp QR Code" width={200} height={200} />
              </div>
            )}

            <div className="text-sm text-gray-600 mt-4">
              <p className="font-medium">How to scan:</p>
              <p>1. Open WhatsApp on your phone</p>
              <p>2. Go to Settings → Linked Devices</p>
              <p>3. Tap "Link a Device" and scan this code</p>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Badge variant={connectionStatus === 'connecting' ? 'default' : 'secondary'}>
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Waiting for scan'}
              </Badge>
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Test Connection</h3>
              <p className="text-gray-600 mb-4">
                Let's verify that your WhatsApp connection is working properly.
              </p>
            </div>

            <Button 
              onClick={handleTestConnection}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
          </div>
        )

      case 6:
        return (
          <div className="space-y-4 text-center">
            <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Setup Complete!</h3>
            <p className="text-gray-600 mb-6">
              Your WhatsApp integration is now ready. You can start using your bot to send and receive messages.
            </p>

            <Button 
              onClick={handleComplete}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
          WhatsApp Setup Wizard
        </h1>
        <p className="text-emerald-600 dark:text-emerald-400 mt-2">
          Connect your WhatsApp account to enable AI-powered messaging
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Setup Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={getProgressPercentage()} className="w-full" />
            
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-3">
                  {getStepIcon(step)}
                  <div className="flex-1">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-sm text-gray-600">{step.description}</div>
                  </div>
                  {step.status === 'current' && (
                    <Badge variant="secondary">Current</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {renderStepContent()}
        </CardContent>
      </Card>
    </div>
  )
} 