'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { BotApiClient } from '@/lib/api/bot-client'

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

// Global state to prevent multiple polling instances
let globalPollingInterval: NodeJS.Timeout | null = null
let globalPollingSubscribers = new Set<(status: WhatsAppStatus | null, error: string | null) => void>()

export const useWhatsAppStatus = () => {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const { user } = useUser()

  // Add debounce mechanism to prevent excessive calls
  const lastCallTimeRef = useRef<number>(0)
  const DEBOUNCE_DELAY = 30000 // 30 seconds between calls (increased from 2 seconds)

  // Polling state management
  const globalPollingInterval = useRef<NodeJS.Timeout | null>(null)
  const pollingStartTimeRef = useRef<number | null>(null)
  const retryCountRef = useRef(0)
  const consecutiveErrorsRef = useRef(0)
  const backoffIntervalRef = useRef(2000)
  const maxRetries = 3 // Reduced from 5 to 3
  const maxPollingDuration = 60000 // 1 minute maximum polling duration (reduced from 2 minutes)
  const maxConsecutiveErrors = 2 // Reduced from 3 to 2
  const maxBackoffInterval = 15000 // Max 15 seconds (reduced from 30 seconds)

  const stopPolling = useCallback(() => {
    if (globalPollingInterval.current) {
      clearInterval(globalPollingInterval.current)
      globalPollingInterval.current = null
      console.log('⏸️ [DEBUG] useWhatsAppStatus: Global polling stopped')
    }
    setIsPolling(false)
    pollingStartTimeRef.current = null
    retryCountRef.current = 0
    consecutiveErrorsRef.current = 0
  }, [])

  const fetchStatus = useCallback(async () => {
    if (!user?.id) return

    // Add debounce mechanism
    const now = Date.now()
    if (now - lastCallTimeRef.current < DEBOUNCE_DELAY) {
      console.log('⏸️ [DEBUG] useWhatsAppStatus: Debouncing API call')
      return
    }
    lastCallTimeRef.current = now

    // Check if we've exceeded max retries
    if (retryCountRef.current >= maxRetries) {
      console.log('⏸️ [DEBUG] useWhatsAppStatus: Max retries reached, stopping polling')
      stopPolling()
      setError('Maximum retry attempts reached')
      return
    }

    // Check if we've exceeded max polling duration
    if (pollingStartTimeRef.current && Date.now() - pollingStartTimeRef.current > maxPollingDuration) {
      console.log('⏸️ [DEBUG] useWhatsAppStatus: Max polling duration reached, stopping polling')
      stopPolling()
      setError('Maximum polling duration reached')
      return
    }

    try {
      console.log('🔍 [DEBUG] useWhatsAppStatus: Fetching status, retry count:', retryCountRef.current)
      
      // ✅ Create BotApiClient instance with clerkUserId
      const botApiClient = new BotApiClient(user.id)
      const response = await botApiClient.getWhatsAppStatus(user.id)
      retryCountRef.current = 0 // Reset retry count on success
      consecutiveErrorsRef.current = 0 // Reset consecutive errors on success
      backoffIntervalRef.current = 2000 // Reset backoff interval on success
      
      // Add debug logging to see what we're receiving
      console.log('🔍 [DEBUG] useWhatsAppStatus: Raw response from API:', JSON.stringify(response, null, 2))
      console.log('🔍 [DEBUG] useWhatsAppStatus: Response structure:', {
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        session: response.data?.session,
        realTimeStatus: response.data?.realTimeStatus,
        latestConnectionAttempt: response.data?.latestConnectionAttempt
      })
      
      setStatus(response)
      setError(null)
      
      // Stop polling if connection is established (check multiple possible fields)
      const isConnected = response?.session?.isConnected || 
                         response?.realTimeStatus?.isConnected || 
                         response?.latestConnectionAttempt?.status === 'connected'
      
      console.log('🔍 [DEBUG] useWhatsAppStatus: Connection detection:', {
        sessionConnected: response?.session?.isConnected,
        realTimeConnected: response?.realTimeStatus?.isConnected,
        connectionStatus: response?.latestConnectionAttempt?.status,
        finalConnected: isConnected
      })
      
      if (isConnected) {
        console.log('✅ [DEBUG] useWhatsAppStatus: Connection established, stopping polling')
        console.log('🔍 [DEBUG] useWhatsAppStatus: Connection details:', {
          sessionConnected: response?.session?.isConnected,
          realTimeConnected: response?.realTimeStatus?.isConnected,
          connectionStatus: response?.latestConnectionAttempt?.status,
          phoneNumber: response?.session?.phoneNumber
        })
        stopPolling()
      }
    } catch (error) {
      retryCountRef.current += 1
      consecutiveErrorsRef.current += 1
      console.error('❌ [DEBUG] useWhatsAppStatus: Error fetching status:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch status'
      setError(errorMessage)
      
      // Stop polling immediately on rate limit errors
      if (errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('RATE_LIMIT')) {
        console.log('⏸️ [DEBUG] useWhatsAppStatus: Rate limit detected, implementing exponential backoff')
        
        // Implement exponential backoff for rate limits
        backoffIntervalRef.current = Math.min(backoffIntervalRef.current * 2, maxBackoffInterval)
        console.log('⏸️ [DEBUG] useWhatsAppStatus: Backoff interval increased to:', backoffIntervalRef.current)
        
        // Restart polling with new interval
        if (globalPollingInterval.current) {
          clearInterval(globalPollingInterval.current)
          globalPollingInterval.current = setInterval(async () => {
            await fetchStatus()
          }, backoffIntervalRef.current)
        }
        
        return
      }
      
      // Stop polling if too many consecutive errors
      if (consecutiveErrorsRef.current >= maxConsecutiveErrors) {
        console.log('⏸️ [DEBUG] useWhatsAppStatus: Too many consecutive errors, stopping polling')
        stopPolling()
      }
    }
  }, [user?.id, stopPolling])

  const startPolling = useCallback(() => {
    // DISABLED: No more polling to prevent rate limiting
    console.log('⏸️ [DEBUG] useWhatsAppStatus: Polling DISABLED to prevent rate limiting')
    return;
    
    if (isPolling) {
      console.log('⚠️ [DEBUG] useWhatsAppStatus: Already polling, skipping')
      return
    }

    console.log('🔍 [DEBUG] useWhatsAppStatus: Starting polling')
    setIsPolling(true)
    pollingStartTimeRef.current = Date.now()
    retryCountRef.current = 0
    consecutiveErrorsRef.current = 0

    // Clear any existing interval first
    if (globalPollingInterval.current) {
      clearInterval(globalPollingInterval.current)
    }

    // Start global polling with exponential backoff
    globalPollingInterval.current = setInterval(async () => {
      await fetchStatus()
    }, backoffIntervalRef.current) // Start with 2 seconds, increases on rate limits

    console.log('✅ [DEBUG] useWhatsAppStatus: Polling started')
  }, [isPolling, fetchStatus])

  const initiateConnection = useCallback(async () => {
    // DISABLED: No automatic connection initiation to prevent rate limiting
    console.log('⏸️ [DEBUG] useWhatsAppStatus: Connection initiation DISABLED to prevent rate limiting')
    return;
    
    if (!user?.id) {
      console.log('❌ [DEBUG] useWhatsAppStatus: No user ID available for connection')
      return
    }

    console.log('🔍 [DEBUG] useWhatsAppStatus: initiateConnection() called for userId:', user.id)

    try {
      // ✅ Create BotApiClient instance with clerkUserId
      const botApiClient = new BotApiClient(user.id);
      const response = await botApiClient.initiateWhatsAppConnection(user.id)
      console.log('🔍 [DEBUG] useWhatsAppStatus: initiateConnection response:', response)
      
      if (response.success) {
        console.log('✅ [DEBUG] useWhatsAppStatus: Connection initiated successfully')
        
        // Start polling for connection status
        startPolling()
        
        // Stop polling after 2 minutes (QR code expiry)
        setTimeout(() => {
          if (isPolling) {
            console.log('🔍 [DEBUG] useWhatsAppStatus: QR code polling stopped (timeout)')
            stopPolling()
          }
        }, 120000)
      } else {
        throw new Error(response.error?.message || 'Failed to initiate connection')
      }
    } catch (error) {
      console.error('❌ [DEBUG] useWhatsAppStatus: Error initiating connection:', error)
      throw error
    }
  }, [user?.id, startPolling, stopPolling, isPolling])

  // Initial fetch on mount - DISABLED to prevent rate limiting
  useEffect(() => {
    // DISABLED: No automatic fetching to prevent rate limiting
    console.log('⏸️ [DEBUG] useWhatsAppStatus: Initial fetch DISABLED to prevent rate limiting')
    return;
    
    if (user?.id) {
      fetchStatus()
    }
  }, [user?.id]) // Remove fetchStatus from dependencies to prevent infinite loop

  // Stop polling when connection is established (check multiple fields)
  useEffect(() => {
    const isConnected = status?.session?.isConnected || 
                       status?.realTimeStatus?.isConnected || 
                       status?.latestConnectionAttempt?.status === 'connected'
    
    if (isConnected && isPolling) {
      console.log('✅ [DEBUG] useWhatsAppStatus: Connection established, stopping polling')
      console.log('🔍 [DEBUG] useWhatsAppStatus: Connection status:', {
        sessionConnected: status?.session?.isConnected,
        realTimeConnected: status?.realTimeStatus?.isConnected,
        connectionStatus: status?.latestConnectionAttempt?.status,
        phoneNumber: status?.session?.phoneNumber
      })
      stopPolling()
    }
  }, [status?.session?.isConnected, status?.realTimeStatus?.isConnected, status?.latestConnectionAttempt?.status, isPolling, stopPolling])

  // Stop polling after 2 minutes to prevent infinite loops
  useEffect(() => {
    if (isPolling) {
      const timeout = setTimeout(() => {
        console.log('⏰ [DEBUG] useWhatsAppStatus: Polling timeout reached, stopping')
        stopPolling()
      }, 120000) // 2 minutes

      return () => clearTimeout(timeout)
    }
  }, [isPolling, stopPolling])

  // Stop polling if there's an error or rate limit
  useEffect(() => {
    if (error && isPolling) {
      console.log('❌ [DEBUG] useWhatsAppStatus: Error detected, stopping polling:', error);
      stopPolling();
    }
  }, [error, isPolling, stopPolling]);

  // Stop polling if we get a 429 (rate limit) error
  useEffect(() => {
    if (error?.includes('429') || error?.includes('rate limit')) {
      console.log('⏸️ [DEBUG] useWhatsAppStatus: Rate limit detected, stopping polling');
      stopPolling();
    }
  }, [error, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  return {
    status,
    loading,
    error,
    isPolling,
    fetchStatus,
    startPolling,
    stopPolling,
    initiateConnection
  }
} 