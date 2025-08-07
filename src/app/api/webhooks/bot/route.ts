import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { UserService } from '@/lib/services/user.service'

// Webhook event validation schema
const webhookEventSchema = z.object({
  type: z.enum([
    'user_created', 
    'user_updated', 
    'user_deleted', 
    'bot_created', 
    'bot_updated', 
    'bot_deleted',
    'conversation_started',
    'conversation_ended',
    'message_received',
    'message_sent'
  ]),
  userId: z.string(),
  data: z.record(z.any()).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const webhookSecret = request.headers.get('x-webhook-secret')
    if (webhookSecret !== process.env.BOT_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Invalid webhook secret' },
        { status: 403 }
      )
    }

    // Parse incoming webhook payload
    const body = await request.json()
    const event = webhookEventSchema.parse(body)

    // Get user service instance
    const userService = UserService.getInstance()

    // Handle different webhook event types
    switch (event.type) {
      case 'user_created':
        // Sync new user to Next.js platform if needed
        await userService.createUser({
          clerkId: event.userId,
          email: event.data?.email,
          name: event.data?.name
        })
        break

      case 'user_updated':
        // Update user profile
        await userService.updateUser(event.userId, {
          name: event.data?.name,
          image: event.data?.image,
          settings: event.data?.settings
        })
        break

      case 'user_deleted':
        // Handle user deletion
        await userService.deleteUser(event.userId)
        break

      case 'bot_created':
        // Update user's bot list
        await userService.updateUser(event.userId, {
          bots: event.data?.bots
        })
        break

      case 'conversation_started':
      case 'conversation_ended':
      case 'message_received':
      case 'message_sent':
        // Log conversation events or trigger notifications
        console.log(`Bot event: ${event.type}`, event.data)
        break

      default:
        console.warn('Unhandled webhook event', event)
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    
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

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Webhook endpoint is healthy',
    timestamp: new Date().toISOString()
  })
} 