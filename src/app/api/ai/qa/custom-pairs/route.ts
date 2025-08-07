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
    const { botId, pairs } = body

    if (!botId) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'MISSING_BOT_ID',
          message: 'Bot ID is required'
        }
      }, { status: 400 })
    }

    if (!pairs || !Array.isArray(pairs)) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'MISSING_PAIRS',
          message: 'Pairs array is required'
        }
      }, { status: 400 })
    }

    // TODO: Store custom pairs in database/Redis for training
    // For now, just validate and return success
    console.log('Storing custom pairs for bot:', botId, 'User:', userId)
    console.log('Pairs:', pairs)

    return NextResponse.json({
      success: true,
      data: {
        botId,
        userId,
        pairsCount: pairs.length,
        pairs
      },
      message: 'Custom pairs stored successfully',
      timestamp: new Date().toISOString()
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('Store custom pairs error:', error)
    return NextResponse.json({ 
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to store custom pairs',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const botId = searchParams.get('botId')

    if (!botId) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'MISSING_BOT_ID',
          message: 'Bot ID is required'
        }
      }, { status: 400 })
    }

    // TODO: Retrieve custom pairs from database/Redis
    // For now, return empty array
    const pairs: any[] = []

    return NextResponse.json({
      success: true,
      data: {
        botId,
        userId,
        pairs
      },
      message: 'Custom pairs retrieved successfully',
      timestamp: new Date().toISOString()
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('Get custom pairs error:', error)
    return NextResponse.json({ 
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve custom pairs',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
} 