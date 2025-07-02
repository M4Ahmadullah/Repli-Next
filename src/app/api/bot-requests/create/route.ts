import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { UserService } from '@/lib/services/user.service'

const createBotSchema = z.object({
  name: z.string().min(2, 'Bot name must be at least 2 characters'),
  description: z.string().optional(),
  personality: z.enum(['professional', 'friendly', 'casual']).default('professional'),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const botData = createBotSchema.parse(body)

    // 1. Validate user input (already done by schema)
    
    // 2. Check user's plan limits
    const userService = UserService.getInstance()
    const user = await userService.getUserById(userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has reached bot limit based on their plan
    const botLimits = {
      free: 1,
      starter: 3,
      growth: 10,
      enterprise: 50
    }
    
    const currentBotCount = user.bots?.length || 0
    const planLimit = botLimits[user.subscription.plan] || 1
    
    if (currentBotCount >= planLimit) {
      return NextResponse.json(
        { 
          error: 'Bot limit reached',
          message: `Your ${user.subscription.plan} plan allows up to ${planLimit} bots. Upgrade to create more bots.`,
          currentCount: currentBotCount,
          limit: planLimit
        },
        { status: 403 }
      )
    }

    // 3. Generate unique request ID for tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 4. Store user's bot creation request (for tracking purposes)
    // Note: Bot request tracking can be implemented later if needed

    // 5. Forward request to bot system
    const BOT_SYSTEM_URL = process.env.BOT_SYSTEM_URL || 'http://localhost:4000'
    
    const botSystemResponse = await fetch(`${BOT_SYSTEM_URL}/api/bots`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BOT_SYSTEM_API_KEY}`,
      },
      body: JSON.stringify({
        userId,
        requestId,
        name: botData.name,
        description: botData.description,
        personality: botData.personality,
        userPlan: user.subscription.plan,
        userLimits: {
          dailyMessages: user.subscription.dailyLimit,
          monthlyMessages: user.subscription.monthlyLimit
        }
      })
    })

    if (!botSystemResponse.ok) {
      const errorData = await botSystemResponse.json().catch(() => ({}))
      return NextResponse.json(
        { 
          error: 'Bot system error',
          message: errorData.message || 'Failed to create bot in bot system',
          requestId
        },
        { status: 500 }
      )
    }

    const botResult = await botSystemResponse.json()

    // 6. Update user data with new bot info
    const newBot = {
      id: botResult.botId,
      userId,
      name: botData.name,
      description: botData.description,
      whatsappPhoneNumber: undefined,
      whatsappConnected: false,
      qrCode: undefined,
      status: 'creating' as const,
      settings: {
        personality: botData.personality,
        autoRespond: true,
        businessHours: {
          enabled: false,
          timezone: 'UTC',
          schedule: {}
        },
        fallbackMessage: "I'm sorry, I don't have information about that. Please contact our support team for assistance.",
        language: 'en'
      },
      trainingData: {
        businessInfo: {
          name: botData.name,
          description: botData.description || '',
        },
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
    }

    // Add bot to user's bots array
    await userService.updateUser(userId, {
      bots: [...(user.bots || []), newBot]
    })

    return NextResponse.json({
      success: true,
      bot: newBot,
      requestId,
      message: 'Bot creation initiated successfully'
    })

  } catch (error) {
    console.error('Bot creation error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 