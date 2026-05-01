import React from 'react';
import ActivityLogItem from './ActivityLogItem';

/**
 * Groups activity logs for a specific day with a modern timeline aesthetic.
 */
const JournalDayGroup = ({ dateLabel, logs, isTrainerView }) => {
  if (!logs || logs.length === 0) return null;

  return (
    <div className="journal-day-group relative pb-10 font-sans" dir="rtl">
      
      {/* Sticky Date Badge */}
      <div className="sticky top-4 z-20 mb-8 mr-2">
        <div className="inline-flex items-center gap-3 bg-zinc-900 text-white px-5 py-2.5 rounded-2xl shadow-xl shadow-zinc-200 border border-zinc-800">
          <span className="text-[10px] opacity-50">📅</span>
          <span className="text-xs font-black tracking-tight">{dateLabel}</span>
        </div>
      </div>

      {/* Timeline Vertical Line */}
      <div className="absolute top-0 bottom-0 right-[26px] w-px bg-gradient-to-b from-zinc-200 via-zinc-100 to-transparent" />

      {/* Logs List Container */}
      <div className="space-y-6 pr-12">
        {logs.map((log, index) => {
          const isNewGroup = index === 0 || logs[index - 1].workout_session_id !== log.workout_session_id;

          return (
            <React.Fragment key={log.id}>
              {isNewGroup && (
                <div className="relative flex items-center gap-4 mb-4 mt-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  {/* Timeline Indicator Point */}
                  <div className="absolute -right-[24px] w-3 h-3 rounded-full bg-white border-2 border-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)] z-10" />
                  
                  <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-100 px-3 py-1.5 rounded-xl">
                    <span className="text-sm">
                      {log.workout_session_id ? "🏋️" : "📝"}
                    </span>
                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                      {log.workout_session_id 
                        ? `${log.workout_session_name ?? "אימון אישי"}` 
                        : "תיעוד בודד"
                      }
                    </span>
                    {log.workout_session_id && (
                      <span className="text-[9px] font-bold text-blue-300 mr-1">#{log.workout_session_id}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Log Item with specific timeline spacing */}
              <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-300">
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