import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Missing userId parameter'
      }, { status: 400 });
    }

    console.log('🧪 Testing Firebase token generation for user:', userId);

    // Get Firebase token from our API
    const firebaseTokenResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/firebase-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId })
    });

    const firebaseTokenData = await firebaseTokenResponse.json();

    if (!firebaseTokenData.success || !firebaseTokenData.idToken) {
      console.error('❌ Firebase token generation failed:', firebaseTokenData);
      return NextResponse.json({
        success: false,
        error: 'Failed to generate Firebase token',
        details: firebaseTokenData
      }, { status: 500 });
    }

    console.log('✅ Firebase token generated successfully');
    console.log('🔍 Token details:', {
      success: firebaseTokenData.success,
      hasIdToken: !!firebaseTokenData.idToken,
      hasFirebaseUid: !!firebaseTokenData.firebaseUid,
      tokenLength: firebaseTokenData.idToken?.length || 0
    });

    return NextResponse.json({
      success: true,
      message: 'Firebase token generated successfully',
      hasToken: !!firebaseTokenData.idToken,
      hasUid: !!firebaseTokenData.firebaseUid,
      tokenPreview: firebaseTokenData.idToken ? `${firebaseTokenData.idToken.substring(0, 20)}...` : null
    });

  } catch (error) {
    console.error('❌ Error testing Firebase auth:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 