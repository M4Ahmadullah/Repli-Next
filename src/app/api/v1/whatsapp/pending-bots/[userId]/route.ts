import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    let authUserId: string | null = null;
    
    // Try to get userId from Clerk auth first
    try {
      const authResult = await auth();
      authUserId = authResult.userId;
    } catch (error) {
      console.log('Clerk auth not available, checking Authorization header');
    }
    
    // If no userId from Clerk auth, try to get it from Authorization header
    if (!authUserId) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // For direct API calls with Firebase token, use the param userId
        authUserId = userId;
      }
    }
    
    // Verify authentication
    if (!authUserId) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication token is required'
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }, { status: 401 })
    }

    // Verify user access (only for Clerk auth, not for direct API calls)
    try {
      const authResult = await auth();
      if (authResult.userId && authResult.userId !== userId) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID mismatch'
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }, { status: 403 })
      }
    } catch (error) {
      // If Clerk auth fails, we're doing a direct API call, so skip user verification
      console.log('Skipping user verification for direct API call');
    }

    // ✅ Get Firebase ID token for bot backend authentication
    let baseUrl: string;
    if (typeof window === 'undefined') {
      baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    } else {
      baseUrl = '';
    }
    const firebaseTokenResponse = await fetch(`${baseUrl}/api/auth/firebase-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const firebaseTokenData = await firebaseTokenResponse.json();
    if (!firebaseTokenData.success || !firebaseTokenData.idToken) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Failed to create authentication token'
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }, { status: 401 })
    }
    const firebaseToken = firebaseTokenData.idToken;
    
    if (!firebaseToken) {
      return NextResponse.json({ 
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'Failed to create authentication token'
        },
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }, { status: 401 })
    }

    // ✅ Forward request to bot backend with correct API structure
    const BOT_SYSTEM_URL = process.env.NEXT_PUBLIC_BOT_SYSTEM_URL || 'http://localhost:8000'
    const response = await fetch(`${BOT_SYSTEM_URL}/api/v1/whatsapp/pending-bots/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${firebaseToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'SERVICE_ERROR',
            message: 'Failed to fetch pending bots from bot backend',
            details: errorData.error?.message || 'Unknown error'
          },
          timestamp: new Date().toISOString(),
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('Pending bots fetch error:', error)
    return NextResponse.json({ 
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch pending bots',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }, { status: 500 })
  }
} 