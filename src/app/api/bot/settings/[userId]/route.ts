import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

// Define bot settings interface (match the one in the frontend)
interface BotSettings {
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
}

// GET: Fetch bot settings
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await auth()
  const resolvedParams = await params

  // Validate user authentication
  if (!userId) {
    return NextResponse.json({ 
      error: 'Unauthorized' 
    }, { status: 401 })
  }

  // Validate requested user matches authenticated user
  if (resolvedParams.userId !== userId) {
    return NextResponse.json({ 
      error: 'Access denied' 
    }, { status: 403 })
  }

  // Mock bot settings for now
  const settings: BotSettings = {
    personality: 'professional',
    autoRespond: false,
    businessHours: {
      enabled: false,
      timezone: 'UTC',
      schedule: {
        monday: { start: '09:00', end: '17:00', enabled: true },
        tuesday: { start: '09:00', end: '17:00', enabled: true },
        wednesday: { start: '09:00', end: '17:00', enabled: true },
        thursday: { start: '09:00', end: '17:00', enabled: true },
        friday: { start: '09:00', end: '17:00', enabled: true },
        saturday: { start: '09:00', end: '17:00', enabled: false },
        sunday: { start: '09:00', end: '17:00', enabled: false }
      }
    },
    fallbackMessage: 'I\'m sorry, I didn\'t understand that. Can you please rephrase your question?'
  }

  return NextResponse.json(settings, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  })
}

// PUT: Update bot settings
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await auth()
  const resolvedParams = await params

  // Validate user authentication
  if (!userId) {
    return NextResponse.json({ 
      error: 'Unauthorized' 
    }, { status: 401 })
  }

  // Validate requested user matches authenticated user
  if (resolvedParams.userId !== userId) {
    return NextResponse.json({ 
      error: 'Access denied' 
    }, { status: 403 })
  }

  try {
    const settings: BotSettings = await request.json()

    // Validate settings structure
    if (!settings.personality || typeof settings.autoRespond !== 'boolean') {
      return NextResponse.json({ 
        error: 'Invalid settings format' 
      }, { status: 400 })
    }

    // Here you would save the settings to your database
    // For now, we'll just return the settings as confirmation
    
    return NextResponse.json({
      message: 'Settings updated successfully',
      settings
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('Bot settings update error:', error)
    return NextResponse.json({ 
      error: 'Failed to update settings',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 