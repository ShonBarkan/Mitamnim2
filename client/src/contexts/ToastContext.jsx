import React, { createContext, useState, useCallback, useContext } from 'react';
import FrontendLogger from '../utils/logger';

export const ToastContext = createContext();

// External bridge for non-React modules (e.g., API interceptors) to trigger toasts.
// This default is a no-op and will be registered by the ToastProvider at runtime.
export let externalShowToast = (message, type = 'info') => {};

export const registerExternalShowToast = (fn) => {
  externalShowToast = fn;
};

/**
 * Context provider for UI notifications.
 * Implements a high-contrast dark "Arctic Mirror" aesthetic (Glassmorphism) 
 * to ensure visibility against light application backgrounds.
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

  // Register the provider's showToast function to the external bridge so
  // non-React modules (like axios interceptors) can still surface notifications.
  registerExternalShowToast(showToast);

  // Layout positioning matrix
  const containerStyle = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    direction: 'rtl',
    pointerEvents: 'none' // Allows clicking through the empty space of the container
  };

  /**
   * Generates dynamic high-contrast glassmorphism styles based on the notification type.
   */
  const getToastStyle = (type) => {
    // Default (info) styling - Dark Zinc Glass
    let bg = 'rgba(24, 24, 27, 0.85)'; 
    let border = 'rgba(255, 255, 255, 0.15)';

    if (type === 'error') {
      // High-visibility Error Red Glass
      bg = 'rgba(220, 38, 38, 0.85)';
      border = 'rgba(248, 113, 113, 0.3)';
    } else if (type === 'success') {
      // High-visibility Success Emerald Glass
      bg = 'rgba(5, 150, 105, 0.85)';
      border = 'rgba(52, 211, 153, 0.3)';
    }

    return {
      padding: '14px 24px',
      background: bg,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: `1px solid ${border}`,
      borderRadius: '16px',
      color: '#ffffff',
      fontWeight: '700',
      fontSize: '14px',
      boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.4)',
      minWidth: '260px',
      maxWidth: '400px',
      textAlign: 'center',
      pointerEvents: 'auto', // Re-enables pointer events for the actual toast element
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    };
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      <div style={containerStyle}>
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            style={getToastStyle(toast.type)}
            className="animate-in slide-in-from-bottom-5 fade-in duration-300"
          >
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