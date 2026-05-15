import React, { createContext, useState, useCallback } from 'react';

export const ToastContext = createContext();

/**
 * Context provider for UI notifications.
 * Implements the "Arctic Mirror" aesthetic (Glassmorphism).
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * Adds a toast and automatically removes it after 3 seconds.
   */
  const showToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // Arctic Mirror styles for Glassmorphism effect
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
      ? 'rgba(255, 100, 100, 0.2)' 
      : 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '12px',
    color: '#ffffff',
    fontWeight: '500',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    minWidth: '200px',
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