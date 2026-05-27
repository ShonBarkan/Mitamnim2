import React from 'react';
import { TrendingUp } from 'lucide-react';

const EmptySelectionState = () => {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-14 text-center">
      <TrendingUp className="mx-auto w-14 h-14 text-zinc-500 mb-5" />
      <h3 className="text-2xl font-bold">בחר תרגיל או פרמטר כדי להתחיל</h3>
    </div>
  );
};

export default EmptySelectionState;
