import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';
import FrontendLogger from '../utils/logger';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => { try { return localStorage.getItem('token'); } catch (e) { return null; } });
  const [loading, setLoading] = useState(true);

  /**
   * Initializes session validation tracking on application mount
   */
  useEffect(() => {
    const initAuth = async () => {
      try { if (token) {
        try {
          FrontendLogger.info('AUTH_CONTEXT', 'Recovering authenticated user session from local token footprint');
          const userData = await authService.getCurrentUser();
          setUser(userData);
          FrontendLogger.info('AUTH_CONTEXT', `Session successfully recovered for user: '${userData.username}'`);
        } catch (error) {
          FrontendLogger.error('AUTH_CONTEXT', 'Token footprint tracking state corrupted or expired. Evicting session parameters.', error);
          logout();
        }
      } else {
        FrontendLogger.info('AUTH_CONTEXT', 'No token identity discovered in storage context. Standing by for credential submission.');
      }
        } finally { setLoading(false); }
    };
    initAuth();
  }, [token]);

  /**
   * Dispatches network token authentication credentials
   */
  const login = async (username, password) => {
    try {
      FrontendLogger.info('AUTH_CONTEXT', `Initiating out-of-bounds validation login pipeline for user: '${username}'`);
      const data = await authService.login(username, password);
      
      try { localStorage.setItem('token', data.access_token); } catch (e) {}
      setToken(data.access_token);
      
      // Immediately pull fresh database model profile mappings to synchronize across layers
      FrontendLogger.info('AUTH_CONTEXT', 'Token validation confirmed. Pre-fetching fresh user profile context block');
      const userData = await authService.getCurrentUser();
      setUser(userData);
      
      return data;
    } catch (error) {
      FrontendLogger.error('AUTH_CONTEXT', `Authentication transaction sequence failed for user: '${username}'`, error);
      throw error;
    }
  };

  /**
   * Evicts token authentication blueprints and destroys active session context state memory
   */
  const logout = () => {
    FrontendLogger.warn('AUTH_CONTEXT', 'Destruction sequence triggered. Evicting active token allocations and profile memory blocks.');
    try { localStorage.removeItem('token'); } catch (e) {}
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook utility proxying contextual abstraction layers cleanly.
 * Must be consumed strictly within an active AuthProvider scope wrapper boundary.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be consumed strictly within an active AuthProvider scope wrapper boundary.');
  }
  return context;
};