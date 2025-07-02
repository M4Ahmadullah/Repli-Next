import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { UserService } from '@/lib/services/user.service'
import { z } from 'zod'

// Enhanced logging utility
const logWebhookEvent = (level: 'info' | 'warn' | 'error', message: string, context?: Record<string, any>) => {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    service: 'ClerkWebhook',
    message,
    ...context
  }
  
  switch (level) {
    case 'info':
      console.log(JSON.stringify(logEntry))
      break
    case 'warn':
      console.warn(JSON.stringify(logEntry))
      break
    case 'error':
      console.error(JSON.stringify(logEntry))
      break
  }
}

// Zod schema for validating webhook payload
const ClerkWebhookSchema = z.object({
  data: z.object({
    id: z.string(),
    email_addresses: z.array(z.object({
      email_address: z.string().email()
    })).nonempty(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    profile_image_url: z.string().url().optional(),
    created_at: z.number(),
    updated_at: z.number()
  }),
  type: z.enum([
    'user.created', 
    'user.updated', 
    'user.deleted', 
    'user.banned', 
    'user.unbanned'
  ])
})

export async function POST(req: NextRequest) {
  // Verify webhook secret is configured
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!CLERK_WEBHOOK_SECRET) {
    logWebhookEvent('error', 'Webhook secret not configured', { 
      action: 'Abort webhook processing' 
    })
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  try {
    // Get headers for webhook verification
    const svix_id = req.headers.get('svix-id')
    const svix_timestamp = req.headers.get('svix-timestamp')
    const svix_signature = req.headers.get('svix-signature')

    // Validate headers
    if (!svix_id || !svix_timestamp || !svix_signature) {
      logWebhookEvent('warn', 'Missing Svix headers', { 
        svix_id, 
        svix_timestamp, 
        svix_signature 
      })
      return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 })
    }

    // Read request body
    const payload = await req.json()

    // Create a new Svix Webhook instance
    const wh = new Webhook(CLERK_WEBHOOK_SECRET)

    // Verify the webhook
    let verifiedPayload
    try {
      verifiedPayload = wh.verify(
        JSON.stringify(payload), 
        {
          'svix-id': svix_id,
          'svix-timestamp': svix_timestamp,
          'svix-signature': svix_signature
        }
      )
    } catch (err) {
      logWebhookEvent('error', 'Webhook verification failed', { 
        error: err instanceof Error ? err.message : 'Unknown error' 
      })
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 403 })
    }

    // Validate payload structure
    let validatedPayload
    try {
      validatedPayload = ClerkWebhookSchema.parse(verifiedPayload)
    } catch (validationError) {
      logWebhookEvent('error', 'Webhook payload validation failed', { 
        error: validationError instanceof Error ? validationError.message : 'Invalid payload structure',
        payload: verifiedPayload
      })
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 })
    }

    // Get UserService instance
    const userService = UserService.getInstance()

    // Process different event types with enhanced logging
    switch (validatedPayload.type) {
      case 'user.created':
        try {
          await userService.createUser({
            clerkId: validatedPayload.data.id,
            email: validatedPayload.data.email_addresses[0].email_address,
            name: `${validatedPayload.data.first_name || ''} ${validatedPayload.data.last_name || ''}`.trim(),
            image: validatedPayload.data.profile_image_url,
          })
          logWebhookEvent('info', 'User created successfully', { 
            userId: validatedPayload.data.id,
            email: validatedPayload.data.email_addresses[0].email_address
          })
        } catch (createError) {
          logWebhookEvent('error', 'Failed to create user', { 
            userId: validatedPayload.data.id,
            error: createError instanceof Error ? createError.message : 'Unknown error'
          })
        }
        break

      case 'user.updated':
        try {
          await userService.updateUser(validatedPayload.data.id, {
            name: `${validatedPayload.data.first_name || ''} ${validatedPayload.data.last_name || ''}`.trim(),
            image: validatedPayload.data.profile_image_url,
          })
          logWebhookEvent('info', 'User updated successfully', { 
            userId: validatedPayload.data.id 
          })
        } catch (updateError) {
          logWebhookEvent('error', 'Failed to update user', { 
            userId: validatedPayload.data.id,
            error: updateError instanceof Error ? updateError.message : 'Unknown error'
          })
        }
        break

      case 'user.deleted':
        try {
          await userService.deleteUser(validatedPayload.data.id)
          logWebhookEvent('info', 'User deleted successfully', { 
            userId: validatedPayload.data.id 
          })
        } catch (deleteError) {
          logWebhookEvent('error', 'Failed to delete user', { 
            userId: validatedPayload.data.id,
            error: deleteError instanceof Error ? deleteError.message : 'Unknown error'
          })
        }
        break

      case 'user.banned':
        try {
          await userService.updateUser(validatedPayload.data.id, {
            settings: { 
              status: 'banned' 
            }
          })
          logWebhookEvent('info', 'User banned', { 
            userId: validatedPayload.data.id 
          })
        } catch (banError) {
          logWebhookEvent('error', 'Failed to ban user', { 
            userId: validatedPayload.data.id,
            error: banError instanceof Error ? banError.message : 'Unknown error'
          })
        }
        break

      case 'user.unbanned':
        try {
          await userService.updateUser(validatedPayload.data.id, {
            settings: { 
              status: 'active' 
            }
          })
          logWebhookEvent('info', 'User unbanned', { 
            userId: validatedPayload.data.id 
          })
        } catch (unbanError) {
          logWebhookEvent('error', 'Failed to unban user', { 
            userId: validatedPayload.data.id,
            error: unbanError instanceof Error ? unbanError.message : 'Unknown error'
          })
        }
        break

      default:
        logWebhookEvent('warn', 'Unhandled event type', { 
          eventType: validatedPayload.type 
        })
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    logWebhookEvent('error', 'Unexpected webhook processing error', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Ensure this route can handle POST requests
export const config = {
  api: {
    bodyParser: false, // Svix needs raw body
  },
} 