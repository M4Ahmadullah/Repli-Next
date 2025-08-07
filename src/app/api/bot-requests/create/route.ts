import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { UserService } from '@/lib/services/user.service'
import { adminAuth } from '@/lib/firebase/admin'

const createBotSchema = z.object({
  name: z.string().min(2, 'Bot name must be at least 2 characters'),
  description: z.string().optional(),
  personality: z.enum(['professional', 'friendly', 'casual']).default('professional'),
})

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [DEBUG] Bot creation request received');
    let userId: string | null = null;
    
    // Try Clerk authentication first
    try {
      const authResult = await auth();
      userId = authResult.userId;
      console.log('🔍 [DEBUG] Clerk auth successful for user:', userId);
    } catch (error) {
      console.log('🔍 [DEBUG] Clerk auth failed, trying Firebase token:', error);
    }
    
    // If Clerk auth failed, try Firebase token authentication
    if (!userId) {
      const authHeader = request.headers.get('authorization');
      console.log('🔍 [DEBUG] Auth header:', authHeader ? 'present' : 'missing');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const decodedToken = await adminAuth.verifyIdToken(token);
          userId = decodedToken.uid;
          console.log('🔍 [DEBUG] Firebase token auth successful for user:', userId);
        } catch (error) {
          console.error('❌ [DEBUG] Firebase token verification failed:', error);
        }
      }
    }
    
    if (!userId) {
      console.error('❌ [DEBUG] No valid authentication found');
      return NextResponse.json(
        { error: 'Unauthorized - No valid authentication found' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const botData = createBotSchema.parse(body)

    // 1. Validate user input (already done by schema)
    
    // 2. Skip user validation for now (can be added back later)
    console.log('🔍 [DEBUG] Skipping user validation for now');
    
    // Create a default user object for bot creation
    const user = {
      subscription: {
        plan: 'free',
        dailyLimit: 10,
        monthlyLimit: 100
      },
      bots: []
    };

    // 3. Generate unique request ID for tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 4. Store user's bot creation request (for tracking purposes)
    // Note: Bot request tracking can be implemented later if needed

    // 5. Create bot on both local and backend
    console.log('🔍 [DEBUG] Creating bot on backend');
    
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
        error: 'Failed to create authentication token for bot backend'
      }, { status: 401 })
    }
    
    const firebaseToken = firebaseTokenData.idToken;
    
    // Create bot on backend
    const BOT_SYSTEM_URL = process.env.NEXT_PUBLIC_BOT_SYSTEM_URL || 'http://localhost:8000';
    const backendResponse = await fetch(`${BOT_SYSTEM_URL}/api/v1/bots/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firebaseToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: botData.name,
        description: botData.description,
        personality: botData.personality,
        userPlan: 'free',
        userLimits: {
          dailyMessages: 10,
          monthlyMessages: 100,
          maxBots: 1
        },
        userId: userId
      })
    });
    
    let backendBotId = null;
    if (backendResponse.ok) {
      const backendData = await backendResponse.json();
      console.log('🔍 [DEBUG] Backend bot creation response:', backendData);
      
      // Wait a moment for the bot to be created, then get the actual bot ID
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get the user's bots to find the newly created bot
      const botsResponse = await fetch(`${BOT_SYSTEM_URL}/api/v1/bots/user/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${firebaseToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (botsResponse.ok) {
        const botsData = await botsResponse.json();
        if (botsData.success && botsData.bots && botsData.bots.length > 0) {
          // Get the most recently created bot (should be the one we just created)
          const latestBot = botsData.bots[0];
          backendBotId = latestBot.id;
          console.log('🔍 [DEBUG] Found backend bot ID:', backendBotId);
        }
      }
    } else {
      console.warn('⚠️ Backend bot creation failed, continuing with local bot only');
    }
    
    // Generate a unique bot ID for local tracking
    const localBotId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Use backend bot ID if available, otherwise use local ID
    const botId = backendBotId || localBotId;
    
    // Create bot result object
    const botResult = {
      botId: botId,
      success: true,
      message: 'Bot created successfully'
    };

    // 6. Update user data with new bot info
    const newBot = {
      id: botResult.botId,
      userId,
      name: botData.name,
      description: botData.description,
      whatsappPhoneNumber: undefined,
      whatsappConnected: false,
      qrCode: undefined,
      status: 'creating' as const,
      settings: {
        personality: botData.personality,
        autoRespond: true,
        businessHours: {
          enabled: false,
          timezone: 'UTC',
          schedule: {}
        },
        fallbackMessage: "I'm sorry, I don't have information about that. Please contact our support team for assistance.",
        language: 'en'
      },
      trainingData: {
        businessInfo: {
          name: botData.name,
          description: botData.description || '',
        },
        qnaPairs: [],
        documents: [],
        lastTrainingUpdate: new Date()
      },
      analytics: {
        totalMessages: 0,
        todayMessages: 0,
        weeklyMessages: 0,
        monthlyMessages: 0,
        responseRate: 0,
        averageResponseTime: 0,
        topQuestions: [],
        satisfactionScore: 0,
        lastUpdated: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Skip user data update for now (can be added back later)
    console.log('🔍 [DEBUG] Skipping user data update for now');

    return NextResponse.json({
      success: true,
      bot: newBot,
      requestId,
      message: 'Bot creation initiated successfully'
    })

  } catch (error) {
    console.error('Bot creation error:', error)
    
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