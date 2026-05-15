import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

const IS_DEV = process.env.NODE_ENV === 'development';

export const SocketProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const reconnectTimeoutRef = useRef(null);
  const socketRef = useRef(null); 
  const isMounted = useRef(true); 

  const connect = useCallback(() => {
    // Skip WebSocket connection in Dev mode to avoid errors without a local server
    if (IS_DEV) {
      console.log("SocketContext: Dev mode detected. WebSocket connection skipped.");
      setIsConnected(true); // Mocking connection status for UI consistency
      return;
    }

    // Only attempt connection if we have a valid session
    if (!token || !user) return;

    // Clean up any pending reconnection timers
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    // Close any existing socket before opening a new one
    if (socketRef.current) {
      socketRef.current.close();
    }

    const wsUrl = import.meta.env.VITE_WS_URL || `ws://localhost:8000/ws`;
    const ws = new WebSocket(`${wsUrl}?token=${token}`);
    socketRef.current = ws;

    ws.onopen = () => {
      if (!isMounted.current) return;
      setSocket(ws);
      setIsConnected(true);
    };

    ws.onclose = (e) => {
      if (!isMounted.current) return;
      
      setSocket(null);
      setIsConnected(false);
      socketRef.current = null;

      /**
       * Reconnection Logic:
       * 1. Only reconnect if the user is still logged in.
       * 2. Do not reconnect if the closure was intentional (Code 1000).
       * 3. Added a 3-second delay to prevent aggressive looping.
       */
      if (token && user && e.code !== 1000) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000); 
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error observed:", error);
    };

  }, [token, user]);

  useEffect(() => {
    isMounted.current = true;

    if (token && user) {
      connect();
    } else {
      // Cleanup session data and connections on logout
      setIsConnected(false);
      setSocket(null);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    }

    return () => {
      isMounted.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        // Prevent the cleanup-close from triggering a reconnect loop
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