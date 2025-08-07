import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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
    
    // If no userId from Clerk auth, try to get it from Authorization header
    if (!userId) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // For direct API calls with Firebase token, use the param userId
        const { userId: paramUserId } = await params;
        userId = paramUserId;
      }
    }

    const { userId: paramUserId } = await params

    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized'
      }, { status: 401 })
    }

    // Get Firebase token for bot backend authentication
    const firebaseTokenResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/firebase-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    const firebaseTokenData = await firebaseTokenResponse.json();
    
    if (!firebaseTokenData.success || !firebaseTokenData.idToken) {
      return NextResponse.json({ 
        success: false,
        error: 'Failed to create authentication token'
      }, { status: 401 })
    }
    
    const firebaseToken = firebaseTokenData.idToken;

    // Forward request to the bot backend
    const BOT_SYSTEM_URL = process.env.NEXT_PUBLIC_BOT_SYSTEM_URL || 'http://localhost:8000'
    const response = await fetch(`${BOT_SYSTEM_URL}/api/v1/whatsapp/logout/${paramUserId}`, {
      method: 'POST',
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
          error: 'Failed to logout WhatsApp',
          details: errorData.message || 'Unknown error'
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('WhatsApp logout error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 