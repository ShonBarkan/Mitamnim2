import React from 'react';
import { Activity } from 'lucide-react';

const EmptyState = () => {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-16 text-center">
      <Activity className="mx-auto w-14 h-14 text-zinc-500 mb-5" />
      <h3 className="text-2xl font-bold mb-3">אין נתונים בטווח הזמן שנבחר</h3>
      <p className="text-zinc-400">נסה לבחור טווח תאריכים אחר</p>
    </div>
  );
};

export default EmptyState;
