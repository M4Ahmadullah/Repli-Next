import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { BotApiClient } from '@/lib/api/bot-client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { userId } = await auth()
    const { profileId } = await params

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Create BotApiClient instance
    const botApiClient = new BotApiClient(userId)

    const response = await botApiClient.getBusinessProfile(userId, profileId)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Get business profile error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get business profile'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { userId } = await auth()
    const { profileId } = await params

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Create BotApiClient instance
    const botApiClient = new BotApiClient(userId)

    const body = await request.json()
    const response = await botApiClient.updateBusinessProfile(userId, profileId, body)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Update business profile error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update business profile'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { userId } = await auth()
    const { profileId } = await params

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Create BotApiClient instance
    const botApiClient = new BotApiClient(userId)

    const response = await botApiClient.deleteBusinessProfile(userId, profileId)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Delete business profile error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete business profile'
    }, { status: 500 })
  }
} 