import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    // Try to get userId from Clerk auth first
    let userId: string | null = null;
    
    try {
      const authResult = await auth();
      userId = authResult.userId;
    } catch (error) {
      console.log('Clerk auth not available, checking request body for userId');
    }
    
    // If no userId from Clerk auth, try to get it from request body
    if (!userId) {
      try {
        const body = await request.json();
        userId = body.userId;
      } catch (error) {
        console.log('No userId in request body either');
      }
    }

    // If still no userId, try to get it from URL params or headers
    if (!userId) {
      const url = new URL(request.url);
      const urlUserId = url.searchParams.get('userId');
      if (urlUserId) {
        userId = urlUserId;
      }
    }

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized - No userId provided'
      }, { status: 401 })
    }



    // Import Firebase Admin SDK only on server side
    const { adminAuth } = await import('@/lib/firebase/admin')
    
    let userRecord;
    let firebaseUid;
    
    try {
      // Try to get existing user record
      userRecord = await adminAuth.getUser(userId)
      firebaseUid = userRecord.uid
    } catch (error) {
      // If user doesn't exist, create them
      console.log('User not found in Firebase, creating new user:', userId)
      userRecord = await adminAuth.createUser({
        uid: userId,
        email: `${userId}@repli.com`, // Temporary email
        displayName: `User ${userId}`,
        disabled: false
      })
      firebaseUid = userRecord.uid
      console.log('Created new Firebase user:', firebaseUid)
    }
    
    // Create custom token
    const customToken = await adminAuth.createCustomToken(userId)
    
    // Exchange for ID token with retry logic
    let response: Response;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: customToken, returnSecureToken: true }),
          // Add timeout to prevent hanging requests
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        break; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        
        if (retryCount >= maxRetries) {
          throw new Error(`Firebase Auth API failed after ${maxRetries} attempts: ${error}`);
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      }
    }
    
    // At this point, response is guaranteed to be defined due to the retry logic
    const data = await response!.json()
    
    if (data.error) {
      console.error('Firebase Auth API error:', data.error)
      return NextResponse.json({
        success: false,
        error: `Firebase Auth API error: ${data.error.message}`
      }, { status: 500 })
    }
    
    if (!data.idToken) {
      console.error('No idToken in response:', data)
      return NextResponse.json({
        success: false,
        error: 'No idToken received from Firebase Auth API'
      }, { status: 500 })
    }
    

    
    return NextResponse.json({
      success: true,
      idToken: data.idToken,
      firebaseUid: firebaseUid
    })
    
  } catch (error) {
    console.error('Error generating Firebase token:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate Firebase token'
    }, { status: 500 })
  }
} 