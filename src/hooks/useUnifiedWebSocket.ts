'use client'

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@clerk/nextjs';

export interface WhatsAppConnectionEvent {
  type: 'whatsapp_connected' | 'whatsapp_disconnected' | 'qr_code_updated' | 'connection_attempt_started' | 'connection_attempt_failed';
  botId: string;
  userId: string;
  phoneNumber?: string;
  displayName?: string;
  qrCode?: string;
  reason?: string;
  timestamp: string;
  sessionId?: string;
}

interface WebSocketEventHandlers {
  // General bot events
  onBotStatusUpdate?: (data: any) => void;
  onMessageSync?: (data: any) => void;
  onConnectionUpdate?: (data: any) => void;
  onConnectionError?: (error: any) => void;
  onReconnect?: () => void;
  
  // WhatsApp-specific events
  onWhatsAppConnected?: (data: WhatsAppConnectionEvent) => void;
  onWhatsAppDisconnected?: (data: WhatsAppConnectionEvent) => void;
  onQRUpdated?: (data: WhatsAppConnectionEvent) => void;
  onConnectionFailed?: (data: WhatsAppConnectionEvent) => void;
}

export const useUnifiedWebSocket = (eventHandlers?: WebSocketEventHandlers) => {
  const socketRef = useRef<Socket | null>(null);
  const { user: clerkUser } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const maxReconnectAttempts = 1;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReconnectingRef = useRef(false);
  const tokenCacheRef = useRef<{ token: string; timestamp: number } | null>(null);
  const connectionKeyRef = useRef<string>('');
  const lastConnectionAttemptRef = useRef<number>(0);

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

    // Debounce connection attempts (prevent rapid reconnections)
    const now = Date.now();
    if (now - lastConnectionAttemptRef.current < 2000) { // 2 second debounce
      console.log('⚠️ Skipping WebSocket connection - too soon since last attempt');
      return;
    }
    lastConnectionAttemptRef.current = now;

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

      console.log('🔍 Creating unified WebSocket connection');
      socketRef.current = io(process.env.NEXT_PUBLIC_BOT_WEBSOCKET_URL || 'ws://localhost:8000', {
        auth: {
          token: firebaseToken,
          userId: clerkUser.id,
        },
        reconnection: false, // Disable automatic reconnection to prevent loops
        timeout: 20000,
      });

      socketRef.current.on('connect', () => {
        console.log('✅ Unified WebSocket connected successfully');
        setIsConnected(true);
        setConnectionAttempts(0);
        isReconnectingRef.current = false;
        
        // Test the connection by emitting a test event
        setTimeout(() => {
          if (socketRef.current) {
            console.log('🧪 Testing unified WebSocket connection with test event');
            socketRef.current.emit('test', { message: 'Hello from unified frontend' });
          }
        }, 1000);
        
        if (eventHandlers?.onReconnect) {
          eventHandlers.onReconnect();
        }
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('❌ Unified WebSocket disconnected:', reason);
        setIsConnected(false);
        isReconnectingRef.current = false;
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('❌ Unified WebSocket connection error:', error);
        setIsConnected(false);
        isReconnectingRef.current = false;
        
        if (eventHandlers?.onConnectionError) {
          eventHandlers.onConnectionError(error);
        }
      });

      // Handle general bot events
      socketRef.current.on('bot_status_update', (data) => {
        console.log('📊 Bot status update received:', data);
        if (eventHandlers?.onBotStatusUpdate) {
          eventHandlers.onBotStatusUpdate(data);
        }
      });

      socketRef.current.on('message_sync', (data) => {
        console.log('📨 Message sync received:', data);
        if (eventHandlers?.onMessageSync) {
          eventHandlers.onMessageSync(data);
        }
      });

      socketRef.current.on('connection_update', (data) => {
        console.log('🔄 Connection update received:', data);
        if (eventHandlers?.onConnectionUpdate) {
          eventHandlers.onConnectionUpdate(data);
        }
      });

      // Handle WhatsApp-specific events
      socketRef.current.on('whatsapp_connection_event', (event: WhatsAppConnectionEvent) => {
        console.log('📱 WhatsApp connection event received:', event);
        
        switch (event.type) {
          case 'whatsapp_connected':
            console.log('✅ WhatsApp connected via unified WebSocket');
            if (eventHandlers?.onWhatsAppConnected) {
              eventHandlers.onWhatsAppConnected(event);
            }
            break;
            
          case 'whatsapp_disconnected':
            console.log('❌ WhatsApp disconnected via unified WebSocket');
            if (eventHandlers?.onWhatsAppDisconnected) {
              eventHandlers.onWhatsAppDisconnected(event);
            }
            break;
            
          case 'qr_code_updated':
            console.log('📱 QR code updated via unified WebSocket');
            if (eventHandlers?.onQRUpdated) {
              eventHandlers.onQRUpdated(event);
            }
            break;
            
          case 'connection_attempt_failed':
            console.log('❌ Connection attempt failed via unified WebSocket');
            if (eventHandlers?.onConnectionFailed) {
              eventHandlers.onConnectionFailed(event);
            }
            break;
        }
      });

    } catch (error) {
      console.error('❌ Error creating unified WebSocket connection:', error);
      setIsConnected(false);
      isReconnectingRef.current = false;
      
      if (eventHandlers?.onConnectionError) {
        eventHandlers.onConnectionError(error);
      }
    }
  }, [clerkUser, eventHandlers, getFirebaseToken]);

  // Auto-connect when user is available
  useEffect(() => {
    if (clerkUser) {
      connectWebSocket();
    }

    return () => {
      if (socketRef.current) {
        console.log('🧹 Cleaning up unified WebSocket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [clerkUser, connectWebSocket]);

  // Manual reconnection function
  const reconnect = useCallback(() => {
    if (connectionAttempts < maxReconnectAttempts) {
      console.log(`🔄 Attempting unified WebSocket reconnection ${connectionAttempts + 1}/${maxReconnectAttempts}`);
      setConnectionAttempts(prev => prev + 1);
      connectWebSocket();
    } else {
      console.log('❌ Max reconnection attempts reached for unified WebSocket');
    }
  }, [connectionAttempts, maxReconnectAttempts, connectWebSocket]);

  // Manual disconnect function
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Manually disconnecting unified WebSocket');
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Emit WhatsApp connection trigger
  const triggerWhatsAppConnection = useCallback((botId: string, userId: string) => {
    if (socketRef.current?.connected) {
      console.log('🚀 Triggering WhatsApp connection via unified WebSocket');
      socketRef.current.emit('trigger_whatsapp_connection', {
        botId,
        userId,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('⚠️ Cannot trigger WhatsApp connection - WebSocket not connected');
    }
  }, []);

  // Emit WhatsApp disconnect
  const disconnectWhatsApp = useCallback((botId: string, userId: string) => {
    if (socketRef.current?.connected) {
      console.log('🔌 Disconnecting WhatsApp via unified WebSocket');
      socketRef.current.emit('disconnect_whatsapp', {
        botId,
        userId,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('⚠️ Cannot disconnect WhatsApp - WebSocket not connected');
    }
  }, []);

  return {
    isConnected,
    connectionAttempts,
    reconnect,
    disconnect,
    triggerWhatsAppConnection,
    disconnectWhatsApp
  };
}; 