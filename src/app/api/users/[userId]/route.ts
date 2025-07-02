import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { UserService } from '@/lib/services/user.service'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  image: z.string().url('Invalid image URL').optional(),
  settings: z.object({
    whatsappConnected: z.boolean().optional(),
    whatsappPhoneNumber: z.string().optional(),
    whatsappBusinessAccountId: z.string().optional(),
    whatsappPhoneNumberId: z.string().optional(),
    aiProvider: z.enum(['openai', 'anthropic', 'ollama']).optional(),
    aiModel: z.string().optional(),
    botPersonality: z.enum(['professional', 'friendly', 'casual']).optional(),
    customInstructions: z.string().optional(),
    autoRespond: z.boolean().optional(),
    businessName: z.string().optional(),
    businessDescription: z.string().optional(),
    businessHours: z.object({
      enabled: z.boolean(),
      timezone: z.string(),
      schedule: z.record(z.object({
        start: z.string(),
        end: z.string(),
        enabled: z.boolean(),
      })),
    }).optional(),
  }).optional(),
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

    // Users can only access their own data
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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        subscription: user.subscription,
        bots: user.bots,
        activeBotId: user.activeBotId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })

  } catch (error) {
    console.error('Get user error:', error)
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

    // Users can only update their own data
    if (currentUserId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const updateData = updateUserSchema.parse(body)

    const userService = UserService.getInstance()
    const updatedUser = await userService.updateUser(userId, updateData)

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // User updated successfully

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        image: updatedUser.image,
        subscription: updatedUser.subscription,
        bots: updatedUser.bots,
        activeBotId: updatedUser.activeBotId,
        updatedAt: updatedUser.updatedAt,
      },
    })

  } catch (error) {
    console.error('Update user error:', error)
    
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

export async function DELETE(
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

    // Users can only delete their own account
    if (currentUserId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const userService = UserService.getInstance()
    await userService.deleteUser(userId)

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 