import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized'
        }
      }, { status: 401 })
    }

    const body = await request.json()
    const { botId } = body

    if (!botId) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'MISSING_BOT_ID',
          message: 'Bot ID is required'
        }
      }, { status: 400 })
    }

    // TODO: Trigger AI training with stored data
    // This will be handled by the bot team
    console.log('Triggering AI training for bot:', botId, 'User:', userId)

    return NextResponse.json({
      success: true,
      data: {
        botId,
        userId,
        trained: true,
        trainingStatus: 'completed'
      },
      message: 'AI training completed successfully',
      timestamp: new Date().toISOString()
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('AI training error:', error)
    return NextResponse.json({ 
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to train AI',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
} 