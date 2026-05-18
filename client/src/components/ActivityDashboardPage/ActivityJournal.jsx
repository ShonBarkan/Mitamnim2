import React, { useMemo } from 'react';
import { groupLogsByDate } from '../../utils/activityDateUtils';
import JournalDayGroup from './ActivityJournal/JournalDayGroup';
import FrontendLogger from '../../utils/logger';

/**
 * ActivityJournal Component - Renders a structured chronological training performance timeline.
 * Refactored to accept pre-filtered data arrays for absolute dashboard layout decoupling.
 * Implements the bright "Arctic Mirror" glassmorphism aesthetic with high-contrast structural line layers.
 */
const ActivityJournal = ({ logs = [], loading = false, isTrainerView = false }) => {

  // Process and group logs into historical date buckets for the timeline generator engine
  const groupedLogs = useMemo(() => {
    return groupLogsByDate(logs);
  }, [logs]);

  const dateKeys = useMemo(() => {
    const keys = Object.keys(groupedLogs);
    FrontendLogger.info('ACTIVITY_JOURNAL', `Timeline matrix parsed successfully. Compiled ${keys.length} logical daily activity clusters`);
    return keys;
  }, [groupedLogs]);

  // --- CASE A: RENDER LOADING SYNC STATE ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-in fade-in duration-500">
        <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] animate-pulse select-none">
          Retrieving Performance History...
        </p>
      </div>
    );
  }

  // --- CASE B: RENDER EMPTY FALLBACK JOURNAL STATE ---
  if (dateKeys.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 bg-white/20 backdrop-blur-md border-2 border-dashed border-white/60 rounded-[3rem] animate-in zoom-in-95 duration-500 text-center select-none">
        <div className="text-5xl mb-4 opacity-30">📜</div>
        <p className="text-base font-black text-zinc-600 tracking-tight">
          טרם תועדו ביצועים התואמים את סינוני החיפוש הנוכחיים.
        </p>
        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-2 font-mono">
          Awaiting physical data input to generate timeline
        </p>
      </div>
    );
  }

  // --- CASE C: RENDER CHRONOLOGICAL JOURNAL TIMELINE ---
  return (
    <div className="flex flex-col gap-10 font-sans" dir="rtl">
      
      {/* Journal Dynamic Dashboard Header Tracker */}
      <header className="flex items-center gap-4 mb-2 px-2">
        <div className={`w-3 h-3 rounded-full shadow-sm shrink-0 ${isTrainerView ? 'bg-blue-600 animate-pulse' : 'bg-zinc-900'}`} />
        <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase m-0 leading-none">
          {isTrainerView ? "יומן ביצועי קבוצה גלובלי" : "היסטוריית הביצועים האישית שלי"}
        </h3>
        <div className="h-px flex-1 bg-gradient-to-l from-white/80 to-transparent mr-4 opacity-50" />
      </header>
      
      {/* Threaded Chronological Daily Activity Buckets Container */}
      <div className="space-y-6 pr-1">
        {dateKeys.map((dateLabel) => (
          <JournalDayGroup 
            key={dateLabel} 
            dateLabel={dateLabel} 
            logs={groupedLogs[dateLabel]} 
            isTrainerView={isTrainerView}
          />
        ))}
      </div>

      {/* Corporate Dashboard Footnote Technical Layer Details */}
      <footer className="mt-12 py-6 border-t border-white/40 flex justify-center opacity-60 select-none">
         <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.4em] italic font-mono leading-none">
            Mitamnim Suite • Performance Architecture Systems
         </p>
      </footer>
    </div>
  );
};

export default ActivityJournal;