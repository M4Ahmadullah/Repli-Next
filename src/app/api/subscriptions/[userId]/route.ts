import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { UserService } from '@/lib/services/user.service'
import { z } from 'zod'

const updateSubscriptionSchema = z.object({
  plan: z.enum(['free', 'starter', 'growth', 'enterprise']).optional(),
  status: z.enum(['active', 'inactive', 'cancelled', 'past_due']).optional(),
  currentPeriodStart: z.string().datetime().optional(),
  currentPeriodEnd: z.string().datetime().optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId } = await auth()
    const { userId } = await params
    
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Users can only access their own subscription
    if (currentUserId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const userService = UserService.getInstance()
    const user = await userService.getUserById(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      subscription: user.subscription,
    })

  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: currentUserId } = await auth()
    const { userId } = await params
    
    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Users can only update their own subscription
    if (currentUserId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const subscriptionData = updateSubscriptionSchema.parse(body)

    // Convert string dates to Date objects
    const processedData = {
      ...subscriptionData,
      currentPeriodStart: subscriptionData.currentPeriodStart 
        ? new Date(subscriptionData.currentPeriodStart) 
        : undefined,
      currentPeriodEnd: subscriptionData.currentPeriodEnd 
        ? new Date(subscriptionData.currentPeriodEnd) 
        : undefined,
    }

    const userService = UserService.getInstance()
    const updatedUser = await userService.updateUserSubscription(userId, processedData)

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Subscription updated successfully

    return NextResponse.json({
      success: true,
      subscription: updatedUser.subscription,
    })

  } catch (error) {
    console.error('Update subscription error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 