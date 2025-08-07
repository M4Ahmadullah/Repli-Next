'use client'

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUser } from '@clerk/nextjs';

export interface QRConnectionEvent {
  type: 'whatsapp_connected' | 'qr_code_updated' | 'connection_failed';
  botId: string;
  userId: string;
  phoneNumber?: string;
  displayName?: string;
  qrCode?: string;
  reason?: string;
  timestamp: string;
}

interface SimpleQRConnectionProps {
  botId: string;
  userId: string;
  isQRDisplayed: boolean; // Only connect when QR is being displayed
  onConnected?: (data: QRConnectionEvent) => void;
  onQRUpdated?: (data: QRConnectionEvent) => void;
  onConnectionFailed?: (data: QRConnectionEvent) => void;
}

export const useSimpleQRConnection = ({
  botId,
  userId,
  isQRDisplayed,
  onConnected,
  onQRUpdated,
  onConnectionFailed
}: SimpleQRConnectionProps) => {
  const socketRef = useRef<Socket | null>(null);
  const { user: clerkUser } = useUser();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'failed'>('disconnected');
  const tokenCacheRef = useRef<{ token: string; timestamp: number } | null>(null);
  const connectionAttemptRef = useRef<NodeJS.Timeout | null>(null);
  const connectionLockRef = useRef<boolean>(false);

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

  // Connect only when QR is being displayed
  useEffect(() => {
    // Don't connect if QR is not being displayed
    if (!isQRDisplayed) {
      console.log('⚠️ QR not displayed - skipping WebSocket connection');
      connectionLockRef.current = false; // Reset lock when QR not displayed
      return;
    }

    // Don't connect if botId or userId are empty
    if (!botId || !userId || botId === '' || userId === '') {
      console.log('⚠️ Skipping WebSocket connection - missing botId or userId:', { botId, userId });
      return;
    }

    // Don't connect if already connected
    if (socketRef.current?.connected) {
      console.log('⚠️ Already connected - skipping new connection');
      return;
    }

    // Don't connect if we're in a connected state (prevents reconnections)
    if (connectionStatus === 'connected') {
      console.log('⚠️ Already connected state - skipping new connection');
      return;
    }

    // Don't connect if connection is already in progress (connection lock)
    if (connectionLockRef.current) {
      console.log('⚠️ Connection already in progress - skipping new connection');
      return;
    }

    // Clear any existing connection attempt
    if (connectionAttemptRef.current) {
      clearTimeout(connectionAttemptRef.current);
    }

        // Debounce connection attempts to prevent rapid reconnections
    connectionAttemptRef.current = setTimeout(() => {
      console.log('🔍 Connecting to WebSocket for QR display');
      setConnectionStatus('connecting');
      connectionLockRef.current = true; // Set connection lock

      const connectSocket = async () => {
        try {
          const token = await getFirebaseToken();
          const wsUrl = process.env.NEXT_PUBLIC_BOT_WEBSOCKET_URL || 'ws://localhost:8000';
          
          console.log('🔌 Creating WebSocket connection for QR display');
          socketRef.current = io(wsUrl, {
            auth: { token: token },
            query: { botId: botId, userId: userId },
            timeout: 10000,
            reconnection: false, // No auto-reconnection
          });

          socketRef.current.on('connect', () => {
            console.log('✅ WebSocket connected for QR display');
            console.log('🔍 Socket connection details:', {
              socketId: socketRef.current?.id,
              connected: socketRef.current?.connected,
              transport: socketRef.current?.io?.engine?.transport?.name
            });
            setIsConnected(true);
            setConnectionStatus('connecting');
            connectionLockRef.current = false; // Release lock on successful connection
            
            // Start periodic HTTP status check as fallback (DISABLED to reduce requests)
            // const httpCheckInterval = setInterval(async () => {
            //   if (socketRef.current?.connected) {
            //     await checkConnectionStatusViaHTTP();
            //   } else {
            //     clearInterval(httpCheckInterval);
            //   }
            // }, 2000); // Check every 2 seconds
            
            // Store interval for cleanup
            if (socketRef.current) {
              socketRef.current.on('disconnect', (reason) => {
                console.log('🔌 WebSocket disconnected from frontend:', reason);
                // clearInterval(httpCheckInterval);
              });
            }
          });

          socketRef.current.on('disconnect', (reason) => {
            console.log('❌ WebSocket disconnected:', reason);
            console.log('🔍 Disconnect details:', {
              socketId: socketRef.current?.id,
              reason: reason,
              wasConnected: isConnected
            });
            setIsConnected(false);
            setConnectionStatus('disconnected');
          });

          socketRef.current.on('connect_error', (error) => {
            console.error('❌ WebSocket connection error:', error);
            setIsConnected(false);
            setConnectionStatus('failed');
            connectionLockRef.current = false; // Release lock on connection error
          });

          // Listen for WhatsApp connection events
          socketRef.current.on('whatsapp_connection_event', (event: QRConnectionEvent) => {
            console.log('📱 WhatsApp connection event received:', event);
            
            switch (event.type) {
              case 'whatsapp_connected':
                console.log('✅ WhatsApp connected - immediate success!');
                console.log('📊 Success event details:', {
                  phoneNumber: event.phoneNumber,
                  displayName: event.displayName,
                  timestamp: event.timestamp
                });
                setConnectionStatus('connected');
                if (onConnected) {
                  onConnected(event);
                }
                // Disconnect immediately after success
                if (socketRef.current) {
                  console.log('🔌 Disconnecting WebSocket after success');
                  socketRef.current.disconnect();
                  socketRef.current = null;
                }
                break;
                
              case 'qr_code_updated':
                console.log('📱 QR code updated');
                if (onQRUpdated) {
                  onQRUpdated(event);
                }
                break;
                
              case 'connection_failed':
                console.log('❌ Connection attempt failed');
                setConnectionStatus('failed');
                if (onConnectionFailed) {
                  onConnectionFailed(event);
                }
                break;
            }
          });

          // Add general event listener for debugging
          socketRef.current.onAny((eventName, ...args) => {
            console.log('🔍 WebSocket event received:', { eventName, args });
          });

        } catch (error) {
          console.error('❌ Error creating WebSocket connection:', error);
          setConnectionStatus('failed');
          setIsConnected(false);
          connectionLockRef.current = false; // Release lock on error
        }
      };

      connectSocket();
    }, 500); // 500ms debounce

    // Cleanup function
    return () => {
      console.log('🧹 Cleanup function called - checking if we should disconnect');
      console.log('🔍 Cleanup context:', {
        isQRDisplayed,
        botId,
        userId,
        socketExists: !!socketRef.current,
        socketConnected: socketRef.current?.connected
      });
      
      // Only disconnect if QR is no longer displayed or if we're changing to a different bot/user
      if (!isQRDisplayed || !botId || !userId) {
        if (socketRef.current) {
          console.log('🧹 Disconnecting WebSocket due to QR not displayed or missing params');
          socketRef.current.disconnect();
          socketRef.current = null;
        }
        setIsConnected(false);
        setConnectionStatus('disconnected');
        connectionLockRef.current = false; // Release lock on cleanup
      } else {
        console.log('🧹 Keeping WebSocket connection active - QR still displayed');
      }
    };
  }, [isQRDisplayed, botId, userId, getFirebaseToken]);

  // Manual trigger for WhatsApp connection
  const triggerConnection = useCallback(() => {
    if (socketRef.current?.connected) {
      console.log('🚀 Triggering WhatsApp connection');
      socketRef.current.emit('trigger_whatsapp_connection', {
        botId,
        userId,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('⚠️ Cannot trigger connection - WebSocket not connected');
    }
  }, [botId, userId]);

  // Fallback connection status check via HTTP
  const checkConnectionStatusViaHTTP = useCallback(async () => {
    try {
      console.log('🔍 Checking connection status via HTTP fallback');
      const response = await fetch(`/api/bots/${botId}/whatsapp/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 HTTP status check result:', data);
        
        if (data.connected && data.phoneNumber) {
          console.log('✅ Connection detected via HTTP - triggering success');
          const successEvent: QRConnectionEvent = {
            type: 'whatsapp_connected',
            botId,
            userId,
            phoneNumber: data.phoneNumber,
            displayName: data.displayName,
            timestamp: new Date().toISOString()
          };
          
          setConnectionStatus('connected');
          if (onConnected) {
            onConnected(successEvent);
          }
        }
      }
    } catch (error) {
      console.error('❌ HTTP status check failed:', error);
    }
  }, [botId, userId, onConnected]);

  // Manual disconnect
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('🔌 Manually disconnecting WebSocket');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  return {
    isConnected,
    connectionStatus,
    triggerConnection,
    disconnect,
    checkConnectionStatusViaHTTP
  };
}; 