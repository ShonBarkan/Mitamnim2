import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="rounded-3xl bg-zinc-900 border border-zinc-800 px-8 py-6 flex items-center gap-4 shadow-2xl">
        <Loader2 className="w-6 h-6 animate-spin text-green-400" />
        <div className="font-semibold">טוען נתוני אנליטיקות...</div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
