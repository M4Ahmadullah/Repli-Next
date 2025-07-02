import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { UserService } from '@/lib/services/user.service'

const trainingDataSchema = z.object({
  botId: z.string().min(1, 'Bot ID is required'),
  businessInfo: z.object({
    name: z.string().min(1, 'Business name is required'),
    description: z.string().min(1, 'Business description is required'),
    industry: z.string().optional(),
    website: z.string().url().optional().or(z.literal(''))
  }),
  qnaPairs: z.array(z.object({
    question: z.string().min(1, 'Question is required'),
    answer: z.string().min(1, 'Answer is required'),
    category: z.string().optional()
  })).min(1, 'At least one Q&A pair is required'),
  personality: z.enum(['professional', 'friendly', 'casual', 'custom']).default('professional'),
  customPersonality: z.string().optional(),
  autoRespond: z.boolean().default(true),
  fallbackMessage: z.string().min(1, 'Fallback message is required'),
  businessHours: z.object({
    enabled: z.boolean().default(false),
    timezone: z.string().default('UTC'),
    schedule: z.record(z.object({
      start: z.string(),
      end: z.string(),
      enabled: z.boolean()
    })).optional()
  }).optional()
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
    const trainingData = trainingDataSchema.parse(body)

    // 1. Validate user input (already done by schema)
    
    // 2. Verify user owns the bot
    const userService = UserService.getInstance()
    const user = await userService.getUserById(userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userBot = user.bots?.find(bot => bot.id === trainingData.botId)
    if (!userBot) {
      return NextResponse.json(
        { error: 'Bot not found or access denied' },
        { status: 404 }
      )
    }

    // 3. Check plan limits for Q&A pairs
    const qnaPairLimits = {
      free: 5,
      starter: 25,
      growth: 100,
      enterprise: 500
    }
    
    const planLimit = qnaPairLimits[user.subscription.plan] || 5
    
    if (trainingData.qnaPairs.length > planLimit) {
      return NextResponse.json(
        { 
          error: 'Q&A pair limit exceeded',
          message: `Your ${user.subscription.plan} plan allows up to ${planLimit} Q&A pairs. You provided ${trainingData.qnaPairs.length}.`,
          currentCount: trainingData.qnaPairs.length,
          limit: planLimit
        },
        { status: 403 }
      )
    }

    // 4. Generate unique request ID for tracking
    const requestId = `train_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 5. Store training request (for tracking purposes)
    // Note: Training request tracking can be implemented later if needed

    // 6. Forward training data to bot system
    const BOT_SYSTEM_URL = process.env.BOT_SYSTEM_URL || 'http://localhost:4000'
    
    const botSystemResponse = await fetch(`${BOT_SYSTEM_URL}/api/bots/${trainingData.botId}/training`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BOT_SYSTEM_API_KEY}`,
      },
      body: JSON.stringify({
        userId,
        requestId,
        businessInfo: trainingData.businessInfo,
        qnaPairs: trainingData.qnaPairs.map(pair => ({
          id: `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          question: pair.question,
          answer: pair.answer,
          category: pair.category || 'general',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })),
        settings: {
          personality: trainingData.personality,
          customPersonality: trainingData.customPersonality,
          autoRespond: trainingData.autoRespond,
          fallbackMessage: trainingData.fallbackMessage,
          businessHours: trainingData.businessHours || {
            enabled: false,
            timezone: 'UTC',
            schedule: {}
          }
        },
        userPlan: user.subscription.plan
      })
    })

    if (!botSystemResponse.ok) {
      const errorData = await botSystemResponse.json().catch(() => ({}))
      return NextResponse.json(
        { 
          error: 'Bot system error',
          message: errorData.message || 'Failed to train bot in bot system',
          requestId
        },
        { status: 500 }
      )
    }

    const trainingResult = await botSystemResponse.json()

    // 7. Update user's bot status to training
    const updatedBots = user.bots?.map(bot => 
      bot.id === trainingData.botId 
        ? { ...bot, status: 'training' as const, updatedAt: new Date() }
        : bot
    ) || []

    // Update user data with bot status
    await userService.updateUser(userId, {
      bots: updatedBots
    })

    return NextResponse.json({
      success: true,
      requestId,
      message: 'Bot training initiated successfully',
      trainingStatus: trainingResult.status || 'processing',
      estimatedCompletion: trainingResult.estimatedCompletion || '2-3 minutes'
    })

  } catch (error) {
    console.error('Bot training error:', error)
    
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