import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { UserService } from '@/lib/services/user.service'
import { z } from 'zod'

// Validation schema for user context sync
const userContextSchema = z.object({
  businessProfile: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    industry: z.string().optional(),
    website: z.string().url().optional()
  }).optional(),
  botSettings: z.object({
    personality: z.enum(['professional', 'friendly', 'casual']).optional(),
    customInstructions: z.string().optional(),
    autoRespond: z.boolean().optional(),
    businessHours: z.object({
      enabled: z.boolean(),
      timezone: z.string(),
      schedule: z.record(z.object({
        start: z.string(),
        end: z.string(),
        enabled: z.boolean()
      }))
    }).optional()
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

    // Parse and validate incoming data
    const body = await request.json()
    const syncData = userContextSchema.parse(body)

    // Get user service instance
    const userService = UserService.getInstance()
    const user = await userService.getUserById(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prepare data for bot system sync
    const botUserContext = {
      userId,
      phoneNumber: user.whatsappPhoneNumber,
      settings: {
        businessName: syncData.businessProfile?.name,
        businessDescription: syncData.businessProfile?.description,
        botPersonality: syncData.botSettings?.personality || 'professional',
        customInstructions: syncData.botSettings?.customInstructions,
        autoRespond: syncData.botSettings?.autoRespond ?? true,
        businessHours: syncData.botSettings?.businessHours || {
          enabled: false,
          timezone: 'UTC',
          schedule: {}
        }
      },
      subscription: {
        plan: user.subscription.plan,
        status: user.subscription.status,
        dailyLimit: user.subscription.dailyLimit
      }
    }

    // Forward context to bot system
    const BOT_SYSTEM_URL = process.env.BOT_SYSTEM_URL || 'http://localhost:8000'
    const botSyncResponse = await fetch(`${BOT_SYSTEM_URL}/api/users/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BOT_SYSTEM_API_KEY}`
      },
      body: JSON.stringify(botUserContext)
    })

    if (!botSyncResponse.ok) {
      const errorData = await botSyncResponse.json().catch(() => ({}))
      return NextResponse.json(
        { 
          error: 'Bot system sync failed',
          message: errorData.message || 'Failed to synchronize user context',
        },
        { status: 500 }
      )
    }

    // Update local user data
    await userService.updateUser(userId, {
      settings: {
        ...user.settings,
        ...syncData.botSettings,
        businessName: syncData.businessProfile?.name,
        businessDescription: syncData.businessProfile?.description
      }
    })

    return NextResponse.json({
      success: true,
      message: 'User context synchronized successfully'
    })

  } catch (error) {
    console.error('User context sync error:', error)
    
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