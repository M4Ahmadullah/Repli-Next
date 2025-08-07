import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  try {
    let userId: string | null = null;
    
    // Try to get userId from Clerk auth first
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (error) {
      console.log('Clerk auth not available, checking Authorization header');
    }
    
    // If no userId from Clerk auth, try to get it from Authorization header or request body
    let body;
    if (!userId) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // For direct API calls, we need to get userId from request body
        try {
          body = await request.json();
          userId = body.userId;
        } catch (error) {
          console.log('No userId in request body for direct API call');
        }
      }
    }

    const { botId } = await params

    if (!userId) {
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

    // Get request body if we haven't already parsed it
    if (!body) {
      try {
        body = await request.json();
      } catch (error) {
        body = {};
      }
    }
    
    const { useExistingSession, isNewBotCreation } = body;

    // ✅ Get Firebase ID token for bot backend authentication
    const firebaseTokenResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/firebase-token`, {
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

    // ✅ Forward request to bot backend with correct API structure
    const BOT_SYSTEM_URL = process.env.NEXT_PUBLIC_BOT_SYSTEM_URL || 'http://localhost:8000'
    const response = await fetch(`${BOT_SYSTEM_URL}/api/v1/whatsapp/connect/${botId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId, // ✅ ADD THE MISSING USER ID
        useExistingSession: useExistingSession || false,
        isNewBotCreation: isNewBotCreation || true
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'SERVICE_ERROR',
            message: 'Failed to connect WhatsApp',
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
    console.error('WhatsApp connection error:', error)
    return NextResponse.json({ 
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }, { status: 500 })
  }
} 