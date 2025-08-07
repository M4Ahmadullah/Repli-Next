import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { BotApiClient } from '@/lib/api/bot-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await auth()
    const { userId: paramUserId } = await params

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Create BotApiClient instance
    const botApiClient = new BotApiClient(userId)

    const response = await botApiClient.getAnalyticsSummary(paramUserId)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Get usage stats error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get usage stats'
    }, { status: 500 })
  }
} 