import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  /**
   * Initialize auth state by fetching the current user if a token exists
   */
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const response = await authService.getCurrentUser();
          // Ensure we get the raw user data even if response is an Axios object
          const userData = response.data || response;
          setUser(userData);
        } catch (error) {
          console.error("Auth initialization failed:", error);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  /**
   * Authenticate user and store the token
   */
  const login = async (username, password) => {
    const response = await authService.login(username, password);
    const data = response.data || response;
    
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    // User details will be fetched by the useEffect hook watching the token
  };

  /**
   * Clear auth session and local storage
   */
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    /**
     * FIXED: Added 'setUser' to the context value so it can be 
     * accessed by components like PersonalInfo.
     */
    <AuthContext.Provider value={{ user, setUser, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};