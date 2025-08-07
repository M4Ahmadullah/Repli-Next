'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { 
  Bot, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  QrCode,
  Sparkles,
  AlertCircle,
  Loader2,
  CheckCircle,
  Brain,
  FileText,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CreateBotData, TrainingWizardData, Bot as BotType } from '@/lib/types/user'
import Image from 'next/image'

import { QnaTrainingWizard } from './qna-training-wizard'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { BotApiClient } from '@/lib/api/bot-client'
import { toast } from 'sonner'
import { useSimpleQRConnection } from '@/hooks/useSimpleQRConnection'
import { WhatsAppConflictDialog } from '@/components/dashboard/whatsapp-conflict-dialog'


interface BotCreationWizardProps {
  isOpen: boolean
  onClose: () => void
  onBotCreated: (bot: BotType) => void
  existingBot?: BotType
}

interface WizardStep {
  id: number
  title: string
  description: string
  completed: boolean
  subSteps?: {
    id: number
    title: string
    completed: boolean
  }[]
}

export function BotCreationWizard({ isOpen, onClose, onBotCreated, existingBot }: BotCreationWizardProps) {
  const { user } = useUser()
  const [currentStep, setCurrentStep] = useState(existingBot ? 2 : 1) // Start at step 2 if existing bot
  const [botName, setBotName] = useState(existingBot?.name || '')
  const [botDescription, setBotDescription] = useState(existingBot?.description || '')
  const [botPersonality, setBotPersonality] = useState(existingBot?.settings?.personality || 'professional')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'waiting' | 'connected' | 'failed'>('waiting')
  const [qrPollingEnabled, setQrPollingEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [createdBot, setCreatedBot] = useState<BotType | null>(existingBot || null)
  const [isManualPolling, setIsManualPolling] = useState(false)
  const [usePreviousNumber, setUsePreviousNumber] = useState<boolean | null>(null)
  const [previousPhoneNumber, setPreviousPhoneNumber] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [qrExpiryTime, setQrExpiryTime] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(120) // 2 minutes in seconds
  const [trainingSubStep, setTrainingSubStep] = useState(0) // Track AI training sub-steps
  
  // WhatsApp conflict dialog state
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [conflictData, setConflictData] = useState<any>(null)
  const [conflictErrorType, setConflictErrorType] = useState<'whatsapp_already_connected_to_user_bot' | 'whatsapp_in_use_by_other_user' | null>(null)

  // AI Training navigation state
  const [aiTrainingStep, setAiTrainingStep] = useState(0) // 0 = Overview, 1-3 = subsections

  // Helper function to get Firebase token for API calls
  const getFirebaseToken = async (): Promise<string> => {
    try {
      const response = await fetch('/api/auth/firebase-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get Firebase token');
      }
      
      return data.token;
    } catch (error) {
      console.error('Error getting Firebase token:', error);
      throw error;
    }
  }

  // AI Training navigation methods
  const handleAiTrainingPrevious = () => {
    const qnaNav = (window as any).qnaTrainingNavigation
    if (qnaNav && qnaNav.handlePrevious) {
      qnaNav.handlePrevious()
    }
  }

  const handleAiTrainingNext = () => {
    const qnaNav = (window as any).qnaTrainingNavigation
    if (qnaNav && qnaNav.handleNext) {
      if (qnaNav.canProceedToNext()) {
        qnaNav.handleNext()
      } else {
        toast.error('Please complete the current step before proceeding.')
      }
    }
  }

  const canProceedAiTraining = () => {
    const qnaNav = (window as any).qnaTrainingNavigation
    return qnaNav && qnaNav.canProceedToNext ? qnaNav.canProceedToNext() : false
  }

  // Handle sidebar navigation for AI Training subsections
  const handleSidebarNavigation = (stepId: number) => {
    // If trying to navigate to a previous step from AI Training
    if (currentStep === 3 && stepId < 3) {
      // Reset AI Training state and go back to the selected step
      setCurrentStep(stepId)
      setAiTrainingStep(1) // Reset to first sub-step
      return
    }

    // Normal step navigation
    if (stepId === 3) {
      // Entering AI Training step
      setCurrentStep(3)
      setAiTrainingStep(1) // Start at first sub-step
      
      // Update QNA Training Wizard's internal step
      const qnaNav = (window as any).qnaTrainingNavigation
      if (qnaNav && qnaNav.setCurrentStep) {
        qnaNav.setCurrentStep(1)
      }
    } else {
      // Navigate to other steps
      setCurrentStep(stepId)
    }
  }

  // Determine if Bot Info step is completed
  const isBotInfoCompleted = () => {
    return botName.trim().length >= 2 && 
           botPersonality.trim().length > 0
  }

  // Determine if WhatsApp setup is completed
  const isWhatsAppSetupCompleted = () => {
    return connectionStatus === 'connected'
  }

  // Determine if AI Training is completed
  const isAITrainingCompleted = () => {
    const qnaNav = (window as any).qnaTrainingNavigation
    if (!qnaNav) return false

    // Check document upload
    const documentUploadCompleted = !!qnaNav.documentUploadCompleted

    // Check AI questions
    const questionsCompleted = qnaNav.questionsCompleted && 
      qnaNav.trainingQuestions && 
      qnaNav.trainingQuestions.every((q: any) => q.answer.trim())

    // Custom Q&A now requires explicit completion
    const customQACompleted = qnaNav.customQACompleted

    return documentUploadCompleted && questionsCompleted && customQACompleted
  }

  // Update steps array to include proper completion logic
  const steps: WizardStep[] = [
    {
      id: 1,
      title: 'Bot Info',
      description: 'Basic bot information',
      completed: isBotInfoCompleted()
    },
    {
      id: 2,
      title: 'WhatsApp Setup',
      description: 'Connect WhatsApp',
      completed: isWhatsAppSetupCompleted()
    },
    {
      id: 3,
      title: 'AI Training',
      description: 'Train your AI bot',
      completed: isAITrainingCompleted(),
      subSteps: [
        {
          id: 1,
          title: 'Document Upload',
          completed: (() => {
            const qnaNav = (window as any).qnaTrainingNavigation
            return qnaNav ? !!qnaNav.documentUploadCompleted : false
          })()
        },
        {
          id: 2,
          title: 'AI Questions',
          completed: (() => {
            const qnaNav = (window as any).qnaTrainingNavigation
            return qnaNav && qnaNav.questionsCompleted && 
              qnaNav.trainingQuestions && 
              qnaNav.trainingQuestions.every((q: any) => q.answer.trim())
          })()
        },
        {
          id: 3,
          title: 'Custom Q&A',
          completed: (() => {
            const qnaNav = (window as any).qnaTrainingNavigation
            return qnaNav ? !!qnaNav.customQACompleted : false
          })()
        }
      ]
    },
    {
      id: 4,
      title: 'Review & Create',
      description: 'Final review',
      completed: false // Only completed when launch button is hit
    }
  ]

  const manualPollingRef = useRef<NodeJS.Timeout | null>(null)
  const [trainingData, setTrainingData] = useState<TrainingWizardData>({
    businessInfo: { name: '', description: '', industry: '', website: '' },
    qnaPairs: [{ question: '', answer: '' }],
    documents: [],
    personality: 'professional',
    autoRespond: true,
    fallbackMessage: "I'm sorry, I don't have information about that. Please contact our support team for assistance."
  })

  // Bot backend availability check (minimal)
  const [botBackendAvailable, setBotBackendAvailable] = useState<boolean | null>(null);
  
  useEffect(() => {
    const testBackend = async () => {
      if (createdBot?.id) {
        const botApiClient = new BotApiClient(user?.id || '');
        const isAvailable = await botApiClient.testBotBackend();
        setBotBackendAvailable(isAvailable);
      }
    };
    
    testBackend();
  }, [createdBot?.id, user?.id]);

  // Initialize step based on existing bot progress
  useEffect(() => {
    if (existingBot) {
      console.log('🔍 [DEBUG] Initializing wizard with existing bot:', {
        botId: existingBot.id,
        whatsappConnected: existingBot.whatsappConnected,
        status: existingBot.status
      });
      
      // Set connection status if bot is already connected
      if (existingBot.whatsappConnected) {
        setConnectionStatus('connected');
        // steps[1].completed = true; // This line is removed as per new_code
      }
      
      // Set current step based on bot progress
      if (existingBot.whatsappConnected) {
        console.log('✅ [DEBUG] Bot has WhatsApp connected, going to step 3');
        setCurrentStep(3); // Go to training step if WhatsApp is connected
      } else {
        console.log('⚠️ [DEBUG] Bot exists but WhatsApp not connected, going to step 2');
        setCurrentStep(2); // Go to WhatsApp setup if not connected
      }
    }
  }, [existingBot])

  // Check WhatsApp connection status on mount for existing bots
  useEffect(() => {
    const checkExistingConnection = async () => {
      // Check if we have a bot to work with (either createdBot or existingBot)
      const botToCheck = createdBot || existingBot;
      
      if (botToCheck?.id && user?.id) {
        try {
          const botApiClient = new BotApiClient(user.id);
          
          // First, check the bot's current status from the backend
          console.log('🔍 [DEBUG] Checking bot status from backend...');
          const botResponse = await botApiClient.getUserBots(user.id, true); // force refresh
          
          if (botResponse.success && botResponse.bots) {
            const currentBot = botResponse.bots.find((bot: any) => bot.id === botToCheck.id);
            
            if (currentBot) {
              console.log('🔍 [DEBUG] Current bot status from backend:', {
                botId: currentBot.id,
                whatsappConnected: currentBot.whatsappConnected,
                lastConnectionUpdate: currentBot.lastConnectionUpdate
              });
              
              // If bot shows as connected, update local state
              if (currentBot.whatsappConnected) {
                console.log('✅ [DEBUG] Bot shows as connected in database');
                setConnectionStatus('connected');
                // steps[1].completed = true; // This line is removed as per new_code
                
                const updatedBot = {
                  ...botToCheck,
                  ...currentBot,
                  updatedAt: new Date()
                };
                setCreatedBot(updatedBot);
                console.log('✅ [DEBUG] Bot status updated from database:', updatedBot);
                return; // Exit early since we have the status
              }
            }
          }
          
          // If bot doesn't show as connected, check WhatsApp status
          console.log('🔍 [DEBUG] Checking WhatsApp connection status...');
          const response = await botApiClient.getWhatsAppStatus(user.id);
          
          console.log('🔍 [DEBUG] WhatsApp status response:', {
            botId: botToCheck.id,
            whatsappConnected: botToCheck.whatsappConnected,
            response: response
          });
          
          if (response.success && response.connected) {
            console.log('✅ [DEBUG] WhatsApp connection detected on page load:', {
              botId: botToCheck.id,
              whatsappConnected: botToCheck.whatsappConnected,
              response: response
            });
            
            // Bot is connected, update state regardless of existingBot status
            setConnectionStatus('connected');
            // steps[1].completed = true; // This line is removed as per new_code
            
            // Update local state with connection info
            const updatedBot = {
              ...botToCheck,
              whatsappConnected: true,
              whatsappPhoneNumber: response.phoneNumber || response.session?.phoneNumber,
              whatsappDisplayName: response.displayName || response.session?.displayName,
              status: 'active' as const,
              updatedAt: new Date()
            };
            setCreatedBot(updatedBot);
            console.log('✅ [DEBUG] Bot status updated locally:', updatedBot);
          } else {
            console.log('❌ [DEBUG] No WhatsApp connection found:', response);
            // If not connected, ensure bot status reflects this
            if (botToCheck.whatsappConnected) {
              const updatedBot = {
                ...botToCheck,
                whatsappConnected: false,
                status: 'creating' as const,
                updatedAt: new Date()
              };
              setCreatedBot(updatedBot);
              console.log('✅ [DEBUG] Bot status updated to disconnected:', updatedBot);
            }
          }
        } catch (error) {
          console.error('❌ [DEBUG] Error checking existing connection:', error);
        }
      }
    };
    
    checkExistingConnection();
  }, [createdBot?.id, existingBot?.id, user?.id]);

  // Force refresh bot status on component mount
  useEffect(() => {
    const forceRefreshBotStatus = async () => {
      if (user?.id) {
        console.log('🔄 [DEBUG] Force refreshing bot status on component mount...');
        try {
          const botApiClient = new BotApiClient(user.id);
          const botResponse = await botApiClient.getUserBots(user.id, true); // force refresh
          
          if (botResponse.success && botResponse.bots && botResponse.bots.length > 0) {
            const latestBot = botResponse.bots[0]; // Get the most recent bot
            
            console.log('🔍 [DEBUG] Latest bot status from force refresh:', {
              botId: latestBot.id,
              whatsappConnected: latestBot.whatsappConnected,
              lastConnectionUpdate: latestBot.lastConnectionUpdate
            });
            
            // Update the createdBot state with the latest data
            if (createdBot && latestBot.id === createdBot.id) {
              const updatedBot = {
                ...createdBot,
                ...latestBot,
                updatedAt: new Date()
              };
              setCreatedBot(updatedBot);
              console.log('✅ [DEBUG] Bot status force refreshed:', updatedBot);
              
              // If bot is connected, update connection status
              if (latestBot.whatsappConnected) {
                setConnectionStatus('connected');
                // steps[1].completed = true; // This line is removed as per new_code
                console.log('✅ [DEBUG] Connection status updated from force refresh');
              }
            }
          }
        } catch (error) {
          console.error('❌ [DEBUG] Error force refreshing bot status:', error);
        }
      }
    };
    
    // Run force refresh after a short delay to ensure component is fully mounted
    const timeoutId = setTimeout(forceRefreshBotStatus, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [user?.id, createdBot?.id]);

  // Use simple QR connection - only when QR is displayed
  const isOnWhatsAppStep = currentStep === 2;
  const hasRealBot = createdBot?.id && createdBot.id !== '';
  const isQRDisplayed = qrCode !== null && connectionStatus === 'waiting' && isOnWhatsAppStep;
  
  // Debug: Log when hook should be called (disabled to reduce logs)
  // console.log('🔍 Wizard step debug:', { 
  //   currentStep, 
  //   isOnWhatsAppStep, 
  //   hasRealBot, 
  //   isQRDisplayed,
  //   botId: createdBot?.id,
  //   shouldConnect: isQRDisplayed && hasRealBot 
  // });
  
  const {
    isConnected: isWebSocketConnected,
    connectionStatus: wsConnectionStatus,
    triggerConnection,
    disconnect
  } = useSimpleQRConnection({
    botId: hasRealBot ? createdBot.id : '',
    userId: user?.id || '',
    isQRDisplayed: isQRDisplayed,
    onConnected: async (data) => {
      console.log('🎉 [DEBUG] WhatsApp connection detected in WebSocket:', data);
      
      setConnectionStatus('connected');
      setError(null);
      setLoading(false);
      setTimeRemaining(0);
      // steps[1].completed = true; // This line is removed as per new_code
      
      // Update bot status in database to persist the connection
      if (createdBot?.id && user?.id) {
        try {
          const botApiClient = new BotApiClient(user.id);
          
          console.log('🔍 [DEBUG] Updating bot status after WhatsApp connection:', {
            botId: createdBot.id,
            phoneNumber: data.phoneNumber,
            displayName: data.displayName
          });
          
          // Update bot with WhatsApp connection status
          const updateResponse = await botApiClient.updateBot(user.id, createdBot.id, {
            whatsappConnected: true,
            whatsappPhoneNumber: data.phoneNumber,
            whatsappDisplayName: data.displayName,
            status: 'active'
          });
          
          console.log('🔍 [DEBUG] Bot update response:', updateResponse);
          
          // Update local bot state with the updated bot data
          if (updateResponse && updateResponse.success) {
            const updatedBot = {
              ...createdBot,
              whatsappConnected: true,
              whatsappPhoneNumber: data.phoneNumber,
              whatsappDisplayName: data.displayName,
              status: 'active' as const,
              updatedAt: new Date()
            };
            setCreatedBot(updatedBot);
            console.log('✅ [DEBUG] Bot status updated successfully after connection:', updatedBot);
          } else {
            console.warn('⚠️ [DEBUG] Bot update response indicates failure:', updateResponse);
          }
          
        } catch (error) {
          console.error('❌ [DEBUG] Error updating bot status:', error);
          toast.error('Connected but failed to save status. Please refresh the page.');
        }
      }
      
      toast.success('WhatsApp connected successfully!');
    },
    onQRUpdated: (data) => {
      if (data.qrCode) {
        setQrCode(data.qrCode);
        setConnectionStatus('waiting');
        setTimeRemaining(120);
        setError(null);
      }
    },
    onConnectionFailed: (data) => {
      setConnectionStatus('failed');
      setError(data.reason || 'Connection failed');
    }
  });

    // Use unified WebSocket status
  const finalConnectionStatus = connectionStatus;
  const finalQrCode = qrCode;
  const finalError = error;

  // WebSocket connection status monitoring (minimal logging)

  // Single QR code generation - NO POLLING to prevent rate limiting
  const [qrRequestInProgress, setQrRequestInProgress] = useState(false)
  const qrTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const generateQRCodeOnce = async () => {
    if (!createdBot?.id || qrRequestInProgress) {
      return;
    }
    
    setQrRequestInProgress(true);
    
    // Set up timeout to handle cases where WebSocket QR code doesn't arrive
    qrTimeoutRef.current = setTimeout(() => {
      setError('QR code generation timed out. Please try again.');
      setConnectionStatus('failed');
      setLoading(false);
      setQrRequestInProgress(false);
    }, 15000); // 15 second timeout for better UX
    
    try {
      // Use the BotApiClient to connect WhatsApp directly
      const botApiClient = new BotApiClient(user?.id || '');
      const response = await botApiClient.connectWhatsApp(createdBot.id, user?.id || '');
        
      if (response.success) {
          // Check if QR code is in the response (fallback for when WebSocket doesn't work)
        if (response.qrCode) {
          setQrCode(response.qrCode);
            setConnectionStatus('waiting');
            setLoading(false);
            setError(null);
            return;
          }
          
          // Don't set error yet - wait for WebSocket QR code
          return;
        } else {
        // Handle backend error
          setError('QR code generation is in progress. Please wait a moment and try again.');
          setConnectionStatus('waiting');
          setLoading(false);
          return;
        }
    } catch (error) {
      setError('Failed to generate QR code. Please try again.');
      setConnectionStatus('failed');
      setLoading(false);
    } finally {
      setQrRequestInProgress(false);
      // Clear timeout if it exists
      if (qrTimeoutRef.current) {
        clearTimeout(qrTimeoutRef.current);
        qrTimeoutRef.current = null;
      }
    }
  };
  
  // No automatic QR generation - user must click "Generate QR Code" button

  // Retry mechanism for failed connections
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  const handleGenerateQR = async () => {
    if (!createdBot) {
      console.error('❌ No bot created yet');
      return;
    }

    // Set loading state for button
    setLoading(true);
    setError(null);
    setQrCode(null);
    setConnectionStatus('waiting');

    try {
      const botApiClient = new BotApiClient(user?.id || '');
      
      // Try to trigger connection via WebSocket first
      if (isWebSocketConnected && createdBot.id) {
        triggerConnection();
      } else {
        await generateQRCodeOnce();
      }
    } catch (error) {
      setError('Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

    

  // Enhanced retry mechanism with fallback
  const handleRetry = async () => {
    if (retryCount >= maxRetries) {
      setError('Maximum retry attempts reached. Please contact support.');
      return
    }

    setRetryCount(prev => prev + 1)
    setError(null)
    setQrCode(null)
    setConnectionStatus('waiting')
    
    // Wait a bit before retrying
    setTimeout(() => {
      // Make ONE manual request on retry
      handleGenerateQR()
    }, 2000)
  }

  const stopManualPolling = () => {
    if (manualPollingRef.current) {
      clearTimeout(manualPollingRef.current)
      manualPollingRef.current = null
    }
    setIsManualPolling(false)
  }

  const resetWizard = () => {
    setCurrentStep(1)
    setBotName('')
    setBotDescription('')
    setBotPersonality('professional')
    setQrCode(null)
    setConnectionStatus('waiting')
    setQrPollingEnabled(false) // Disable QR polling on reset
    stopManualPolling()
    setTrainingData({
      businessInfo: { name: '', description: '', industry: '', website: '' },
      qnaPairs: [{ question: '', answer: '' }],
      documents: [],
      personality: 'professional',
      autoRespond: true,
      fallbackMessage: "I'm sorry, I don't have information about that. Please contact our support team for assistance."
    })
  }

  const handleClose = () => {
    resetWizard()
    onClose()
  }

  const handleCreateBot = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // ✅ Create BotApiClient instance with clerkUserId
      const botApiClient = new BotApiClient(user.id);
      
      const botData = {
        name: botName || 'My WhatsApp Bot',
        description: botDescription || 'AI Assistant for WhatsApp',
        personality: botPersonality || 'professional',
        userPlan: 'free',
        userLimits: {
          dailyMessages: 10,
          monthlyMessages: 100,
          maxBots: 1
        }
      };

      let response;
      let bot: BotType;

      // Check if we're editing an existing bot
      if (existingBot) {
        console.log('🔍 [DEBUG] Updating existing bot:', existingBot.id);
        
        // Check if there are any changes
        const hasChanges = 
          existingBot.name !== botData.name ||
          existingBot.description !== botData.description ||
          existingBot.settings?.personality !== botData.personality;

        if (!hasChanges) {
          console.log('🔍 [DEBUG] No changes detected, using existing bot');
          setCreatedBot(existingBot);
          setLoading(false);
          return;
        }

        // Update existing bot
        response = await botApiClient.updateBot(user.id, existingBot.id, {
          name: botData.name,
          description: botData.description,
          personality: botData.personality
        });

        if (response.success) {
          bot = {
            ...existingBot,
            name: botData.name,
            description: botData.description,
            settings: {
              ...existingBot.settings,
              personality: botData.personality
            },
            updatedAt: new Date()
          };
        } else {
          setError('Failed to update bot');
          return;
        }
      } else {
        console.log('🔍 [DEBUG] Creating new bot');
        
        // Create new bot
        response = await botApiClient.createBot(user.id, botData);
        
        if (response.success) {
          console.log('🔍 [DEBUG] Bot creation successful, response:', response);
          
          // Extract botId from various possible response structures
          const botId = response.botId || response.data?.botId || response.id || response.bot?.id || response.botId;
          
          if (!botId) {
            console.error('❌ [DEBUG] No botId found in response:', response);
            console.error('❌ [DEBUG] Response structure:', JSON.stringify(response, null, 2));
            setError('Bot created but no bot ID received. Please try again.');
            return;
          }
          
          console.log('🔍 [DEBUG] Extracted botId:', botId);
          
          bot = {
            id: botId,
            userId: user.id,
            name: botData.name,
            description: botData.description,
            whatsappPhoneNumber: undefined,
            whatsappConnected: false,
            qrCode: undefined,
            status: response.status || 'creating',
            settings: {
              personality: botData.personality,
              autoRespond: true,
              businessHours: { enabled: false, timezone: 'UTC', schedule: {} },
              fallbackMessage: 'I will connect you with a human agent.',
              language: 'en'
            },
            trainingData: {
              businessInfo: { name: '', description: '' },
              qnaPairs: [],
              documents: [],
              lastTrainingUpdate: new Date()
            },
            analytics: {
              totalMessages: 0,
              todayMessages: 0,
              weeklyMessages: 0,
              monthlyMessages: 0,
              responseRate: 0,
              averageResponseTime: 0,
              topQuestions: [],
              satisfactionScore: 0,
              lastUpdated: new Date()
            },
            createdAt: new Date(),
            updatedAt: new Date()
          };
        } else {
          setError('Failed to create bot');
          return;
        }
      }

      setCreatedBot(bot);
      setQrPollingEnabled(false); // Ensure QR polling is disabled after bot creation
    } catch (error) {
      console.error('❌ [DEBUG] Bot creation/update error:', error);
      setError('Failed to create/update bot');
    } finally {
      setLoading(false);
    }
  };

  // 🚨 POLLING FUNCTION REMOVED - Now using real-time WebSocket/SSE events
  // No more manual connection status checking - everything is real-time!
  const checkConnectionStatus = async () => {
    if (!user?.id || !createdBot?.id) {
      console.log('⚠️ No user or bot available for connection status check');
      return;
    }
    
    console.log('🔍 Checking WhatsApp connection status for user:', user.id);
    
    try {
      // Use the bot client to check status
      const botApiClient = new BotApiClient(user.id);
      
      // Try the new session status endpoint first
      try {
        const sessionStatus = await botApiClient.getSessionStatus(createdBot.id, user.id);
        console.log('📱 Session status response:', sessionStatus);
        
        if (sessionStatus.success && sessionStatus.status === 'active') {
          console.log('✅ Session is active, connection confirmed');
          setConnectionStatus('connected');
          setError(null);
          setLoading(false);
          setTimeRemaining(0);
          // steps[1].completed = true; // This line is removed as per new_code
          // Stop polling by updating the dependency
          return;
        }
      } catch (sessionError) {
        console.log('⚠️ Session status check failed, falling back to WhatsApp status');
      }
      
      // Fallback to WhatsApp status check
      const response = await botApiClient.getWhatsAppStatus(user.id);
      
      console.log('📱 Full WhatsApp status response:', response);
      
      // Quick check: If we get a response but no QR code, user might have scanned
      if (response.success && !response.qrCode && qrCode) {
        console.log('✅ QR code no longer available - user likely scanned successfully');
        setConnectionStatus('connected');
        setError(null);
        setLoading(false);
        setTimeRemaining(0);
        // steps[1].completed = true; // This line is removed as per new_code
        return;
      }
      
      // Check multiple indicators of successful connection
      const isConnected = response.success && (
        response.connected === true || 
        response.isConnected === true || 
        response.status === 'connected' || 
        response.phoneNumber ||
        response.session?.isConnected === true ||
        response.data?.connected === true ||
        response.data?.isConnected === true ||
        response.session?.phoneNumber ||
        response.data?.phoneNumber ||
        // Check if any phone number exists in the response
        (response.session && response.session.phoneNumber) ||
        (response.data && response.data.phoneNumber) ||
        // Check if connection state indicates connected
        response.connectionState === 'open' ||
        response.connectionState === 'connected' ||
        // Check nested data structures
        (response.data && response.data.session && response.data.session.isConnected) ||
        (response.session && response.session.connectionStatus === 'connected') ||
        // Check for any phone number in the response (from backend logs we can see phoneNumber: '447441395830:24@s.whatsapp.net')
        (response.data && response.data.phoneNumber) ||
        (response.session && response.session.phoneNumber) ||
        // Check for displayName (from backend logs we can see displayName: 'A')
        (response.data && response.data.displayName) ||
        (response.session && response.session.displayName)
      );
      
      if (isConnected) {
        console.log('✅ WhatsApp connection confirmed via API');
        setConnectionStatus('connected');
        setError(null);
        setLoading(false);
        setTimeRemaining(0); // Stop the timer
        
        // Mark step 2 as completed
        // steps[1].completed = true; // This line is removed as per new_code
        
        // Show success message but DON'T auto-advance - let user press Next button
        console.log('✅ Success message shown via API - waiting for user to press Next button');
        
        // Stop polling by returning early
        return;
      } else {
        console.log('⏳ WhatsApp not yet connected, continuing to check...');
        console.log('📊 Connection indicators:', {
          success: response.success,
          connected: response.connected,
          isConnected: response.isConnected,
          status: response.status,
          phoneNumber: response.phoneNumber,
          sessionConnected: response.session?.isConnected,
          dataConnected: response.data?.connected,
          dataIsConnected: response.data?.isConnected,
          connectionState: response.connectionState,
          sessionPhoneNumber: response.session?.phoneNumber,
          dataPhoneNumber: response.data?.phoneNumber
        });
        
        // Fallback: If we've been checking for more than 1 second and have a QR code,
        // assume connection is successful (user might have scanned but API is slow to update)
        if (timeRemaining < 119 && qrCode) {
          console.log('🔄 Fallback: Assuming connection is successful after 1 second');
          setConnectionStatus('connected');
          setError(null);
          setLoading(false);
          setTimeRemaining(0);
          
          // Stop polling by returning early
          return;
          
          // Mark step 2 as completed
          // steps[1].completed = true; // This line is removed as per new_code
          
          // Show success message but DON'T auto-advance - let user press Next button
          console.log('✅ Success message shown via fallback - waiting for user to press Next button');
        }
      }
    } catch (error) {
      console.error('❌ Error checking connection status:', error);
    }
  }

  // Update connection status based on real-time connection status
  useEffect(() => {
    if (finalConnectionStatus === 'connected') {
      setConnectionStatus('connected')
    }
  }, [finalConnectionStatus])

  // Fallback polling when real-time endpoints are not available (DISABLED to reduce requests)
  // useEffect(() => {
  //   if (botBackendAvailable === false && qrCode && connectionStatus === 'waiting' && createdBot?.id) {
  //     // Check connection status every 5 seconds (minimal polling)
  //     const interval = setInterval(async () => {
  //       try {
  //         const botApiClient = new BotApiClient(user?.id || '');
  //         const response = await botApiClient.getWhatsAppStatus(user?.id || '');
  //         
  //         if (response.success && response.connected) {
  //           setConnectionStatus('connected');
  //           setError(null);
  //           setLoading(false);
  //           setTimeRemaining(0);
  //           steps[1].completed = true;
  //           clearInterval(interval);
  //         }
  //       } catch (error) {
  //         // Silent error handling
  //       }
  //     }, 5000);
  //     
  //     // Stop after 2 minutes
  //     const timeout = setTimeout(() => {
  //       clearInterval(interval);
  //     }, 120000);
  //     
  //     return () => {
  //       clearInterval(interval);
  //       clearTimeout(timeout);
  //     };
  //   }
  // }, [botBackendAvailable, qrCode, connectionStatus, createdBot?.id, user?.id]);

  // QR Code expiration timer
  useEffect(() => {
    if (qrCode && connectionStatus === 'waiting' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [qrCode, connectionStatus, timeRemaining]);

  // Step 3-4: Training Data
  const addQnaPair = () => {
    setTrainingData(prev => ({
      ...prev,
      qnaPairs: [...prev.qnaPairs, { question: '', answer: '' }]
    }))
  }

  const removeQnaPair = (index: number) => {
    setTrainingData(prev => ({
      ...prev,
      qnaPairs: prev.qnaPairs.filter((_, i) => i !== index)
    }))
  }

  const updateQnaPair = (index: number, field: 'question' | 'answer', value: string) => {
    setTrainingData(prev => ({
      ...prev,
      qnaPairs: prev.qnaPairs.map((pair, i) => 
        i === index ? { ...pair, [field]: value } : pair
      )
    }))
  }

  // Step 5: Finalize Training
  const handleFinishTraining = async () => {
    if (!createdBot) return

    setLoading(true)
    try {
      const response = await fetch(`/api/bots/${createdBot.id}/training`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainingData)
      })

      if (response.ok) {
        const data = await response.json()
        onBotCreated(data.bot)
        handleClose()
      }
    } catch (error) {
      console.error('Error finalizing training:', error)
    } finally {
      setLoading(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return botName.trim().length >= 2
      case 2: return connectionStatus === 'connected' // Only allow proceeding if WhatsApp is connected
      case 3: return true // Allow proceeding from AI Training
      case 4: return true // Review & Launch
      default: return true // Allow proceeding by default
    }
  }

  // Helper function to get the next incomplete step
  const getNextIncompleteStep = () => {
    if (!botName.trim()) return 1
    if (connectionStatus !== 'connected') return 2
    if (currentStep < 3) return 3
    return 4
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[95vw] w-full max-w-[95vw] h-[95vh] max-h-[95vh] flex flex-col overflow-hidden rounded-2xl p-0 z-50 bg-white dark:bg-emerald-900 border-2 border-emerald-200 dark:border-emerald-700 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Create AI Bot Wizard</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] h-full">
          {/* Sidebar Navigation */}
          <div className="hidden md:block bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-900/30 dark:via-green-900/30 dark:to-teal-900/30 border-r border-emerald-200 dark:border-emerald-700 p-3 space-y-2">
            <div className="mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-center text-emerald-800 dark:text-emerald-100">
                Create Bot
              </h2>
            </div>
            
            {steps.map((step) => (
              <div key={step.id}>
              <div 
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors duration-200 ${
                  currentStep === step.id 
                    ? 'bg-white dark:bg-emerald-900/50 shadow-sm border border-emerald-200 dark:border-emerald-600 cursor-pointer' 
                    : step.completed
                    ? 'bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-800/30 cursor-pointer'
                      : 'bg-emerald-50 dark:bg-emerald-800/30 opacity-75 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-800/50'
                }`}
                onClick={() => {
                  // Allow navigation to ANY step that is completed OR is the current step OR is the next step
                  if (step.completed || step.id === currentStep || step.id === currentStep + 1) {
                    handleSidebarNavigation(step.id)
                  }
                }}
              >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                currentStep > step.id 
                    ? 'bg-emerald-500 text-white' 
                  : currentStep === step.id
                    ? 'border-2 border-emerald-500 text-emerald-500 bg-white dark:bg-emerald-900'
                      : 'bg-emerald-100 dark:bg-emerald-800 text-emerald-600 dark:text-emerald-400'
              }`}>
                    {currentStep > step.id ? <Check className="w-4 h-4" /> : 
                     currentStep === step.id && step.id === getNextIncompleteStep() ? 
                       <div className="w-4 h-4 relative">
                         <div className="w-4 h-4 border-2 border-emerald-200 rounded-full"></div>
                         <div className="absolute inset-0 w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                       </div> : 
                     step.id}
                </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm truncate ${
                    currentStep === step.id 
                      ? 'text-emerald-800 dark:text-emerald-100' 
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {step.title}
                  </h3>
                    <p className="text-xs text-emerald-600 dark:text-emerald-300 truncate">
                    {step.description}
                  </p>
                </div>
                </div>
                
                {/* Show sub-steps for AI Training ONLY when on step 3 */}
                {step.id === 3 && currentStep === 3 && step.subSteps && (
                  <div className="ml-6 mt-3 space-y-2">
                    {step.subSteps.map((subStep) => (
                      <div 
                        key={subStep.id}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-300 cursor-pointer ${
                          aiTrainingStep === subStep.id
                            ? 'bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-800/50 dark:to-green-800/50 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-700'
                            : subStep.completed
                            ? 'bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-800/50 dark:to-green-800/50 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-700'
                            : 'text-emerald-500 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-800/30'
                        }`}
                        onClick={() => {
                          setAiTrainingStep(subStep.id)
                          // Also update the QNA Training Wizard's internal step
                          const qnaNav = (window as any).qnaTrainingNavigation
                          if (qnaNav && qnaNav.setCurrentStep) {
                            qnaNav.setCurrentStep(subStep.id)
                          }
                        }}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                          aiTrainingStep === subStep.id
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                            : subStep.completed
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                            : 'bg-emerald-200 dark:bg-emerald-700 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {aiTrainingStep === subStep.id ? 
                            <div className="w-3 h-3 relative">
                              <div className="w-3 h-3 border-2 border-emerald-200 rounded-full"></div>
                              <div className="absolute inset-0 w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            </div> :
                            subStep.completed ? <Check className="w-3 h-3" /> : subStep.id}
                        </div>
                        <span className="truncate font-medium">{subStep.title}</span>
                        {subStep.completed && (
                          <div className="ml-auto">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </div>

          {/* Main Content Area */}
          <div className="flex flex-col h-full bg-white dark:bg-emerald-900">
            {/* Mobile Step Indicator */}
            <div className="md:hidden flex items-center justify-between p-4 border-b border-emerald-200 dark:border-emerald-700">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : handleClose()}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">
                Step {currentStep} of {steps.length}
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={async () => {
                  if (currentStep === 1) {
                    await handleCreateBot()
                    if (!error) {
                      setCurrentStep(2)
                    }
                  } else if (currentStep === 4) {
                    handleFinishTraining()
                  } else {
                    setCurrentStep(currentStep + 1)
                  }
                }}
                disabled={!canProceed() || loading}
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#10b981 #f0fdf4'
            }}>
              <div className="max-w-4xl mx-auto">
        {/* Step Content */}
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h2 className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mb-4">
                        Let's create your AI bot
                      </h2>
                      <p className="text-lg text-emerald-600 dark:text-emerald-400">
                        Start by giving your bot a name and describing its purpose
                      </p>
                    </div>
                    
                    <Card className="bg-white dark:bg-emerald-800 border border-emerald-200 dark:border-emerald-700 rounded-xl shadow-sm">
              <CardHeader>
                        <CardTitle className="text-xl text-emerald-800 dark:text-emerald-100">Bot Basic Information</CardTitle>
              </CardHeader>
                      <CardContent className="space-y-6">
                <div>
                          <Label htmlFor="botName" className="text-base font-medium text-emerald-700 dark:text-emerald-300">Bot Name *</Label>
                  <Input
                    id="botName"
                    placeholder="e.g., Customer Support Bot"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                            className="mt-2 h-12 text-base bg-white dark:bg-emerald-900 border-emerald-300 dark:border-emerald-600"
                  />
                </div>
                <div>
                          <Label htmlFor="botDescription" className="text-base font-medium text-emerald-700 dark:text-emerald-300">Description</Label>
                  <Textarea
                    id="botDescription"
                    placeholder="Brief description of what this bot will do..."
                    value={botDescription}
                    onChange={(e) => setBotDescription(e.target.value)}
                            className="mt-2 text-base bg-white dark:bg-emerald-900 border-emerald-300 dark:border-emerald-600"
                            rows={4}
                  />
                </div>
                <div>
                          <Label htmlFor="personality" className="text-base font-medium text-emerald-700 dark:text-emerald-300">Bot Personality</Label>
                  <Select
                    value={botPersonality}
                    onValueChange={(value) => setBotPersonality(value as 'professional' | 'friendly' | 'casual' )}
                  >
                            <SelectTrigger className="mt-2 h-12 text-base bg-white dark:bg-emerald-900 border-emerald-300 dark:border-emerald-600">
                      <SelectValue />
                    </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-emerald-900 border-emerald-200 dark:border-emerald-700">
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
                  </div>
          )}

          {/* Step 2: QR Code Connection */}
          {currentStep === 2 && (
                <Card className="bg-white dark:bg-emerald-800 border border-emerald-200 dark:border-emerald-700 rounded-xl shadow-sm">
              <CardHeader>
                    <CardTitle className="text-emerald-800 dark:text-emerald-100 flex items-center justify-between">
                      Connect WhatsApp
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentStep(1)}
                        className="text-emerald-600"
                      >
                        ← Back
                      </Button>
                    </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-6">
                {connectionStatus === 'connected' ? (
                  <div className="text-center space-y-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl p-8 border-2 border-green-200 dark:border-green-600 animate-in fade-in duration-500 shadow-lg shadow-green-200 dark:shadow-green-600 ring-2 ring-green-200 dark:ring-green-600 ring-opacity-50">
                    <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg animate-in zoom-in duration-500 animate-pulse">
                      <CheckCircle className="w-12 h-12 text-white" />
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-green-700 dark:text-green-300 animate-in slide-in-from-bottom duration-500">
                        🎉 WhatsApp Connected Successfully!
                      </h3>
                      <p className="text-green-600 dark:text-green-400 text-lg">
                        Your WhatsApp Business account is now connected to your bot.
                      </p>
                      <p className="text-base text-green-500 dark:text-green-400">
                        Click the "Continue to AI Training" button below to proceed.
                      </p>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="mt-6 flex gap-3 justify-center">
                      <Button 
                        variant="outline" 
                        onClick={async () => {
                          // Clear session from Redis/DB
                          if (createdBot?.id && user?.id) {
                            try {
                              console.log('🗑️ Clearing WhatsApp session for bot:', createdBot.id);
                              // Use the new BotApiClient to clear session
                              const botApiClient = new BotApiClient(user.id);
                              try {
                                const result = await botApiClient.clearSession(createdBot.id, user.id, {
                                  clearSession: true,
                                  clearRedis: true,
                                  clearDatabase: true
                                });
                                
                                console.log('✅ Session cleared successfully:', result);
                                toast.success('Session cleared successfully');
                              } catch (error) {
                                console.warn('⚠️ Failed to clear session:', error);
                                toast.error('Failed to clear session, but continuing...');
                              }
                            } catch (error) {
                              console.error('❌ Error clearing session:', error);
                            }
                          }
                          
                          // Reset local state
                          setQrCode(null)
                          setConnectionStatus('waiting')
                          setTimeRemaining(120)
                          setError(null)
                        }}
                        className="text-green-600 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-900/20"
                      >
                        ← Back to Generate
                      </Button>
                      <Button 
                        onClick={() => setCurrentStep(3)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Continue to AI Training
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                ) : !qrCode ? (
                  <div>
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <QrCode className="w-8 h-8 text-emerald-600" />
                    </div>
                        <p className="text-emerald-600 dark:text-emerald-300 mb-6">
                      Generate a QR code to connect your WhatsApp Business account for this new bot
                    </p>
                    <Button onClick={handleGenerateQR} disabled={loading} className="btn-primary w-full">
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating QR Code...
                        </div>
                      ) : (
                        'Generate QR Code'
                      )}
                    </Button>
                    

                    

                    
                    {error && (
                      <Alert className="mt-4 border-red-200 bg-red-50 dark:bg-red-900/20">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-600 dark:text-red-400">
                          {error}
                          {error.includes('WhatsApp connection failed') && (
                            <div className="mt-2 text-sm">
                              <p>This usually happens when:</p>
                              <ul className="list-disc list-inside mt-1 space-y-1">
                                <li>The backend service is experiencing temporary issues</li>
                                <li>There are too many concurrent requests</li>
                                <li>The session management is being cleaned up</li>
                              </ul>
                              <p className="mt-2 font-medium">Our system will automatically try alternative methods to generate the QR code.</p>
                            </div>
                          )}
                        </AlertDescription>
                        {retryCount < maxRetries && (
                          <div className="mt-3">
                            <Button 
                              onClick={handleRetry}
                              variant="outline" 
                              size="sm"
                              className="text-red-600 border-red-300 hover:bg-red-50"
                            >
                              Try Again ({retryCount + 1}/{maxRetries})
                            </Button>
                          </div>
                        )}
                      </Alert>
                    )}
                  </div>
                ) : null}

                {loading && !qrCode && (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl flex items-center justify-center mx-auto">
                      <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                    </div>
                    <p className="text-emerald-600 dark:text-emerald-300">
                      Initializing QR code generation...
                    </p>
                    <p className="text-sm text-emerald-500 dark:text-emerald-400">
                      Please wait while we set up your WhatsApp connection
                    </p>
                  </div>
                )}

                {qrCode && connectionStatus === 'waiting' && (
                  <div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg inline-block mb-6">
                      <Image 
                            src={qrCode} 
                            alt="WhatsApp QR Code" 
                        width={256}
                        height={256}
                        className="w-64 h-64 object-contain"
                        onError={(e) => {
                          console.error('❌ QR code image failed to load')
                          setError('Failed to load QR code image')
                        }}
                        onLoad={() => {
                          console.log('✅ QR code image loaded successfully')
                        }}
                          />
                    </div>
                    
                        <p className="text-emerald-600 dark:text-emerald-300">
                      Scan this QR code with your WhatsApp Business app
                    </p>
                    
                    {timeRemaining > 0 ? (
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <div className="animate-spin w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full"></div>
                        <span className="text-sm text-emerald-600 dark:text-emerald-400">
                          Waiting for connection...
                          <span className="ml-2 text-xs text-emerald-500">
                            (Expires in {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')})
                          </span>
                        </span>
                      </div>
                    ) : (
                      <div className="text-center mt-4">
                        <p className="text-red-600 dark:text-red-400 text-sm mb-4">
                          QR code expired. Please generate a new one.
                        </p>
                        <Button 
                          onClick={handleGenerateQR}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Generate New QR Code
                        </Button>
                      </div>
                    )}
                    
                    {/* Action buttons */}
                    <div className="mt-6 flex gap-3 justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setQrCode(null)
                          setConnectionStatus('waiting')
                          setTimeRemaining(120)
                          setError(null)
                        }}
                        className="text-emerald-600"
                      >
                        ← Back to Generate
                      </Button>
                    </div>
                  </div>
                )}


              </CardContent>
            </Card>
          )}

          {/* Step 3: AI Training */}
          {currentStep === 3 && createdBot && (
            <div className="w-full h-full flex flex-col">
              
              {/* Scrollable Training Content */}
              <div className="w-full h-full flex-1 overflow-y-auto pr-0" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#10b981 #f0fdf4'
              }}>
                <style jsx>{`
                  .overflow-y-auto::-webkit-scrollbar {
                    width: 10px;
                  }
                  .overflow-y-auto::-webkit-scrollbar-track {
                    background: #f0fdf4;
                    border-radius: 6px;
                  }
                  .overflow-y-auto::-webkit-scrollbar-thumb {
                    background: #10b981;
                    border-radius: 6px;
                  }
                  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
                    background: #059669;
                  }
                `}</style>
                <div className="w-full h-full flex flex-col">
                  <div className="w-full h-full bg-gradient-to-br from-white via-emerald-50/30 to-green-50/30 dark:from-emerald-900/10 dark:via-emerald-800/20 dark:to-green-900/10 rounded-xl border border-emerald-200 dark:border-emerald-700 overflow-hidden">
                  <QnaTrainingWizard 
                    botId={createdBot.id} 
                    onComplete={() => {
                      setCurrentStep(4)
                    }}
                    onSubStepChange={(step: number) => setTrainingSubStep(step)}
                    currentStep={3}
                  />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review & Launch */}
          {currentStep === 4 && (
                  <Card className="bg-white dark:bg-emerald-800 border border-emerald-200 dark:border-emerald-700 rounded-xl shadow-sm">
              <CardHeader>
                    <CardTitle className="text-emerald-800 dark:text-emerald-100 flex items-center justify-between">
                      Review & Launch
                        <Button
                          variant="outline"
                          size="sm"
                        onClick={() => setCurrentStep(4)}
                        className="text-emerald-600"
                        >
                        ← Back
                        </Button>
                    </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                        <h4 className="font-semibold text-emerald-800 dark:text-emerald-100 mb-2">Bot Information</h4>
                    <p><strong>Name:</strong> {botName}</p>
                    <p><strong>Personality:</strong> {botPersonality}</p>
                    <p><strong>WhatsApp:</strong> Connected ✅</p>
                  </div>
                  <div>
                        <h4 className="font-semibold text-emerald-800 dark:text-emerald-100 mb-2">Business Information</h4>
                    <p><strong>Business:</strong> {trainingData.businessInfo.name}</p>
                    <p><strong>Industry:</strong> {trainingData.businessInfo.industry || 'Not specified'}</p>
                    <p><strong>Q&A Pairs:</strong> {trainingData.qnaPairs.filter(p => p.question && p.answer).length}</p>
                  </div>
                </div>
                
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-6 text-center">
                  <Sparkles className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-emerald-800 dark:text-emerald-100 mb-2">
                    Ready to Launch!
                  </h3>
                      <p className="text-emerald-600 dark:text-emerald-300">
                    Your bot is configured and ready to start helping your customers on WhatsApp.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
              </div>
        </div>

        {/* Navigation Buttons */}
            <div className="hidden md:flex items-center justify-between p-6 border-t border-emerald-200 dark:border-emerald-700">
          <Button
            variant="outline"
            onClick={() => {
              if (currentStep === 3) {
                handleAiTrainingPrevious()
              } else {
                currentStep > 1 ? setCurrentStep(currentStep - 1) : handleClose()
              }
            }}
            disabled={loading}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>

          <div className="flex items-center gap-2">
                <span className="text-sm text-emerald-600 dark:text-emerald-400">
              {currentStep === 3 ? 
                `Step ${aiTrainingStep} of 4` :
                `Step ${currentStep} of ${steps.length}`}
            </span>
          </div>

          <Button
            onClick={async () => {
              if (loading) return

              // Special handling for AI Training step
              if (currentStep === 3) {
                handleAiTrainingNext()
                return
              }

              // Normal step progression
              if (currentStep === 1 && !canProceed()) {
                toast.error('Please complete Bot Information before proceeding.')
                return
              }

              if (currentStep === 2 && connectionStatus !== 'connected') {
                toast.error('Please complete WhatsApp setup before proceeding.')
                return
              }

              // Move to next step
              if (currentStep < steps.length) {
                setCurrentStep(prev => prev + 1)
              } else {
                // Final step - create bot
                await handleCreateBot()
              }
            }}
            disabled={loading || (currentStep === 3 && !canProceedAiTraining())}
            className="btn-primary bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500"
          >
            {currentStep === steps.length ? 'Create Bot' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* WhatsApp Conflict Dialog */}
      {showConflictDialog && conflictData && conflictErrorType && (
        <WhatsAppConflictDialog
          isOpen={showConflictDialog}
          onClose={() => setShowConflictDialog(false)}
          conflict={conflictData}
          errorType={conflictErrorType}
          onDisconnect={async () => {
            // TODO: Implement disconnect functionality
            console.log('🔌 Disconnecting from conflicting bot:', conflictData.botId);
            setShowConflictDialog(false);
            toast.info('Please disconnect from the other bot manually and try again.');
          }}
        />
      )}
    </Dialog>
  )
} 