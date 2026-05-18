import React, { useState, useContext } from 'react';
import { ActivityContext } from '../../../contexts/ActivityContext';
import { formatTime } from '../../../utils/activityDateUtils';
import ActivityLogEditModal from './ActivityLogItem/ActivityLogEditModal';
import FrontendLogger from '../../../utils/logger';

/**
 * ActivityLogItem Component - Displays a single concrete historical exercise performance node.
 * Adheres strictly to the premium Arctic Mirror glassmorphic design parameters.
 * Nested firmly under components/ActivityDashboardPage/ActivityJournal/ workspace layer.
 */
const ActivityLogItem = ({ log, isTrainerView = false }) => {
  const { removeLog } = useContext(ActivityContext);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = () => {
    FrontendLogger.warn('ACTIVITY_LOG_ITEM', `Athlete initiated deletion workflow sequence on log node entry ID: ${log.id}`);
    if (window.confirm('האם אתה בטוח שברצונך למחוק את תיעוד התרגיל הזה מיומן הפעילות?')) {
      removeLog(log.id);
    }
  };

  const handleEditOpen = () => {
    FrontendLogger.info('ACTIVITY_LOG_ITEM', `Launching modification wizard portal overlay for log node entity ID: ${log.id}`);
    setIsEditModalOpen(true);
  };

  const performanceDataList = log.performance_data || [];

  return (
    <div className="group relative bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-200/50 hover:bg-white/60 font-sans" dir="rtl">
      
      {/* Upper Section: Timestamp, Title, User Context and Actions Management Suite */}
      <div className="flex justify-between items-start gap-4 mb-6">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black text-blue-600 bg-blue-600/5 border border-blue-500/10 px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-inner font-mono select-none">
              {formatTime(log.timestamp)}
            </span>
            <h5 className="text-lg font-black text-zinc-900 tracking-tighter uppercase m-0 leading-tight">
              {log.exercise_name}
            </h5>
          </div>
          
          {isTrainerView && log.user_full_name && (
            <div className="flex items-center gap-2 mt-1 px-1 opacity-60 select-none">
              <span className="text-xs">👤</span>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                {log.user_full_name}
              </span>
            </div>
          )}
        </div>

        {/* Premium Floating Actions Bundle - Revealed cleanly during interaction hover windows */}
        {!isTrainerView && (
          <div className="flex gap-2 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 shrink-0">
            <button 
              type="button"
              onClick={handleEditOpen}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/80 border border-white shadow-sm text-zinc-400 hover:text-zinc-900 hover:scale-105 transition-all active:scale-95"
              title="ערוך תיעוד"
            >
              <span className="text-sm select-none">✎</span>
            </button>
            <button 
              type="button"
              onClick={handleDelete}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white hover:scale-105 transition-all shadow-sm active:scale-95"
              title="מחק תיעוד"
            >
              <span className="text-sm select-none">🗑</span>
            </button>
          </div>
        )}
      </div>

      {/* Performance Parameters Visual Chip Grid */}
      <div className="flex flex-wrap gap-2.5">
        {performanceDataList.map((param, index) => (
          <div 
            key={`${param.parameter_id || index}-${index}`}
            className="flex items-baseline gap-2 bg-white/70 backdrop-blur-md border border-white/90 px-4 py-2 rounded-xl shadow-sm hover:bg-white hover:scale-[1.02] transition-all duration-300"
          >
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider select-none">
              {param.parameter_name}
            </span>
            <span className="text-base font-black text-zinc-900 tracking-tight font-mono">
              {param.value}
            </span>
            {param.unit && (
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-tight select-none">
                {param.unit}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Edit Form Lifecycle Modal Portal Gateway Component */}
      {isEditModalOpen && (
        <ActivityLogEditModal 
          log={log} 
          onClose={() => setIsEditModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default ActivityLogItem;