import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { BotApiClient } from '@/lib/api/bot-client'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    // Validate user authentication
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Firebase token missing or invalid'
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }, { status: 401 })
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const requestedUserId = searchParams.get('userId')

    // Additional user validation
    if (requestedUserId && requestedUserId !== userId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_ACCESS',
          message: 'User cannot access this resource'
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }, { status: 403 })
    }

    // Create BotApiClient instance
    const botApiClient = new BotApiClient(userId)

    // Get system health from the bot API
    const healthResponse = await botApiClient.getSystemHealth()

    if (!healthResponse.success) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'SERVICE_ERROR',
          message: 'Failed to fetch system health',
          details: healthResponse.error?.message || 'Unknown error'
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: healthResponse.data,
      message: 'Bot status retrieved successfully',
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('Bot status fetch error:', error)
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch bot status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }, { status: 500 })
  }
} 