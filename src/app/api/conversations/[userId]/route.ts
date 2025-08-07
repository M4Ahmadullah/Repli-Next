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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const response = await botApiClient.getWhatsAppMessages(paramUserId, limit, offset)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get conversations'
    }, { status: 500 })
  }
} 