import React from 'react';
import { Dumbbell, Calendar } from 'lucide-react';

const OverviewCards = ({ stats, formatNumber }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="relative overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-6 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />

        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-zinc-400 mb-2">סה״כ אימונים</div>

              <div className="text-5xl font-black">
                {formatNumber(stats.total_sessions || 0)}
              </div>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl p-6 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />

        <div className="relative">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-zinc-400 mb-2">סה״כ דקות אימון</div>

              <div className="text-5xl font-black">
                {formatNumber(stats.total_duration_minutes || 0)}
              </div>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-blue-500/15 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewCards;
