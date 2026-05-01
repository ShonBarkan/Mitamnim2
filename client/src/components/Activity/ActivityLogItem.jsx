import React, { useState } from 'react';
import { useActivity } from '../../hooks/useActivity';
import { formatTime } from '../../utils/activityDateUtils';
import ActivityLogEditModal from './ActivityLogEditModal';

/**
 * Represents a single performance record in the journal.
 * High-contrast, minimalist design following the Arctic Mirror aesthetic.
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
    <div className="group relative bg-white border border-zinc-100 rounded-[1.5rem] p-5 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/40 hover:border-zinc-200 font-sans">
      
      {/* Upper Section: Time, Name and Actions */}
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
              {formatTime(log.timestamp)}
            </span>
            <h5 className="text-sm font-black text-zinc-900 tracking-tight">
              {log.exercise_name}
            </h5>
          </div>
          
          {isTrainerView && log.user_full_name && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-zinc-400">👤</span>
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight">
                {log.user_full_name}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons - Visible on hover for clean UI */}
        {!isTrainerView && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-50 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all"
              title="Edit"
            >
              <span className="text-xs">✎</span>
            </button>
            <button 
              onClick={handleDelete}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-rose-50 text-rose-300 hover:bg-rose-500 hover:text-white transition-all"
              title="Delete"
            >
              <span className="text-xs">🗑</span>
            </button>
          </div>
        )}
      </div>

      {/* Performance Data Grid */}
      <div className="flex flex-wrap gap-2">
        {log.performance_data.map((param, index) => (
          <div 
            key={index}
            className="flex items-baseline gap-1.5 bg-slate-50/50 border border-zinc-100 px-3 py-1.5 rounded-xl transition-colors hover:bg-white hover:border-zinc-200"
          >
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
              {param.parameter_name}
            </span>
            <span className="text-sm font-black text-zinc-900">
              {param.value}
            </span>
            <span className="text-[9px] font-black text-blue-500/70 uppercase">
              {param.unit}
            </span>
          </div>
        ))}
      </div>

      {/* Edit Modal Injection */}
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