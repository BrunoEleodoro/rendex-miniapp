import { useEffect, useState, useCallback, useRef } from 'react';

export interface RealTimeUpdate {
  type: 'connected' | 'heartbeat' | 'kyc_status_update' | 'payment_completed' | 'payment_failed' | 'payment_processing';
  timestamp: string;
  message?: string;
  kycStatus?: string;
  result?: string;
  status?: string;
  data?: any;
}

export interface UseRealTimeUpdatesOptions {
  userId: string;
  onUpdate?: (update: RealTimeUpdate) => void;
  onKYCUpdate?: (update: RealTimeUpdate) => void;
  onPaymentUpdate?: (update: RealTimeUpdate) => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

export function useRealTimeUpdates({
  userId,
  onUpdate,
  onKYCUpdate,
  onPaymentUpdate,
  autoReconnect = true,
  reconnectDelay = 3000
}: UseRealTimeUpdatesOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<RealTimeUpdate | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  console.log(`[useRealTimeUpdates] Initializing for user: ${userId}`);

  const disconnect = useCallback(() => {
    console.log(`[useRealTimeUpdates] Disconnecting SSE for user: ${userId}`);
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
  }, [userId]);

  const connect = useCallback(() => {
    // TEMPORARILY DISABLED for PIX2STABLE implementation
    console.log(`[useRealTimeUpdates] Real-time updates temporarily disabled for PIX2STABLE focus`);
    return;
    
    if (eventSourceRef.current) {
      console.log(`[useRealTimeUpdates] Already connected for user: ${userId}`);
      return;
    }

    console.log(`[useRealTimeUpdates] Connecting to SSE for user: ${userId}`);
    setConnectionError(null);

    try {
      const eventSource = new EventSource(`/api/avenia/events/${userId}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log(`[useRealTimeUpdates] SSE connection opened for user: ${userId}`);
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const update: RealTimeUpdate = JSON.parse(event.data);
          console.log(`[useRealTimeUpdates] Received update for user: ${userId}`, update);
          
          setLastUpdate(update);
          
          // Call general update handler
          onUpdate?.(update);
          
          // Call specific handlers based on update type
          if (update.type === 'kyc_status_update') {
            console.log(`[useRealTimeUpdates] KYC status update - Status: ${update.kycStatus}, Result: ${update.result}`);
            onKYCUpdate?.(update);
          } else if (update.type.includes('payment_')) {
            console.log(`[useRealTimeUpdates] Payment update - Type: ${update.type}, Status: ${update.status}`);
            onPaymentUpdate?.(update);
          }
        } catch (error) {
          console.error(`[useRealTimeUpdates] Failed to parse SSE message for user: ${userId}`, error);
        }
      };

      eventSource.onerror = (error) => {
        console.error(`[useRealTimeUpdates] SSE connection error for user: ${userId}`, error);
        setIsConnected(false);
        setConnectionError('Connection lost');
        
        eventSource.close();
        eventSourceRef.current = null;
        
        // Auto-reconnect if enabled
        if (autoReconnect && reconnectAttemptsRef.current < 5) {
          reconnectAttemptsRef.current++;
          console.log(`[useRealTimeUpdates] Attempting to reconnect (${reconnectAttemptsRef.current}/5) for user: ${userId}`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay * reconnectAttemptsRef.current);
        } else {
          console.log(`[useRealTimeUpdates] Max reconnection attempts reached for user: ${userId}`);
          setConnectionError('Failed to reconnect');
        }
      };
    } catch (error) {
      console.error(`[useRealTimeUpdates] Failed to create SSE connection for user: ${userId}`, error);
      setConnectionError('Failed to connect');
    }
  }, [userId, onUpdate, onKYCUpdate, onPaymentUpdate, autoReconnect, reconnectDelay]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log(`[useRealTimeUpdates] Manual reconnect requested for user: ${userId}`);
    disconnect();
    setTimeout(connect, 1000);
  }, [connect, disconnect, userId]);

  return {
    isConnected,
    lastUpdate,
    connectionError,
    reconnect,
    disconnect
  };
}