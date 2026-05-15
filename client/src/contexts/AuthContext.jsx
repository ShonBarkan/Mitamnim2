import React, { createContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { initialData } from '../mock/mockData';

export const AuthContext = createContext();

// דגל לזיהוי סביבת פיתוח
const IS_DEV = process.env.NODE_ENV === 'development';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // פונקציית עזר לניהול ה-Mock DB בתוך ה-LocalStorage
  const getMockDb = useCallback(() => {
    const data = localStorage.getItem('mitamnim2_db');
    if (!data) {
      localStorage.setItem('mitamnim2_db', JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(data);
  }, []);

  /**
   * Initialize auth state
   */
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          if (IS_DEV) {
            // לוגיקת Mock: מוצאים את המשתמש ב-LocalStorage לפי ה-ID (הטוקן שלנו)
            const db = getMockDb();
            const foundUser = db.users.find(u => u.id === token);
            if (foundUser) {
              const { password, password_raw, ...safeUser } = foundUser;
              setUser(safeUser);
            } else {
              throw new Error("User not found in mock DB");
            }
          } else {
            // לוגיקת Prod: קריאה לסרביס האמיתי
            const response = await authService.getCurrentUser();
            const userData = response.data || response;
            setUser(userData);
          }
        } catch (error) {
          console.error("Auth initialization failed:", error);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [token, getMockDb]);

  /**
   * Login logic
   */
  const login = async (username, password) => {
    if (IS_DEV) {
      // סימולציית השהיה של שרת
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const db = getMockDb();
      const foundUser = db.users.find(u => u.username === username);

      // בדיקה מול password_raw כפי שביקשת
      if (foundUser && foundUser.password_raw === password) {
        const mockToken = foundUser.id; // ב-Mock נשתמש ב-ID כטוקן
        localStorage.setItem('token', mockToken);
        setToken(mockToken);
        return { access_token: mockToken };
      } else {
        throw new Error("Invalid username or password");
      }
    } else {
      // לוגיקת Prod: שימוש בסרביס ששולח FormData לשרת
      const response = await authService.login(username, password);
      const data = response.data || response;
      
      localStorage.setItem('token', data.access_token);
      setToken(data.access_token);
      return data;
    }
  };

  /**
   * Logout logic
   */
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};