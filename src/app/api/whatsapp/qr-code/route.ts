import { NextRequest, NextResponse } from 'next/server'
import { BotApiClient } from '@/lib/api/bot-client'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
  try {
    // Try to get data from request body first
    let userId, botId;
    try {
      const body = await request.json()
      userId = body.userId
      botId = body.botId
    } catch {
      // If no body, try query parameters
      const url = new URL(request.url)
      userId = url.searchParams.get('userId')
      botId = url.searchParams.get('botId')
    }
    
    if (!userId) {
      console.error('❌ QR code endpoint: User ID is required');
      return NextResponse.json({ 
        success: false,
        error: 'User ID is required' 
      }, { status: 400 })
    }
    
    if (!botId) {
      console.error('❌ QR code endpoint: Bot ID is required');
      return NextResponse.json({ 
        success: false,
        error: 'Bot ID is required' 
      }, { status: 400 })
    }

    // ✅ Create BotApiClient instance with clerkUserId
    const botApiClient = new BotApiClient(userId);
    
    // Use the correct WhatsApp connect endpoint from the API documentation
    let response;
    if (botId) {
      // If botId is provided, connect to existing bot using the correct endpoint
      console.log('🔍 [DEBUG] Connecting WhatsApp for existing bot:', botId);
      response = await botApiClient.connectWhatsApp(botId, userId)
    } else {
      // Otherwise, create new bot and connect
      console.log('🔍 [DEBUG] Creating new bot and connecting WhatsApp');
      response = await botApiClient.initiateWhatsAppConnection(userId)
    }

    if (response.success) {
      // Check if the response contains a QR code
      if (response.qrCode) {
        return NextResponse.json({
          success: true,
          qrCode: response.qrCode,
          message: response.message || 'QR code generated successfully',
          botId: botId || response.botId
        })
      } else {
        // Backend should now return QR code - if not, it's a temporary issue
        console.log('⏳ Backend initiated QR generation, waiting for WebSocket QR code...');
        return NextResponse.json({
          success: true,
          message: response.message || 'QR code generation initiated. Listen for WebSocket updates.',
          botId: botId || response.botId,
          qrCode: null
        });
      }
    } else {
      // Handle rate limit errors gracefully
      
      // Handle other error responses from backend
      return NextResponse.json({
        success: false,
        error: response.error || 'Failed to generate QR code',
        message: response.message || 'WhatsApp connection failed'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('❌ QR code generation error:', error);
    
    // Return error response instead of mock data
    return NextResponse.json({
      success: false,
      error: 'QR code generation failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
} 