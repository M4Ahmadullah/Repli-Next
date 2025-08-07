import { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { io, Socket } from 'socket.io-client';
import { BotApiClient } from '@/lib/api/bot-client';

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

export interface UseWhatsAppConnectionProps {
  botId: string;
  userId: string;
  onConnected?: (data: WhatsAppConnectionEvent) => void;
  onDisconnected?: (data: WhatsAppConnectionEvent) => void;
  onQRUpdated?: (data: WhatsAppConnectionEvent) => void;
  onConnectionFailed?: (data: WhatsAppConnectionEvent) => void;
}

export function useWhatsAppConnection({ 
  botId, 
  userId, 
  onConnected, 
  onDisconnected, 
  onQRUpdated, 
  onConnectionFailed 
}: UseWhatsAppConnectionProps) {
  const { user } = useUser();
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'waiting' | 'failed'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [lastEvent, setLastEvent] = useState<WhatsAppConnectionEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const tokenCacheRef = useRef<{ token: string; timestamp: number } | null>(null);
  const connectionKeyRef = useRef<string>('');
  const lastConnectionAttemptRef = useRef<number>(0);

  // Get Firebase token function (copied from useBotWebSocket)
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

  useEffect(() => {
    // Don't connect if botId or userId are empty strings or undefined
    if (!botId || !userId || botId === '' || userId === '') {
      console.log('⚠️ Skipping Socket.io connection - missing botId or userId:', { botId, userId });
      return;
    }

    // Additional safety check: don't connect if botId is just whitespace or very short
    if (botId.trim().length < 3) {
      console.log('⚠️ Skipping Socket.io connection - botId too short or invalid:', { botId, userId });
      return;
    }

    // Debounce connection attempts (prevent rapid reconnections)
    const now = Date.now();
    if (now - lastConnectionAttemptRef.current < 2000) { // 2 second debounce
      console.log('⚠️ Skipping Socket.io connection - too soon since last attempt');
      return;
    }
    lastConnectionAttemptRef.current = now;

    // Check if we're already connected to the same bot/user
    const connectionKey = `${botId}-${userId}`;
    if (connectionKeyRef.current === connectionKey && socketRef.current?.connected) {
      console.log('⚠️ Already connected to same bot/user, skipping new connection');
      return;
    }

    // Clean up existing connection if it's for a different bot/user
    if (socketRef.current && connectionKeyRef.current !== connectionKey) {
      console.log('🔄 Cleaning up existing connection for different bot/user');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    connectionKeyRef.current = connectionKey;
    console.log('🔌 Creating new Socket.io connection for:', connectionKey);

    const connectSocket = async () => {
      try {
        const token = await getFirebaseToken();
        const wsUrl = process.env.NEXT_PUBLIC_BOT_WS_URL || 'ws://localhost:8000';
        console.log('🔌 Connecting to Socket.io:', wsUrl);
        console.log('🔌 Environment variables:', { 
          NEXT_PUBLIC_BOT_WS_URL: process.env.NEXT_PUBLIC_BOT_WS_URL, 
          NEXT_PUBLIC_BOT_API_URL: process.env.NEXT_PUBLIC_BOT_API_URL 
        });

        // Create Socket.io connection
        const socket = io(wsUrl, {
          auth: {
            token: token
          },
          query: {
            botId: botId,
            userId: userId
          },
          transports: ['websocket', 'polling'],
          timeout: 10000,
          reconnection: true,
          reconnectionAttempts: maxReconnectAttempts,
          reconnectionDelay: 1000
        });

        socketRef.current = socket;

        // Handle connection events
        socket.on('connect', () => {
          console.log('✅ Socket.io connected successfully');
          setIsWebSocketConnected(true);
          setError(null);
          reconnectAttemptsRef.current = 0;
        });

        socket.on('disconnect', (reason) => {
          console.log('❌ Socket.io disconnected:', reason);
          setIsWebSocketConnected(false);
          setConnectionStatus('disconnected');
          
          if (reason === 'io server disconnect') {
            // Server disconnected us, try to reconnect
            socket.connect();
          }
        });

        socket.on('connect_error', (error) => {
          console.error('❌ Socket.io connection error:', error);
          setError(`Socket.io connection error: ${error.message}`);
          setIsWebSocketConnected(false);
          
          // Implement exponential backoff for reconnection
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++;
              console.log(`🔄 Attempting reconnection ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
              socket.connect();
            }, delay);
          }
        });

        // Handle WhatsApp connection events
        socket.on('whatsapp_connection_event', (event: WhatsAppConnectionEvent) => {
          console.log('📱 WhatsApp connection event received:', event);
          setLastEvent(event);
          setError(null);

          switch (event.type) {
            case 'whatsapp_connected':
              console.log('✅ WhatsApp connected via real-time');
              setConnectionStatus('connected');
              setPhoneNumber(event.phoneNumber || null);
              setDisplayName(event.displayName || null);
              setQrCode(null); // Clear QR code
              setIsConnecting(false);
              onConnected?.(event);
              break;

            case 'whatsapp_disconnected':
              console.log('❌ WhatsApp disconnected via real-time');
              setConnectionStatus('disconnected');
              setPhoneNumber(null);
              setDisplayName(null);
              setQrCode(null);
              setIsConnecting(false);
              onDisconnected?.(event);
              break;

            case 'qr_code_updated':
              console.log('📱 QR code updated via real-time');
              setQrCode(event.qrCode || null);
              setConnectionStatus('waiting');
              setIsConnecting(false);
              onQRUpdated?.(event);
              break;

            case 'connection_attempt_started':
              console.log('🔄 Connection attempt started via real-time');
              setConnectionStatus('connecting');
              setIsConnecting(true);
              break;

            case 'connection_attempt_failed':
              console.log('❌ Connection attempt failed via real-time');
              setConnectionStatus('failed');
              setIsConnecting(false);
              setError(event.reason || 'Connection failed');
              onConnectionFailed?.(event);
              break;
          }
        });

        // Handle authentication
        socket.on('authenticated', () => {
          console.log('✅ Socket.io authenticated successfully');
        });

        socket.on('authentication_error', (error) => {
          console.error('❌ Socket.io authentication error:', error);
          setError('Authentication failed');
        });

        // Handle heartbeat/ping
        socket.on('pong', (latency) => {
          console.log('💓 Socket.io heartbeat:', latency, 'ms');
        });

      } catch (error) {
        console.error('❌ Error setting up Socket.io connection:', error);
        setError('Unable to connect to bot backend');
      }
    };

    connectSocket();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log('🧹 Cleaning up Socket.io connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      connectionKeyRef.current = '';
    };
      }, [botId, userId, getFirebaseToken, onConnected, onDisconnected, onQRUpdated, onConnectionFailed]);

  const triggerConnection = async () => {
    if (!socketRef.current || !isWebSocketConnected) {
      console.log('⚠️ Socket.io not connected, cannot trigger connection');
      return;
    }

    try {
      console.log('🚀 Triggering WhatsApp connection via Socket.io');
      socketRef.current.emit('trigger_whatsapp_connection', {
        botId,
        userId,
        timestamp: new Date().toISOString()
      });
      setIsConnecting(true);
      setConnectionStatus('connecting');
    } catch (error) {
      console.error('❌ Error triggering connection:', error);
      setError('Failed to trigger connection');
    }
  };

  const disconnect = async () => {
    if (!socketRef.current) {
      console.log('⚠️ Socket.io not connected, cannot disconnect');
      return;
    }

    try {
      console.log('🔌 Disconnecting WhatsApp via Socket.io');
      socketRef.current.emit('disconnect_whatsapp', {
        botId,
        userId,
        timestamp: new Date().toISOString()
      });
      setConnectionStatus('disconnected');
      setPhoneNumber(null);
      setDisplayName(null);
      setQrCode(null);
      setIsConnecting(false);
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
      setError('Failed to disconnect');
    }
  };

  return {
    connectionStatus,
    qrCode,
    phoneNumber,
    displayName,
    lastEvent,
    error,
    isConnecting,
    triggerConnection,
    disconnect,
    isWebSocketConnected
  };
} 