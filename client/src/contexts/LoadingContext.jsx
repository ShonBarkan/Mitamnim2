import React, { createContext, useState, useContext } from 'react';

// LoadingContext provides a global `isLoading` flag and a setter.
export const LoadingContext = createContext();

// External bridge for non-React modules (e.g., axios interceptors) to toggle loading state.
// Default is a no-op until the provider registers the real setter.
export let setExternalLoading = (is) => {};

export const registerExternalLoading = (fn) => {
  setExternalLoading = fn;
};

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Register the internal setter to the external bridge for non-React callers.
  registerExternalLoading(setIsLoading);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const ctx = useContext(LoadingContext);
  if (!ctx) throw new Error('useLoading must be used within LoadingProvider');
  return ctx;
};

export default LoadingProvider;
