import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { botId: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { botId } = params
    const body = await request.json()
    const { clearSession, clearRedis, clearDatabase } = body

    console.log('🗑️ Clearing WhatsApp session for bot:', botId)
    console.log('🗑️ Clear options:', { clearSession, clearRedis, clearDatabase })

    // Call the bot backend to clear the session
    const botBackendUrl = process.env.BOT_BACKEND_URL || 'http://localhost:8000'
    
    const response = await fetch(`${botBackendUrl}/v1/whatsapp/clear-session/${botId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${request.headers.get('authorization')?.replace('Bearer ', '')}`
      },
      body: JSON.stringify({
        userId,
        clearSession: clearSession || true,
        clearRedis: clearRedis || true,
        clearDatabase: clearDatabase || true
      })
    })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Session cleared successfully:', data)
      return NextResponse.json({
        success: true,
        message: 'Session cleared successfully',
        data
      })
    } else {
      const errorData = await response.json()
      console.error('❌ Failed to clear session:', errorData)
      return NextResponse.json({
        success: false,
        error: 'Failed to clear session',
        details: errorData
      }, { status: response.status })
    }

  } catch (error) {
    console.error('❌ Error clearing session:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
} 