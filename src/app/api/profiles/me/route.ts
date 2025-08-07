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

    const response = await botApiClient.getUserProfile(userId)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get user profile'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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
    const response = await botApiClient.updateUserProfile(userId, body)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Update user profile error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update user profile'
    }, { status: 500 })
  }
} 