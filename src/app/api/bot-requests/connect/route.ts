import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { UserService } from '@/lib/services/user.service'

const connectRequestSchema = z.object({
  botId: z.string().min(1, 'Bot ID is required'),
  action: z.enum(['generate-qr', 'check-status', 'disconnect']),
  phoneNumber: z.string().optional() // For manual phone number entry
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const connectData = connectRequestSchema.parse(body)

    // 1. Verify user owns the bot
    const userService = UserService.getInstance()
    const user = await userService.getUserById(userId)
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userBot = user.bots?.find(bot => bot.id === connectData.botId)
    if (!userBot) {
      return NextResponse.json(
        { error: 'Bot not found or access denied' },
        { status: 404 }
      )
    }

    // 2. Generate unique request ID for tracking
    const requestId = `connect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 3. Forward request to bot system based on action
    const BOT_SYSTEM_URL = process.env.BOT_SYSTEM_URL || 'http://localhost:4000'
    let botSystemResponse: Response
    let endpoint: string
    let requestBody: Record<string, unknown>

    switch (connectData.action) {
      case 'generate-qr':
        endpoint = `${BOT_SYSTEM_URL}/api/whatsapp/qr/${connectData.botId}`
        requestBody = {
          userId,
          requestId,
          useExistingSession: false,
          isNewBotCreation: true
        }
        break

      case 'check-status':
        endpoint = `${BOT_SYSTEM_URL}/api/whatsapp/status/${connectData.botId}`
        requestBody = {
          userId,
          requestId
        }
        break

      case 'disconnect':
        endpoint = `${BOT_SYSTEM_URL}/api/whatsapp/disconnect/${connectData.botId}`
        requestBody = {
          userId,
          requestId,
          reason: 'user_requested'
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    // Make request to bot system
    if (connectData.action === 'check-status') {
      botSystemResponse = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.BOT_SYSTEM_API_KEY}`,
        }
      })
    } else {
      botSystemResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.BOT_SYSTEM_API_KEY}`,
        },
        body: JSON.stringify(requestBody)
      })
    }

    if (!botSystemResponse.ok) {
      const errorData = await botSystemResponse.json().catch(() => ({}))
      return NextResponse.json(
        { 
          error: 'Bot system error',
          message: errorData.message || `Failed to ${connectData.action} in bot system`,
          requestId
        },
        { status: botSystemResponse.status }
      )
    }

    const result = await botSystemResponse.json()

    // 4. Process response based on action
    let responseData: Record<string, unknown> = {
      success: true,
      requestId,
      action: connectData.action
    }

    switch (connectData.action) {
      case 'generate-qr':
        responseData = {
          ...responseData,
          qrCode: result.qrCode,
          qrCodeUrl: result.qrCodeUrl,
          expiresAt: result.expiresAt,
          message: 'QR code generated successfully. Scan with WhatsApp to connect.',
          instructions: [
            'Open WhatsApp on your phone',
            'Go to Settings > Linked Devices',
            'Tap "Link a Device"',
            'Scan the QR code below'
          ]
        }
        break

      case 'check-status':
        responseData = {
          ...responseData,
          connected: result.connected,
          phoneNumber: result.phoneNumber,
          connectionStatus: result.status,
          lastActivity: result.lastActivity,
          qrCode: result.qrCode, // May be null if connected
          message: result.connected 
            ? `WhatsApp connected successfully with number ${result.phoneNumber}`
            : 'WhatsApp not connected. Generate a QR code to connect.'
        }
        break

      case 'disconnect':
        responseData = {
          ...responseData,
          disconnected: result.disconnected,
          message: result.disconnected 
            ? 'WhatsApp disconnected successfully'
            : 'Failed to disconnect WhatsApp'
        }
        break
    }

    // 5. Update local bot data if needed
    if (connectData.action === 'check-status' && result.connected) {
      // Update user's bot data with connection info
      const updatedBots = user.bots?.map(bot => 
        bot.id === connectData.botId 
          ? {
              ...bot,
              whatsappConnected: true,
              whatsappPhoneNumber: result.phoneNumber,
              qrCode: undefined,
              status: 'active' as const,
              updatedAt: new Date()
            }
          : bot
      ) || []

      await userService.updateUser(userId, { bots: updatedBots })
    }

    if (connectData.action === 'disconnect' && result.disconnected) {
      // Update user's bot data to reflect disconnection
      const updatedBots = user.bots?.map(bot => 
        bot.id === connectData.botId 
          ? {
              ...bot,
              whatsappConnected: false,
              whatsappPhoneNumber: undefined,
              qrCode: undefined,
              status: 'inactive' as const,
              updatedAt: new Date()
            }
          : bot
      ) || []

      await userService.updateUser(userId, { bots: updatedBots })
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('WhatsApp connection error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 