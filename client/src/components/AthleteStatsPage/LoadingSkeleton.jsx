import React from 'react';

const LoadingSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-28 rounded-3xl bg-zinc-800/60" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="h-36 rounded-3xl bg-zinc-800/60" />
      <div className="h-36 rounded-3xl bg-zinc-800/60" />
    </div>
    <div className="h-[420px] rounded-3xl bg-zinc-800/60" />
  </div>
);

export default LoadingSkeleton;
