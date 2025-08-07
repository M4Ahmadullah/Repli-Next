import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'

// Configuration schema for bot system
const configSchema = z.object({
  aiProviders: z.array(z.enum(['openai', 'anthropic', 'ollama'])).optional(),
  features: z.object({
    autoRespond: z.boolean().optional(),
    multiLanguageSupport: z.boolean().optional(),
    advancedAnalytics: z.boolean().optional()
  }).optional(),
  limits: z.object({
    dailyMessages: z.number().min(0).optional(),
    monthlyMessages: z.number().min(0).optional(),
    maxQnAPairs: z.number().min(0).optional()
  }).optional(),
  security: z.object({
    webhookValidation: z.boolean().optional(),
    ipWhitelist: z.array(z.string().ip()).optional()
  }).optional()
})

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Retrieve current platform configuration
    const platformConfig = {
      aiProviders: ['openai', 'anthropic'],
      features: {
        autoRespond: true,
        multiLanguageSupport: true,
        advancedAnalytics: true
      },
      limits: {
        dailyMessages: 100,
        monthlyMessages: 3000,
        maxQnAPairs: 50
      },
      security: {
        webhookValidation: true,
        ipWhitelist: []
      }
    }

    return NextResponse.json({
      success: true,
      config: platformConfig
    })

  } catch (error) {
    console.error('Configuration retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate incoming configuration
    const body = await request.json()
    const configUpdate = configSchema.parse(body)

    // Forward configuration to bot system
    const BOT_SYSTEM_URL = process.env.BOT_SYSTEM_URL || 'http://localhost:8000'
    const botConfigResponse = await fetch(`${BOT_SYSTEM_URL}/api/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BOT_SYSTEM_API_KEY}`
      },
      body: JSON.stringify({
        userId,
        ...configUpdate
      })
    })

    if (!botConfigResponse.ok) {
      const errorData = await botConfigResponse.json().catch(() => ({}))
      return NextResponse.json(
        { 
          error: 'Bot system config sync failed',
          message: errorData.message || 'Failed to synchronize configuration',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration synchronized successfully'
    })

  } catch (error) {
    console.error('Configuration sync error:', error)
    
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