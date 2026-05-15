import React from 'react';
import ActivityLogItem from './ActivityLogItem';

/**
 * JournalDayGroup Component - Groups logs by date in a high-end timeline layout.
 * Optimized for the Arctic Mirror aesthetic with floating glass badges and blurs.
 */
const JournalDayGroup = ({ dateLabel, logs, isTrainerView }) => {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="relative pb-12 font-sans" dir="rtl">
      
      {/* Arctic Mirror Sticky Date Badge */}
      <div className="sticky top-6 z-20 mb-10 mr-2 flex">
        <div className="inline-flex items-center gap-4 bg-white/40 backdrop-blur-2xl px-6 py-3 rounded-[1.5rem] shadow-2xl shadow-zinc-200/50 border border-white/80 group transition-all">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-[10px] shadow-lg">
            📅
          </div>
          <span className="text-sm font-black tracking-tight text-zinc-900 uppercase">
            {dateLabel}
          </span>
        </div>
      </div>

      {/* Glassmorphism Timeline Axis */}
      <div className="absolute top-0 bottom-0 right-[34px] w-1 bg-gradient-to-b from-white/60 via-zinc-200/40 to-transparent backdrop-blur-sm" />

      {/* Logs Collection */}
      <div className="space-y-8 pr-16">
        {logs.map((log, index) => {
          const isNewGroup = index === 0 || logs[index - 1].workout_session_id !== log.workout_session_id;

          return (
            <React.Fragment key={log.id}>
              {/* Session / Context Header */}
              {isNewGroup && (
                <div className="relative flex items-center gap-4 mb-6 mt-10 animate-in fade-in slide-in-from-right-6 duration-700">
                  {/* Glowing Timeline Indicator Point */}
                  <div className="absolute -right-[36px] w-5 h-5 rounded-full bg-white border-[3px] border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] z-10 transition-transform hover:scale-125" />
                  
                  <div className="flex items-center gap-3 bg-blue-500/5 backdrop-blur-md border border-blue-500/10 px-5 py-2.5 rounded-2xl shadow-inner">
                    <span className="text-lg">
                      {log.workout_session_id ? "🏋️" : "📝"}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">
                        {log.workout_session_id ? "Workout Session" : "Single Log Entry"}
                      </span>
                      <span className="text-sm font-black text-zinc-900 tracking-tighter">
                        {log.workout_session_id 
                          ? `${log.workout_session_name ?? "Personal Workout"}` 
                          : "Manual Log"
                        }
                      </span>
                    </div>
                    {log.workout_session_id && (
                      <span className="text-[9px] font-bold text-zinc-300 mr-2 bg-zinc-100 px-2 py-0.5 rounded-md">
                        ID: {log.workout_session_id}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Individual Log Entry with Arctic Mirror Card (Inside ActivityLogItem) */}
              <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                 <ActivityLogItem 
                    log={log} 
                    isTrainerView={isTrainerView} 
                  />
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default JournalDayGroup;