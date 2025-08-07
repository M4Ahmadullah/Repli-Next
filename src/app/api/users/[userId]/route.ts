import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

// GET: Fetch user profile
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await auth()
    const resolvedParams = await context.params

    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    if (resolvedParams.userId !== userId) {
      return NextResponse.json({ 
        error: 'Access denied' 
      }, { status: 403 })
    }

    // Get user document from Firestore
    const userDoc = await adminDb
      .collection('users')
      .doc(userId)
      .get()

    if (!userDoc.exists) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 })
    }

    const userData = userDoc.data()

    // Remove sensitive fields
    const { 
      firebaseUid, 
      customClaims, 
      ...safeUserData 
    } = userData || {}

    return NextResponse.json(safeUserData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('User fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch user data',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PUT: Update user profile
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await auth()
    const resolvedParams = await context.params

    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    if (resolvedParams.userId !== userId) {
      return NextResponse.json({ 
        error: 'Access denied' 
      }, { status: 403 })
    }

    const updateData = await request.json()

    // Validate update data
    if (!updateData || typeof updateData !== 'object') {
      return NextResponse.json({ 
        error: 'Invalid update data' 
      }, { status: 400 })
    }

    // Remove sensitive fields that shouldn't be updated via API
    const { 
      firebaseUid, 
      customClaims, 
      createdAt,
      ...safeUpdateData 
    } = updateData

    // Add timestamp
    const updatePayload = {
      ...safeUpdateData,
      updatedAt: FieldValue.serverTimestamp()
    }

    // Update user document in Firestore
    await adminDb
      .collection('users')
      .doc(userId)
      .update(updatePayload)

    return NextResponse.json({ 
      message: 'User profile updated successfully',
      updatedAt: new Date().toISOString()
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json({ 
      error: 'Failed to update user profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE: Delete user account
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await auth()
    const resolvedParams = await context.params

    if (!userId) {
      return NextResponse.json({ 
        error: 'Unauthorized' 
      }, { status: 401 })
    }

    if (resolvedParams.userId !== userId) {
      return NextResponse.json({ 
        error: 'Access denied' 
      }, { status: 403 })
    }

    // Delete user document from Firestore
    await adminDb
      .collection('users')
      .doc(userId)
      .delete()

    // Note: In a production app, you might want to:
    // 1. Delete the user from Firebase Auth
    // 2. Clean up related data (bots, conversations, etc.)
    // 3. Handle subscription cancellation

    return NextResponse.json({ 
      message: 'User account deleted successfully' 
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    })
  } catch (error) {
    console.error('User deletion error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete user account',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 