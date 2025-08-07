import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { BotApiClient } from '@/lib/api/bot-client'

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
    const response = await botApiClient.createBusinessProfile(userId, body)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Create business profile error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create business profile'
    }, { status: 500 })
  }
} 