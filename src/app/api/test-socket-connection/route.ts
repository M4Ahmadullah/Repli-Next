import { NextRequest, NextResponse } from 'next/server';
import { io } from 'socket.io-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');
    const userId = searchParams.get('userId');
    const token = searchParams.get('token');

    if (!botId || !userId || !token) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: botId, userId, or token'
      }, { status: 400 });
    }

    console.log('🧪 Testing Socket.io connection to bot backend...');
    console.log('🔍 Parameters:', { botId, userId, token: token.substring(0, 20) + '...' });

    // Test Socket.io connection with Firebase token
    const socket = io(process.env.NEXT_PUBLIC_BOT_WS_URL || 'ws://localhost:8000', {
      auth: {
        token: token // This should be a Firebase ID token
      },
      query: {
        botId: botId,
        userId: userId
      },
      timeout: 5000,
      transports: ['websocket', 'polling']
    });

    return new Promise((resolve) => {
      let connectionResult = {
        success: false,
        message: '',
        details: {}
      };

      // Set timeout for connection test
      const timeout = setTimeout(() => {
        socket.disconnect();
        resolve(NextResponse.json({
          success: false,
          error: 'Connection timeout after 5 seconds',
          details: connectionResult.details
        }, { status: 408 }));
      }, 5000);

      socket.on('connect', () => {
        console.log('✅ Socket.io connection successful');
        clearTimeout(timeout);
        connectionResult = {
          success: true,
          message: 'Socket.io connection established successfully',
          details: {
            connected: true,
            socketId: socket.id,
            transport: socket.io.engine.transport.name,
            url: process.env.NEXT_PUBLIC_BOT_WS_URL || 'ws://localhost:8000'
          }
        };
        socket.disconnect();
        resolve(NextResponse.json(connectionResult));
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket.io connection error:', error);
        clearTimeout(timeout);
        connectionResult = {
          success: false,
          message: 'Socket.io connection failed',
          details: {
            error: error.message,
            url: process.env.NEXT_PUBLIC_BOT_WS_URL || 'ws://localhost:8000'
          }
        };
        socket.disconnect();
        resolve(NextResponse.json(connectionResult, { status: 500 }));
      });

      socket.on('error', (error) => {
        console.error('❌ Socket.io error:', error);
        clearTimeout(timeout);
        connectionResult = {
          success: false,
          message: 'Socket.io error occurred',
          details: {
            error: error.message || 'Unknown error',
            url: process.env.NEXT_PUBLIC_BOT_WS_URL || 'ws://localhost:8000'
          }
        };
        socket.disconnect();
        resolve(NextResponse.json(connectionResult, { status: 500 }));
      });
    });

  } catch (error) {
    console.error('❌ Error testing Socket.io connection:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: {
        message: error instanceof Error ? error.message : 'Unknown error',
        url: process.env.NEXT_PUBLIC_BOT_WS_URL || 'ws://localhost:8000'
      }
    }, { status: 500 });
  }
} 