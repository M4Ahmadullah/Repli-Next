import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { adminDb } from '@/lib/firebase/admin'

const webhookConfigSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  whatsappPhoneNumber: z.string().min(1, 'WhatsApp phone number is required')
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized'
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }, { status: 401 })
    }

    const body = await request.json()
    const { userId: requestedUserId, whatsappPhoneNumber } = webhookConfigSchema.parse(body)

    // Validate user can only configure their own webhook
    if (requestedUserId !== userId) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied'
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }, { status: 403 })
    }

    // Generate webhook URL
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/bot`

    // Update user's WhatsApp phone number in Firestore
    await adminDb
      .collection('users')
      .doc(userId)
      .update({
        whatsappPhoneNumber,
        webhookUrl,
        webhookConfigured: true,
        updatedAt: new Date()
      })

    return NextResponse.json({
      success: true,
      data: {
        webhookUrl,
        whatsappPhoneNumber,
        configuredAt: new Date().toISOString()
      },
      message: 'Webhook configured successfully',
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('Webhook configuration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Webhook configuration validation failed',
          details: error.errors
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to configure webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }, { status: 500 })
  }
} 