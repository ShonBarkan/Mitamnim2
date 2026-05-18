import React from 'react';

/**
 * AnalyticsSidebar Component - Segregates trainee focus nodes inside management suite layouts.
 */
const AnalyticsSidebar = ({ isTrainer, users = [], selectedTraineeId, onTraineeSwitch }) => {
  if (!isTrainer) return null;

  const trainees = users.filter(u => u.role === 'trainee');

  return (
    <aside className="sticky top-0 h-screen w-80 bg-white/40 backdrop-blur-3xl border-l border-white/60 shadow-2xl flex flex-col z-40 shrink-0">
      <div className="p-8 space-y-8 flex-1 overflow-hidden flex flex-col">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mr-1 select-none">
          Select Analytics Focus
        </h2>
        
        <div className="space-y-2.5 overflow-y-auto flex-1 pr-1 pl-2 scrollbar-hide">
          {/* Collective Squa Overview Controller Node Button */}
          <button
            type="button"
            onClick={() => onTraineeSwitch(null)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 active:scale-[0.98] ${
              !selectedTraineeId
                ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/20' 
                : 'text-zinc-500 hover:bg-white/60 hover:text-zinc-900'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-lg select-none">📊</div>
            <span className="font-black text-sm uppercase tracking-tight">נתוני קבוצה גלובליים</span>
          </button>

          <div className="h-px bg-white/80 my-4" />

          {/* Standalone Individual Trainees Block Grid Maps */}
          {trainees.map(trainee => (
            <button
              key={trainee.id}
              type="button"
              onClick={() => onTraineeSwitch(trainee.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 active:scale-[0.98] group ${
                selectedTraineeId === trainee.id 
                  ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/30' 
                  : 'text-zinc-500 hover:bg-white/60 hover:text-zinc-900'
              }`}
            >
              <div className="shrink-0">
                {trainee.profile_picture ? (
                  <img 
                    src={trainee.profile_picture} 
                    className={`w-11 h-11 rounded-xl object-cover border-2 transition-all ${
                      selectedTraineeId === trainee.id ? 'border-blue-400' : 'border-white'
                    }`} 
                    alt="" 
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-white border border-zinc-100 text-zinc-700 flex items-center justify-center text-xs font-black uppercase font-mono shadow-sm">
                    {trainee.first_name?.[0] || '?'}
                  </div>
                )}
              </div>
              <div className="text-right min-w-0">
                <p className="text-sm font-black tracking-tight leading-none truncate">{trainee.first_name} {trainee.second_name}</p>
                <p className="text-[9px] font-black opacity-40 uppercase tracking-widest mt-1.5 font-mono">@{trainee.username}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      <div className="p-8 border-t border-white/40 mt-auto">
        <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.3em] select-none pointer-events-none">Analytics Hub Suite v2</p>
      </div>
    </aside>
  );
};

export default AnalyticsSidebar;