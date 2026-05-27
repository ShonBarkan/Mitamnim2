import React, { useState } from 'react';
import { Dumbbell, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

const OverviewCards = ({ stats, formatNumber, isTrainerMode, userAvatarMap }) => {
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isDurationOpen, setIsDurationOpen] = useState(false);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="relative overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl shadow-xl flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />

        <div className="relative p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-zinc-400 mb-2">סה״כ אימונים</div>
              <div className="text-5xl font-black">
                {formatNumber(stats?.total_sessions || 0)}
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center">
              <Dumbbell className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        {isTrainerMode && stats?.breakdown && stats.breakdown.length > 0 && (
          <div className="relative mt-auto border-t border-zinc-800/50 bg-zinc-900/50">
            <button 
              onClick={() => setIsSessionsOpen(!isSessionsOpen)}
              className="w-full px-6 py-3 flex items-center justify-between text-zinc-400 hover:text-white transition-colors"
            >
              <span className="font-bold text-sm">פירוט אימונים למתאמן</span>
              {isSessionsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {isSessionsOpen && (
              <div className="px-6 pb-6 pt-2 space-y-3">
                {stats.breakdown.map((user) => (
                  <div key={user.name} className="flex items-center justify-between bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50">
                    <div className="flex items-center gap-3">
                      {userAvatarMap?.[user.name] ? (
                        <img src={userAvatarMap[user.name]} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-zinc-700" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-bold text-sm text-white truncate max-w-[120px]">{user.name}</span>
                    </div>
                    <div className="font-black text-green-400">
                      {formatNumber(user.sessions)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900/70 backdrop-blur-xl shadow-xl flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none" />

        <div className="relative p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-zinc-400 mb-2">סה״כ דקות אימון</div>
              <div className="text-5xl font-black">
                {formatNumber(stats?.total_duration_minutes || 0)}
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-blue-500/15 flex items-center justify-center">
              <Calendar className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {isTrainerMode && stats?.breakdown && stats.breakdown.length > 0 && (
          <div className="relative mt-auto border-t border-zinc-800/50 bg-zinc-900/50">
            <button 
              onClick={() => setIsDurationOpen(!isDurationOpen)}
              className="w-full px-6 py-3 flex items-center justify-between text-zinc-400 hover:text-white transition-colors"
            >
              <span className="font-bold text-sm">פירוט דקות למתאמן</span>
              {isDurationOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {isDurationOpen && (
              <div className="px-6 pb-6 pt-2 space-y-3">
                {stats.breakdown.map((user) => (
                  <div key={user.name} className="flex items-center justify-between bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50">
                    <div className="flex items-center gap-3">
                      {userAvatarMap?.[user.name] ? (
                        <img src={userAvatarMap[user.name]} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-zinc-700" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-bold text-sm text-white truncate max-w-[120px]">{user.name}</span>
                    </div>
                    <div className="font-black text-blue-400">
                      {formatNumber(user.duration)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewCards;
