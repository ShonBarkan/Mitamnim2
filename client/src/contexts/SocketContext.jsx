import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Use a ref for the timeout to prevent memory leaks and multiple timers
  const reconnectTimeoutRef = useRef(null);
  const maxReconnectDelay = 5000;

  const connect = useCallback(() => {
    if (!token || !user) return;

    // Clear any existing reconnect timer
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const wsUrl = import.meta.env.VITE_WS_URL || `ws://localhost:8000/ws`;
    const ws = new WebSocket(`${wsUrl}?token=${token}`);

    ws.onopen = () => {
      console.log("WebSocket connected ✅");
      setSocket(ws);
      setIsConnected(true);
    };

    ws.onclose = (e) => {
      console.log(`WebSocket disconnected ❌ (Reason: ${e.code})`);
      setSocket(null);
      setIsConnected(false);

      // Attempt to reconnect after a delay if the user is still authenticated
      if (token && user) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Attempting to reconnect...");
          connect();
        }, Math.min(2000, maxReconnectDelay));
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      // Let onclose handle the reconnection logic
      ws.close();
    };

    return ws;
  }, [token, user]);

  useEffect(() => {
    let ws = null;

    if (token && user) {
      ws = connect();
    } else {
      // If user logs out, clear everything
      setIsConnected(false);
      setSocket(null);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    }

    return () => {
      if (ws) {
        // Remove the onclose listener before closing to prevent 
        // the cleanup-triggered close from firing a reconnect
        ws.onclose = null; 
        ws.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [token, user, connect]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};