import React, { createContext, useState, useCallback, useContext } from 'react';
import FrontendLogger from '../utils/logger';

export const ToastContext = createContext();

/**
 * Context provider for UI notifications.
 * Implements the bright, transparent "Arctic Mirror" aesthetic (Glassmorphism).
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * Spawns an ephemeral visual alert overlay instance inside the client layout pool.
   */
  const showToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 11);
    
    FrontendLogger.info('TOAST_CONTEXT', `Spawning client notification layer event [Type: ${type}]`, { message });
    
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // Arctic Mirror styling matrix configurations
  const containerStyle = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    direction: 'rtl' 
  };

  const getToastStyle = (type) => ({
    padding: '12px 24px',
    background: type === 'error' 
      ? 'rgba(239, 68, 68, 0.25)' // Coral/Red tint matching Arctic Mirror translucent rules
      : 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: type === 'error'
      ? '1px solid rgba(239, 68, 68, 0.4)'
      : '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    color: '#ffffff',
    fontWeight: '500',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
    minWidth: '220px',
    textAlign: 'center'
  });

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      <div style={containerStyle}>
        {toasts.map((toast) => (
          <div key={toast.id} style={getToastStyle(toast.type)}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/**
 * Custom hook utility proxying contextual abstraction layers cleanly.
 * Must be consumed strictly within an active ToastProvider scope wrapper boundary.
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be consumed strictly within an active ToastProvider scope wrapper boundary.');
  }
  return context;
};

export default ToastProvider;