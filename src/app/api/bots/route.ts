import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { BotApiClient } from '@/lib/api/bot-client'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }



    // Create BotApiClient instance
    const botApiClient = new BotApiClient(userId)

    // Check if force refresh is requested
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('forceRefresh') === 'true'
    
    // Force clear cache if requested
    if (forceRefresh) {
      botApiClient.forceClearBotCache();
    }
    
    const response = await botApiClient.getUserBots(userId, forceRefresh)
    

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ [API] GET /api/bots - Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get bots'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Create BotApiClient instance
    const botApiClient = new BotApiClient(userId)

    const body = await request.json()
    const response = await botApiClient.createBot(userId, body)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Create bot error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create bot'
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const body = await request.json()
    const { botId, updates } = body

    if (!botId) {
      return NextResponse.json({
        success: false,
        error: 'Bot ID is required'
      }, { status: 400 })
    }

    // Create BotApiClient instance
    const botApiClient = new BotApiClient(userId)

    // Update bot status through the backend
    const response = await botApiClient.makeBotRequest(`/v1/bots/${botId}/status`, userId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })

    return NextResponse.json(response)
  } catch (error) {
    console.error('Update bot error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update bot'
    }, { status: 500 })
  }
} 