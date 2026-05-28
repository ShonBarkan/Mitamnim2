import React from 'react';
import { User as UserIcon } from 'lucide-react';

const TrainerChartTooltip = ({ active, payload, label, userAvatarMap, unit }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl shadow-xl" dir="rtl">
        <p className="text-zinc-400 mb-3 font-bold">{label}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => {
            const userName = entry.dataKey;
            const avatarUrl = userAvatarMap?.[userName];
            
            return (
              <div key={`item-${index}`} className="flex items-center gap-3">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={userName} className="w-6 h-6 rounded-full object-cover border border-zinc-700" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                    {userName?.charAt(0) || <UserIcon className="w-3 h-3" />}
                  </div>
                )}
                <span style={{ color: entry.color }} className="font-bold text-sm">
                  {userName}: {entry.value} {unit}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

export default TrainerChartTooltip;