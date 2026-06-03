import React from 'react';
import { useLoading } from '../../contexts/LoadingContext';

// Global loader overlay component. Styled with Tailwind and a fade transition.
const GlobalLoader = () => {
  const { isLoading } = useLoading();

  return (
    <div
      aria-hidden={!isLoading}
      className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${isLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative p-6 rounded-xl bg-white/5 border border-white/10 shadow-2xl flex items-center gap-4">
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin border-white/70" />
        <div className="text-white font-bold">טוען...</div>
      </div>
    </div>
  );
};

export default GlobalLoader;
