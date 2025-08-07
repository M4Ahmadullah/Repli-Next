import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { adminDb } from '@/lib/firebase/admin'

// User sync schema
const userSyncSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  email: z.string().email('Valid email is required'),
  name: z.string().min(1, 'Name is required'),
  image: z.string().url().optional(),
  phoneNumber: z.string().optional(),
  settings: z.object({
    botPersonality: z.enum(['professional', 'friendly', 'casual', 'technical', 'empathetic']).optional(),
    autoRespond: z.boolean().optional(),
    businessHours: z.object({
      enabled: z.boolean().optional(),
      timezone: z.string().optional(),
      schedule: z.record(z.any()).optional(),
    }).optional(),
  }).optional(),
  subscription: z.object({
    plan: z.enum(['free', 'starter', 'growth', 'enterprise']).optional(),
    status: z.enum(['active', 'inactive', 'cancelled', 'past_due']).optional(),
    dailyLimit: z.number().optional(),
    currentPeriodStart: z.string().optional(),
    currentPeriodEnd: z.string().optional(),
  }).optional(),
})

// POST: Synchronize user data
export async function POST(request: NextRequest) {
  try {
    const { userId: authUserId } = await auth()

    if (!authUserId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Firebase token missing or invalid'
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }, { status: 401 })
    }

    const body = await request.json()
    const userData = userSyncSchema.parse(body)

    // Verify the user ID matches the authenticated user
    if (userData.userId !== authUserId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_ACCESS',
          message: 'User ID mismatch'
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }, { status: 403 })
    }

    // Prepare user data for Firebase
    const syncData: any = {
      userId: userData.userId,
      email: userData.email,
      name: userData.name,
      image: userData.image || null,
      phoneNumber: userData.phoneNumber || null,
      settings: {
        botPersonality: userData.settings?.botPersonality || 'professional',
        autoRespond: userData.settings?.autoRespond || false,
        businessHours: {
          enabled: userData.settings?.businessHours?.enabled || false,
          timezone: userData.settings?.businessHours?.timezone || 'UTC',
          schedule: userData.settings?.businessHours?.schedule || {}
        }
      },
      subscription: {
        plan: userData.subscription?.plan || 'free',
        status: userData.subscription?.status || 'active',
        dailyLimit: userData.subscription?.dailyLimit || 10,
        currentPeriodStart: userData.subscription?.currentPeriodStart || new Date().toISOString(),
        currentPeriodEnd: userData.subscription?.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      syncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Check if user exists
    const userDoc = await adminDb.collection('users').doc(userData.userId).get()
    
    if (userDoc.exists) {
      // Update existing user
      await adminDb.collection('users').doc(userData.userId).update(syncData)
    } else {
      // Create new user
      syncData.createdAt = new Date().toISOString()
      await adminDb.collection('users').doc(userData.userId).set(syncData)
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: userData.userId,
        syncedAt: syncData.syncedAt
      },
      message: 'User synchronized successfully',
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })

  } catch (error) {
    console.error('User sync error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
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
        message: 'Failed to synchronize user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }, { status: 500 })
  }
} 