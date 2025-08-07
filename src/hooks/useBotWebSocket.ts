'use client'

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@clerk/nextjs';

interface WebSocketEventHandlers {
  onQrCode?: (qrCode: string) => void;
  onBotStatusUpdate?: (data: any) => void;
  onMessageSync?: (data: any) => void;
  onConnectionUpdate?: (data: any) => void;
  onConnectionError?: (error: any) => void;
  onReconnect?: () => void;
}

export const useBotWebSocket = (eventHandlers?: WebSocketEventHandlers) => {
  const socketRef = useRef<Socket | null>(null);
  const { user: clerkUser } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxReconnectAttempts = 1; // Reduced to prevent excessive reconnection attempts
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReconnectingRef = useRef(false);
  const tokenCacheRef = useRef<{ token: string; timestamp: number } | null>(null);

  const getFirebaseToken = useCallback(async () => {
    // Check cache first (tokens are valid for 1 hour)
    if (tokenCacheRef.current && Date.now() - tokenCacheRef.current.timestamp < 3600000) {
      return tokenCacheRef.current.token;
    }

    try {
      const response = await fetch('/api/auth/firebase-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get Firebase token');
      }

      if (!data.idToken) {
        throw new Error('No idToken received from Firebase token API');
      }

      // Cache the token
      tokenCacheRef.current = {
        token: data.idToken,
        timestamp: Date.now()
      };

      return data.idToken;
    } catch (error) {
      console.error('❌ Error getting Firebase token:', error);
      throw error;
    }
  }, []);

  const connectWebSocket = useCallback(async () => {
    if (!clerkUser || isReconnectingRef.current) {
      return;
    }

    // If already connected, don't reconnect
    if (socketRef.current?.connected) {
      console.log('🔍 WebSocket already connected, skipping reconnection');
      return;
    }

    isReconnectingRef.current = true;

    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      const firebaseToken = await getFirebaseToken();
      
      if (!firebaseToken) {
        isReconnectingRef.current = false;
        return;
      }

      // Disconnect existing socket if any
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      console.log('🔍 Creating new WebSocket connection');
      socketRef.current = io(process.env.NEXT_PUBLIC_BOT_WEBSOCKET_URL || 'ws://localhost:8000', {
        auth: {
          token: firebaseToken,
          userId: clerkUser.id,
        },
        reconnection: false, // Disable automatic reconnection to prevent loops
        timeout: 20000,
      });

      socketRef.current.on('connect', () => {
        console.log('✅ WebSocket connected successfully');
        setIsConnected(true);
        setConnectionAttempts(0);
        isReconnectingRef.current = false;
        
        // Test the connection by emitting a test event
        setTimeout(() => {
          if (socketRef.current) {
            console.log('🧪 Testing WebSocket connection with test event');
            socketRef.current.emit('test', { message: 'Hello from frontend' });
          }
        }, 1000);
        
        if (eventHandlers?.onReconnect) {
          eventHandlers.onReconnect();
        }
      });

      // Set up event listeners only once
      if (!socketRef.current.hasListeners('qr-code')) {
        console.log('🔧 Setting up WebSocket event listeners');
        
        // QR Code event handler - simplified
        socketRef.current.on('qr-code', (data) => {
          console.log('📱 QR code received via WebSocket:', data);
          if (eventHandlers?.onQrCode && data.qrCode) {
            console.log('✅ Calling onQrCode handler with QR code');
            eventHandlers.onQrCode(data.qrCode);
          }
        });

        // Alternative event names
        socketRef.current.on('qr', (data) => {
          console.log('📱 QR code received via WebSocket (qr):', data);
          if (eventHandlers?.onQrCode) {
            if (typeof data === 'string') {
              eventHandlers.onQrCode(data);
            } else if (data && typeof data === 'object' && data.qrCode) {
              eventHandlers.onQrCode(data.qrCode);
            }
          }
      });

        // Additional event names that might be used
        socketRef.current.on('qrCode', (data) => {
          console.log('📱 QR code received via WebSocket (qrCode):', data);
          if (eventHandlers?.onQrCode && data.qrCode) {
            eventHandlers.onQrCode(data.qrCode);
          }
        });

        socketRef.current.on('whatsapp_qr', (data) => {
          console.log('📱 QR code received via WebSocket (whatsapp_qr):', data);
          if (eventHandlers?.onQrCode && data.qrCode) {
            eventHandlers.onQrCode(data.qrCode);
          }
        });

        socketRef.current.on('whatsapp.qr', (data) => {
          console.log('📱 QR code received via WebSocket (whatsapp.qr):', data);
          if (eventHandlers?.onQrCode && data.qrCode) {
            eventHandlers.onQrCode(data.qrCode);
          }
        });

        socketRef.current.on('whatsapp:qr', (data) => {
          console.log('📱 QR code received via WebSocket (whatsapp:qr):', data);
          if (eventHandlers?.onQrCode && data.qrCode) {
            eventHandlers.onQrCode(data.qrCode);
          }
        });

        // Generic WhatsApp event listener
        socketRef.current.on('whatsapp', (data) => {
          console.log('📱 WhatsApp event received via WebSocket:', data);
        if (eventHandlers?.onQrCode && data.qrCode) {
          eventHandlers.onQrCode(data.qrCode);
        }
      });

        // Listen for all events to debug
        socketRef.current.onAny((eventName, ...args) => {
          if (eventName.includes('qr') || eventName.includes('QR')) {
            console.log('🔍 QR-related WebSocket event:', eventName, args);
            // Try to extract QR code from any QR-related event
            if (args[0] && typeof args[0] === 'object') {
              const data = args[0];
              if (data.qrCode && eventHandlers?.onQrCode) {
                console.log('✅ Found QR code in event:', eventName);
                eventHandlers.onQrCode(data.qrCode);
              } else if (typeof data === 'string' && data.startsWith('data:image') && eventHandlers?.onQrCode) {
                console.log('✅ Found QR code string in event:', eventName);
                eventHandlers.onQrCode(data);
              }
            }
          }
          // Log all events for debugging
          console.log('🔍 WebSocket event received:', eventName, args);
        });

        // Test event listener
        socketRef.current.on('test-response', (data) => {
          console.log('✅ Test event received from backend:', data);
        });

      // Bot status update handler
        socketRef.current.on('bot-status-update', (data) => {
          console.log('🤖 Bot status update received:', data);
        if (eventHandlers?.onBotStatusUpdate) {
          eventHandlers.onBotStatusUpdate(data);
        }
      });

      // Message sync handler
        socketRef.current.on('message-sync', (data) => {
          console.log('💬 Message sync received:', data);
        if (eventHandlers?.onMessageSync) {
          eventHandlers.onMessageSync(data);
        }
      });

              // Connection update handler
      socketRef.current.on('connection-update', (data) => {
          console.log('🔗 Connection update received:', data);
        if (eventHandlers?.onConnectionUpdate) {
          eventHandlers.onConnectionUpdate(data);
          }
          // Check if this event contains a QR code
          if (eventHandlers?.onQrCode && data.qrCode) {
            console.log('✅ Found QR code in connection-update event');
            eventHandlers.onQrCode(data.qrCode);
          }
        });

        // WhatsApp connection success handler
        socketRef.current.on('whatsapp-connected', (data) => {
          console.log('✅ WhatsApp connection success received:', data);
          if (eventHandlers?.onConnectionUpdate) {
            eventHandlers.onConnectionUpdate({
              type: 'connected',
              success: true,
              phoneNumber: data.phoneNumber,
              displayName: data.displayName,
              ...data
            });
          }
        });

        // WhatsApp connection status handler
        socketRef.current.on('whatsapp-status', (data) => {
          console.log('📱 WhatsApp status update received:', data);
          if (eventHandlers?.onConnectionUpdate) {
            eventHandlers.onConnectionUpdate(data);
          }
        });

        // Generic connection success handler
        socketRef.current.on('connection-success', (data) => {
          console.log('✅ Connection success received:', data);
          if (eventHandlers?.onConnectionUpdate) {
            eventHandlers.onConnectionUpdate({
              type: 'connected',
              success: true,
              ...data
            });
          }
        });
      }

      socketRef.current.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        setIsConnected(false);
        setConnectionAttempts(prev => prev + 1);
        isReconnectingRef.current = false;
        
        if (eventHandlers?.onConnectionError) {
          eventHandlers.onConnectionError(error);
        }
        
        // If max attempts reached, stop trying
        if (connectionAttempts >= maxReconnectAttempts) {
          console.error('❌ Max WebSocket reconnection attempts reached');
          return;
        }

        // Manual reconnection with longer delay
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Attempting WebSocket reconnection...');
          connectWebSocket();
        }, 5000); // Increased delay to 5 seconds
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
        setIsConnected(false);
        isReconnectingRef.current = false;
        
        // Only reconnect if it's a server disconnect and we haven't reached max attempts
        if (reason === 'io server disconnect' && connectionAttempts < maxReconnectAttempts) {
          console.log('🔄 Server disconnected, attempting reconnection...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 5000); // Increased delay to 5 seconds
        }
      });

      // Error handler for session cleanup errors
      socketRef.current.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        isReconnectingRef.current = false;
        if (eventHandlers?.onConnectionError) {
          eventHandlers.onConnectionError(error);
        }
      });

    } catch (error) {
      console.error('❌ [DEBUG] WebSocket setup error:', error);
      setIsConnected(false);
      isReconnectingRef.current = false;
      
      if (eventHandlers?.onConnectionError) {
        eventHandlers.onConnectionError(error);
      }
    }
  }, [clerkUser, eventHandlers, getFirebaseToken]); // Removed connectionAttempts dependency

  useEffect(() => {
    if (clerkUser) {
      connectWebSocket();
    }

    return () => {
      // Clear reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Reset reconnecting flag
      isReconnectingRef.current = false;
      
      // Disconnect socket
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [connectWebSocket]);

  return {
    socket: socketRef.current,
    isConnected,
    connectionAttempts,
    reconnect: connectWebSocket
  };
}; 