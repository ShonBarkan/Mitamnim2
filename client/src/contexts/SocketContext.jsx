import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Only attempt connection if we have a valid token/user and no existing socket
    if (token && user && !socket) {
      const wsUrl = import.meta.env.VITE_WS_URL || `ws://localhost:8000/ws`;
      const ws = new WebSocket(`${wsUrl}?token=${token}`);

      ws.onopen = () => {
        console.log("WebSocket connected ✅");
        setSocket(ws);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected ❌");
        setSocket(null);
      };

      ws.onerror = (error) => {
        console.error("WebSocket connection error:", error);
      };

      // Cleanup: Close the socket instance properly when component unmounts
      // or when the authentication state changes
      return () => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      };
    }
    // 'socket' is intentionally omitted from dependencies to avoid reconnection cycles
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};