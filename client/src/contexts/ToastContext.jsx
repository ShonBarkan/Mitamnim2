import React, { createContext, useState, useCallback } from 'react';

export const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Function to add a toast and remove it after 3 seconds
  const showToast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Basic Toast Container - Fixed to the screen */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        direction: 'rtl' // RTL for Hebrew support
      }}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{
            padding: '10px 20px',
            backgroundColor: toast.type === 'error' ? '#ffcccc' : '#ccffcc',
            border: '1px solid black',
            borderRadius: '5px',
            boxShadow: '2px 2px 5px rgba(0,0,0,0.2)'
          }}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};