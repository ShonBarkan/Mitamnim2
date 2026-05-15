import React, { useMemo } from 'react';
import { groupLogsByDate } from '../../utils/activityDateUtils';
import JournalDayGroup from './JournalDayGroup';

/**
 * ActivityJournal Component - Renders a chronological performance timeline.
 * Refactored to accept flexible pre-filtered logs for global dashboard integration.
 * Implements the "Arctic Mirror" glassmorphism aesthetic with high-contrast structural layers.
 */
const ActivityJournal = ({ logs = [], loading = false, isTrainerView = false }) => {

  // Process and group logs into date buckets for the timeline engine
  const groupedLogs = useMemo(() => groupLogsByDate(logs), [logs]);
  const dateKeys = useMemo(() => Object.keys(groupedLogs), [groupedLogs]);

  // --- RENDER LOADING STATE ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-in fade-in duration-500">
        <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] animate-pulse">
          Retrieving Performance History...
        </p>
      </div>
    );
  }

  // --- RENDER EMPTY STATE ---
  if (dateKeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 bg-white/20 backdrop-blur-md border-2 border-dashed border-white/60 rounded-[3rem] animate-in zoom-in-95 duration-500 text-center">
        <div className="text-5xl mb-4 opacity-30">📜</div>
        <p className="text-base font-black text-zinc-600 tracking-tight">
          טרם תועדו ביצועים התואמים את סינוני החיפוש הנוכחיים.
        </p>
        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-2">
          Awaiting physical data input to generate timeline
        </p>
      </div>
    );
  }

  // --- RENDER TIMELINE JOURNAL ---
  return (
    <div className="flex flex-col gap-10 font-sans" dir="rtl">
      
      {/* Journal Dynamic Dashboard Header */}
      <header className="flex items-center gap-4 mb-2 px-2">
        <div className={`w-3 h-3 rounded-full shadow-sm ${isTrainerView ? 'bg-blue-500 animate-pulse' : 'bg-zinc-900'}`} />
        <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">
          {isTrainerView ? "יומן ביצועי קבוצה גלובלי" : "היסטוריית הביצועים האישית שלי"}
        </h3>
        <div className="h-px flex-1 bg-gradient-to-l from-white/80 to-transparent mr-4" />
      </header>
      
      {/* Threaded Chronological Container */}
      <div className="space-y-6 pr-2">
        {dateKeys.map((dateLabel) => (
          <JournalDayGroup 
            key={dateLabel} 
            dateLabel={dateLabel} 
            logs={groupedLogs[dateLabel]} 
            isTrainerView={isTrainerView}
          />
        ))}
      </div>

      {/* Corporate Dashboard Footnote Details */}
      <footer className="mt-12 py-6 border-t border-white/40 flex justify-center">
         <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.4em]">
           Mitamnim Suite • Performance Architecture Systems
         </p>
      </footer>
    </div>
  );
};

export default ActivityJournal;