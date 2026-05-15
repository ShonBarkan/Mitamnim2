import React, { useState } from 'react';
import { useActivity } from '../../hooks/useActivity';
import { formatTime } from '../../utils/activityDateUtils';
import ActivityLogEditModal from './ActivityLogEditModal';

/**
 * ActivityLogItem Component - Displays a single historical performance node.
 * Rewritten to adhere to the high-end Arctic Mirror design parameters.
 */
const ActivityLogItem = ({ log, isTrainerView }) => {
  const { removeLog } = useActivity();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = () => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את התיעוד הזה?')) {
      removeLog(log.id);
    }
  };

  return (
    <div className="group relative bg-white/40 backdrop-blur-2xl border border-white/60 rounded-[2rem] p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-zinc-200/50 hover:bg-white/60 font-sans" dir="rtl">
      
      {/* Upper Section: Timestamp, Title, User Context and Action Suite */}
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-inner">
              {formatTime(log.timestamp)}
            </span>
            <h5 className="text-lg font-black text-zinc-900 tracking-tighter uppercase">
              {log.exercise_name}
            </h5>
          </div>
          
          {isTrainerView && log.user_full_name && (
            <div className="flex items-center gap-2 mt-1 px-1">
              <span className="text-xs opacity-40">👤</span>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                {log.user_full_name}
              </span>
            </div>
          )}
        </div>

        {/* Premium Floating Actions Bundle - Revealed cleanly on hover */}
        {!isTrainerView && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/80 border border-white shadow-sm text-zinc-400 hover:text-zinc-900 hover:scale-105 transition-all"
              title="Edit Log"
            >
              <span className="text-sm">✎</span>
            </button>
            <button 
              onClick={handleDelete}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-400 hover:bg-rose-500 hover:text-white hover:scale-105 transition-all shadow-sm"
              title="Delete Log"
            >
              <span className="text-sm">🗑</span>
            </button>
          </div>
        )}
      </div>

      {/* Performance Parameters Data Grid */}
      <div className="flex flex-wrap gap-2.5">
        {log.performance_data.map((param, index) => (
          <div 
            key={index}
            className="flex items-baseline gap-2 bg-white/70 backdrop-blur-md border border-white/90 px-4 py-2 rounded-xl shadow-sm hover:bg-white hover:scale-[1.02] transition-all duration-300"
          >
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">
              {param.parameter_name}
            </span>
            <span className="text-base font-black text-zinc-900 tracking-tight">
              {param.value}
            </span>
            <span className="text-[9px] font-black text-blue-500 uppercase tracking-tight">
              {param.unit}
            </span>
          </div>
        ))}
      </div>

      {/* Edit Modal Lifecycle Injection */}
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