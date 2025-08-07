import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { BotApiClient } from '@/lib/api/bot-client'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { userId } = await auth()
    const { botId } = await params

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - User not authenticated'
      }, { status: 401 })
    }

    if (!botId) {
      return NextResponse.json({
        success: false,
        error: 'Bot ID is required'
      }, { status: 400 })
    }

    console.log('🗑️ [DEBUG] Starting bot deletion in API route for bot:', botId, 'user:', userId);
    
    // Create BotApiClient instance
    const botApiClient = new BotApiClient(userId)

    // Call bot backend to delete the bot
    const response = await botApiClient.deleteBot(userId, botId)
    
    console.log('📄 [DEBUG] Bot deletion response in API route:', response);
    
    // Return appropriate status code based on response
    if (response.success) {
      return NextResponse.json(response, { status: 200 })
    } else {
      // Handle specific error cases
      if (response.error?.includes('not found')) {
        return NextResponse.json(response, { status: 400 })
      } else if (response.error?.includes('Authentication')) {
        return NextResponse.json(response, { status: 401 })
      } else {
        return NextResponse.json(response, { status: 500 })
      }
    }
  } catch (error) {
    console.error('Delete bot error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete bot',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 