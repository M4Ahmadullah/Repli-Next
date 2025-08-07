import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { BotApiClient } from '@/lib/api/bot-client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    const { userId } = await auth()
    const { botId } = await params

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Create BotApiClient instance
    const botApiClient = new BotApiClient(userId)

    const body = await request.json()
    const { trainingData } = body

    const response = await botApiClient.updateBotTraining(userId, botId, trainingData)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Bot training error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to train bot'
    }, { status: 500 })
  }
} 