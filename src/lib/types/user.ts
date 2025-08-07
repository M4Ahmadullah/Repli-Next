export interface User {
  id: string // Clerk user ID
  clerkId: string // Clerk user ID (same as id)
  email: string
  name?: string
  image?: string
  createdAt: Date
  updatedAt: Date
  subscription: UserSubscription
  bots: Bot[] // Array of bots owned by this user
  activeBotId?: string // Currently selected bot ID
  whatsappPhoneNumber?: string // Add WhatsApp phone number
  settings?: UserSettings // Add optional settings
}

export interface Bot {
  id: string // Unique bot ID
  userId: string // Owner's user ID
  name: string
  description?: string
  whatsappPhoneNumber?: string
  whatsappConnected: boolean
  qrCode?: string // For connection process
  status: 'creating' | 'training' | 'active' | 'inactive' | 'error' | 'connecting'
  settings: BotSettings
  trainingData: BotTrainingData
  analytics: BotAnalytics
  createdAt: Date
  updatedAt: Date
}

export interface BotSettings {
  personality: 'professional' | 'friendly' | 'casual' | 'custom'
  customPersonality?: string
  autoRespond: boolean
  businessHours: {
    enabled: boolean
    timezone: string
    schedule: {
      [key: string]: { start: string; end: string; enabled: boolean }
    }
  }
  fallbackMessage: string
  language: string
}

export interface BotTrainingData {
  businessInfo: {
    name: string
    description: string
    industry?: string
    website?: string
  }
  qnaPairs: QnaPair[]
  documents: TrainingDocument[]
  lastTrainingUpdate: Date
}

export interface TrainingDocument {
  id: string
  name: string
  type: 'pdf' | 'txt' | 'docx'
  size: number
  uploadedAt: Date
  processed: boolean
  content?: string // Extracted text content
}

export interface BotAnalytics {
  totalMessages: number
  todayMessages: number
  weeklyMessages: number
  monthlyMessages: number
  responseRate: number
  averageResponseTime: number
  topQuestions: Array<{ question: string; count: number }>
  satisfactionScore: number
  lastUpdated: Date
}

export interface UserSubscription {
  id: string
  plan: 'free' | 'starter' | 'growth' | 'enterprise'
  status: 'active' | 'inactive' | 'cancelled' | 'past_due'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  dailyLimit: number
  monthlyLimit: number
}

// Legacy interfaces - keeping for backward compatibility during migration
export interface UserSettings {
  // User Account Status
  status?: 'active' | 'banned' | 'inactive'

  // WhatsApp Bot Configuration
  whatsappConnected: boolean
  whatsappPhoneNumber?: string
  whatsappBusinessAccountId?: string
  whatsappPhoneNumberId?: string
  webhookConfigured: boolean
  
  // Business Profile
  businessName?: string
  businessDescription?: string
  businessIndustry?: string
  businessWebsite?: string
  
  // AI Configuration
  aiProvider: 'openai' | 'anthropic' | 'ollama'
  aiModel?: string
  botPersonality: 'professional' | 'friendly' | 'casual'
  customInstructions?: string
  autoRespond: boolean
  
  // Operational Settings
  businessHours: {
    enabled: boolean
    timezone: string
    schedule: {
      [key: string]: { start: string; end: string; enabled: boolean }
    }
  }
  
  // Training Data
  trainingDataEnabled: boolean
  customQnaPairs: QnaPair[]
}

export interface BotStatus {
  isActive: boolean
  lastActivity?: Date
  health: 'healthy' | 'unhealthy' | 'unknown'
  errorMessage?: string
  stats: {
    todayMessages: number
    totalMessages: number
    profileCompletions: number
    successRate: number
  }
}

export interface QnaPair {
  id: string
  question: string
  answer: string
  category?: string
  enabled: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateUserData {
  clerkId: string
  email: string
  name?: string
  image?: string
}

export interface UpdateUserData {
  name?: string
  image?: string
  settings?: Partial<UserSettings>
  bots?: Bot[]
  activeBotId?: string
}

// Bot Management Interfaces
export interface CreateBotData {
  name: string
  description?: string
  personality?: 'professional' | 'friendly' | 'casual'
}

export interface UpdateBotData {
  name?: string
  description?: string
  settings?: Partial<BotSettings>
  trainingData?: Partial<BotTrainingData>
}

export interface BotCreationStep {
  step: number
  title: string
  description: string
  component: string
  completed: boolean
}

export interface TrainingWizardData {
  businessInfo: {
    name: string
    description: string
    industry?: string
    website?: string
  }
  qnaPairs: Array<{ question: string; answer: string }>
  documents: File[]
  personality: 'professional' | 'friendly' | 'casual' | 'custom'
  customPersonality?: string
  autoRespond: boolean
  fallbackMessage: string
} 

export interface BotUserContext {
  userId: string
  phoneNumber?: string
  settings: {
    businessName?: string
    businessDescription?: string
    botPersonality: 'professional' | 'friendly' | 'casual'
    customInstructions?: string
    autoRespond: boolean
    businessHours: UserSettings['businessHours']
  }
  subscription: {
    plan: UserSubscription['plan']
    status: UserSubscription['status']
    dailyLimit: number
  }
}

// Plan limits configuration
export const PLAN_LIMITS = {
  free: {
    dailyMessages: 10,
    monthlyMessages: 300,
    qnaPairs: 5,
    aiProvider: ['openai'] as const,
  },
  starter: {
    dailyMessages: 100,
    monthlyMessages: 3000,
    qnaPairs: 25,
    aiProvider: ['openai', 'anthropic'] as const,
  },
  growth: {
    dailyMessages: 500,
    monthlyMessages: 15000,
    qnaPairs: 100,
    aiProvider: ['openai', 'anthropic', 'ollama'] as const,
  },
  enterprise: {
    dailyMessages: 2000,
    monthlyMessages: 60000,
    qnaPairs: 500,
    aiProvider: ['openai', 'anthropic', 'ollama'] as const,
  },
} as const 