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
    const { botId, answers } = body

    if (!botId) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'MISSING_BOT_ID',
          message: 'Bot ID is required'
        }
      }, { status: 400 })
    }

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'MISSING_ANSWERS',
          message: 'Answers array is required'
        }
      }, { status: 400 })
    }

    // TODO: Store answers in database/Redis for training
    // For now, just validate and return success
    console.log('Storing answers for bot:', botId, 'User:', userId)
    console.log('Answers:', answers)

    return NextResponse.json({
      success: true,
      data: {
        botId,
        userId,
        answersCount: answers.length,
        answers
      },
      message: 'Answers stored successfully',
      timestamp: new Date().toISOString()
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('Store answers error:', error)
    return NextResponse.json({ 
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to store answers',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
} 