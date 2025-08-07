import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
  try {
    // Get userId from query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
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
    


    return NextResponse.json({
      success: true,
      firebaseUid: firebaseUid
    })

  } catch (error) {
    console.error('❌ Error converting Clerk User ID to Firebase UID:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to convert user ID',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 