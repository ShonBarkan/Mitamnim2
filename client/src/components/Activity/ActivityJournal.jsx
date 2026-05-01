import React, { useEffect, useMemo } from 'react';
import { useActivity } from '../../hooks/useActivity';
import { groupLogsByDate } from '../../utils/activityDateUtils';
import JournalDayGroup from './JournalDayGroup';

/**
 * Main chronological journal component.
 * Features an Arctic Mirror aesthetic with fluid layouts and high-contrast headers.
 */
const ActivityJournal = ({ exerciseId, isTrainerView = false }) => {
  const { logs, loading, fetchLogs } = useActivity();

  useEffect(() => {
    if (exerciseId) {
      fetchLogs(exerciseId, isTrainerView);
    }
  }, [exerciseId, isTrainerView, fetchLogs]);

  const groupedLogs = useMemo(() => groupLogsByDate(logs), [logs]);
  const dateKeys = Object.keys(groupedLogs);

  // Loading State
  if (loading && logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
        <div className="w-12 h-12 border-4 border-zinc-100 border-t-zinc-900 rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">
          Retrieving History...
        </p>
      </div>
    );
  }

  // Empty State
  if (dateKeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 bg-zinc-50 border border-dashed border-zinc-200 rounded-[3rem] animate-in zoom-in-95 duration-500">
        <div className="text-3xl mb-4 opacity-20">📜</div>
        <p className="text-sm font-bold text-zinc-500 italic text-center">
          טרם תועדו ביצועים לתרגיל זה.
        </p>
        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-2">
          Start training to see logs
        </p>
      </div>
    );
  }

  return (
    <div className="activity-journal flex flex-col gap-10 font-sans" dir="rtl">
      
      {/* Journal Header */}
      <header className="flex items-center gap-4 mb-2 px-2">
        <div className={`w-3 h-3 rounded-full ${isTrainerView ? 'bg-blue-600' : 'bg-zinc-900'}`} />
        <h3 className="text-2xl font-black text-zinc-900 tracking-tighter">
          {isTrainerView ? "יומן ביצועי קבוצה" : "היסטוריית הביצועים שלי"}
        </h3>
        <div className="h-px flex-1 bg-gradient-to-l from-zinc-100 to-transparent mr-4" />
      </header>
      
      {/* Scrollable Timeline Content */}
      <div className="space-y-4 pr-2">
        {dateKeys.map((dateLabel) => (
          <JournalDayGroup 
            key={dateLabel} 
            dateLabel={dateLabel} 
            logs={groupedLogs[dateLabel]} 
            isTrainerView={isTrainerView}
          />
        ))}
      </div>

      {/* Footer Branding/Status */}
      <footer className="mt-10 py-6 border-t border-zinc-50 flex justify-center">
         <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em]">
           Gingilla Farm • Performance Systems
         </p>
      </footer>
    </div>
  );
};

export default ActivityJournal;