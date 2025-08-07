import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

const BOT_API_BASE_URL = process.env.BOT_API_BASE_URL || 'http://localhost:5000'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }

    // Get Firebase token from headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ 
        success: false,
        error: 'Authorization header required',
        code: 'AUTH_REQUIRED'
      }, { status: 401 })
    }

    const body = await request.json()

    // Forward the request to bot team API
    const botResponse = await fetch(`${BOT_API_BASE_URL}/api/v1/bot-training/train/final`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(body)
    })

    if (!botResponse.ok) {
      const errorData = await botResponse.json()
      return NextResponse.json({
        success: false,
        error: errorData.error || 'Failed to complete training',
        code: errorData.code || 'PROCESSING_ERROR',
        details: errorData.details
      }, { status: botResponse.status })
    }

    const result = await botResponse.json()
    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Final training proxy error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to complete training',
      code: 'INTERNAL_SERVER_ERROR',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 