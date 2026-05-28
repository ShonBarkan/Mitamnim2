import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AuthContext } from './AuthContext';
import FrontendLogger from '../utils/logger';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const reconnectTimeoutRef = useRef(null);
  const socketRef = useRef(null); 
  const isMounted = useRef(true); 

  const connect = useCallback(() => {
    // Only attempt connection if we have a valid session context footprint
    if (!token || !user) {
      FrontendLogger.warn('SOCKET_CONTEXT', 'Aborting connection sequence: Missing authenticated session credentials');
      return;
    }

    // Clean up any pending reconnection timers
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Close any existing socket before opening a new one to prevent link leakage
    if (socketRef.current) {
      FrontendLogger.info('SOCKET_CONTEXT', 'Evicting active stale socket instance before spawning new link handshake');
      socketRef.current.close();
    }

    const wsUrl = import.meta.env.VITE_WS_URL;
    if (!wsUrl) {
      FrontendLogger.error('SOCKET_CONTEXT', 'Missing critical target configuration parameter: VITE_WS_URL environment definition is missing');
      return;
    }

    FrontendLogger.socket(`Establishing communication layer handshake link to: ${wsUrl}`);
    const ws = new WebSocket(`${wsUrl}?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => {
      if (!isMounted.current) return;
      FrontendLogger.socket('WebSocket data pipeline link established and verified successfully');
      setSocket(ws);
      setIsConnected(true);
    };

    ws.onclose = (e) => {
      if (!isMounted.current) return;
      
      FrontendLogger.warn('SOCKET_CONTEXT', `WebSocket pipeline link severed. [Code: ${e.code}] [Reason: ${e.reason || 'unspecified'}]`);
      setSocket(null);
      setIsConnected(false);
      socketRef.current = null;

      /**
       * Automatic Reconnection Logic Engine:
       * 1. Only reconnect if the user credentials footprint is still valid.
       * 2. Do not reconnect if the closure sequence was intentional (Code 1000).
       * 3. Deploys a 3-second throttle window to prevent infinite request looping faults.
       */
      if (token && user && e.code !== 1000) {
        FrontendLogger.info('SOCKET_CONTEXT', 'Initiating automated socket link reconnection countdown sequence (3000ms delay)');
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000); 
      }
    };

    ws.onerror = (error) => {
      FrontendLogger.error('SOCKET_CONTEXT', 'WebSocket operational exception caught over data link stream layer', error);
    };

  }, [token, user]);

  useEffect(() => {
    isMounted.current = true;

    if (token && user) {
      connect();
    } else {
      // Complete cleanup on logout event
      setIsConnected(false);
      setSocket(null);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        FrontendLogger.info('SOCKET_CONTEXT', 'Terminating live socket pipelines due to explicit user session eviction');
        socketRef.current.close();
      }
    }

    return () => {
      isMounted.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        // Prevent the cleanup-close from triggering an accidental reconnect loop sequence
        socketRef.current.onclose = null; 
        socketRef.current.close();
      }
    };
  }, [token, user, connect]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

/**
 * Custom hook utility proxying contextual abstraction layers cleanly.
 * Must be consumed strictly within an active SocketProvider scope wrapper boundary.
 */
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be consumed strictly within an active SocketProvider scope wrapper boundary.');
  }
  return context;
};

export default SocketProvider;