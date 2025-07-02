import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { UserService } from '@/lib/services/user.service'

// Webhook event types we'll handle
type ClerkWebhookEvent = 
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | string  // Allow for other potential event types

// Webhook payload structure
interface ClerkWebhookPayload {
  data: {
    id: string
    email_addresses: { email_address: string }[]
    first_name?: string
    last_name?: string
    profile_image_url?: string
    created_at: number
    updated_at: number
  }
  type: ClerkWebhookEvent
}

export async function POST(req: NextRequest) {
  // Log incoming request details for debugging
  console.log('🔔 Clerk Webhook Received')
  console.log('Request Headers:', Object.fromEntries(req.headers))

  // Verify webhook secret is configured
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!CLERK_WEBHOOK_SECRET) {
    console.error('❌ CLERK_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  try {
    // Get headers for webhook verification
    const svix_id = req.headers.get('svix-id')
    const svix_timestamp = req.headers.get('svix-timestamp')
    const svix_signature = req.headers.get('svix-signature')

    // Log header details
    console.log('Svix Headers:', { svix_id, svix_timestamp, svix_signature })

    // Validate headers
    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.warn('❌ Missing Svix headers')
      return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 })
    }

    // Read request body
    const payload = await req.json()
    console.log('Webhook Payload:', JSON.stringify(payload, null, 2))

    // Create a new Svix Webhook instance
    const wh = new Webhook(CLERK_WEBHOOK_SECRET)

    // Verify the webhook
    let verifiedPayload: ClerkWebhookPayload
    try {
      verifiedPayload = wh.verify(
        JSON.stringify(payload), 
        {
          'svix-id': svix_id,
          'svix-timestamp': svix_timestamp,
          'svix-signature': svix_signature
        }
      ) as ClerkWebhookPayload
    } catch (err) {
      console.error('❌ Webhook verification failed', err)
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 403 })
    }

    console.log(`✅ Verified Webhook Event: ${verifiedPayload.type}`)

    // Get UserService instance
    const userService = UserService.getInstance()

    // Process different event types
    switch (verifiedPayload.type) {
      case 'user.created':
        await userService.createUser({
          clerkId: verifiedPayload.data.id,
          email: verifiedPayload.data.email_addresses[0].email_address,
          name: `${verifiedPayload.data.first_name || ''} ${verifiedPayload.data.last_name || ''}`.trim(),
          image: verifiedPayload.data.profile_image_url,
        })
        console.log(`🆕 User created: ${verifiedPayload.data.id}`)
        break

      case 'user.updated':
        await userService.updateUser(verifiedPayload.data.id, {
          name: `${verifiedPayload.data.first_name || ''} ${verifiedPayload.data.last_name || ''}`.trim(),
          image: verifiedPayload.data.profile_image_url,
        })
        console.log(`🔄 User updated: ${verifiedPayload.data.id}`)
        break

      case 'user.deleted':
        await userService.deleteUser(verifiedPayload.data.id)
        console.log(`❌ User deleted: ${verifiedPayload.data.id}`)
        break

      default:
        console.warn(`❓ Unhandled event type: ${verifiedPayload.type}`)
    }

    return NextResponse.json({ success: true }, { status: 200 })

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Ensure this route can handle POST requests
export const config = {
  api: {
    bodyParser: false, // Svix needs raw body
  },
} 