import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * DashboardItem Component - Individual sortable rule card.
 * Implements the "Arctic Mirror" aesthetic with smooth DND transitions.
 */
const DashboardItem = ({ config, exercises, parameters, onUpdate, onRemove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...config });

  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({ id: config.id });

  // DND-kit transformation styles
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  // Find associated names for display
  const exercise = exercises.find(ex => ex.id === config.exercise_id);
  const exerciseName = exercise?.name || config.exercise_id;
  const parameterName = parameters.find(p => p.id === config.parameter_id)?.name || config.parameter_id;

  // Filter valid parameters for the current exercise for the edit dropdown
  const availableParams = exercise?.active_parameter_ids
    ?.map(pId => parameters.find(p => p.id === pId))
    .filter(Boolean) || [];

  /**
   * Persists changes to the stats context and exits edit mode.
   */
  const handleSave = () => {
    onUpdate(config.id, editData);
    setIsEditing(false);
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center gap-6 p-6 bg-white/40 backdrop-blur-2xl border rounded-[2rem] transition-all duration-300 ${
        isDragging 
          ? 'border-zinc-900/20 shadow-2xl scale-[1.02] bg-white/60' 
          : 'border-white/60 shadow-sm hover:shadow-md'
      }`}
    >
      
      {/* Premium Drag Handle */}
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab p-2 text-zinc-300 hover:text-zinc-900 transition-colors active:cursor-grabbing"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
          <circle cx="9" cy="5" r="1" /> <circle cx="9" cy="12" r="1" /> <circle cx="9" cy="19" r="1" />
          <circle cx="15" cy="5" r="1" /> <circle cx="15" cy="12" r="1" /> <circle cx="15" cy="19" r="1" />
        </svg>
      </div>

      <div className="flex-1">
        {isEditing ? (
          <div className="flex flex-wrap gap-3">
            <select 
              className="text-xs font-bold bg-white/50 border border-white/40 rounded-xl p-2 outline-none focus:ring-4 focus:ring-zinc-900/5"
              value={editData.parameter_id}
              onChange={(e) => setEditData({ ...editData, parameter_id: parseInt(e.target.value) })}
            >
              {availableParams.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select 
              className="text-xs font-bold bg-white/50 border border-white/40 rounded-xl p-2 outline-none focus:ring-4 focus:ring-zinc-900/5"
              value={editData.ranking_direction}
              onChange={(e) => setEditData({ ...editData, ranking_direction: e.target.value })}
            >
              <option value="desc">DESC (גבוה מנצח)</option>
              <option value="asc">ASC (נמוך מנצח)</option>
            </select>
          </div>
        ) : (
          <div className="space-y-1">
            <h4 className="font-black text-zinc-900 text-lg tracking-tighter uppercase">{exerciseName}</h4>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md">
                 {parameterName}
               </span>
               <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                 • {config.ranking_direction === 'desc' ? 'High is Best' : 'Low is Best'}
               </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Suite */}
      <div className="flex items-center gap-3">
        {isEditing ? (
          <button 
            onClick={handleSave} 
            className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-90 transition-all"
          >
            Save
          </button>
        ) : (
          <button 
            onClick={() => setIsEditing(true)} 
            className="text-zinc-400 hover:text-zinc-900 text-[10px] font-black uppercase tracking-widest transition-colors px-2"
          >
            Edit
          </button>
        )}
        
        {/* Visibility Toggle */}
        <button 
          onClick={() => onUpdate(config.id, { is_public: !config.is_public })}
          title={config.is_public ? 'Public' : 'Private'}
          className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all active:scale-90 ${
            config.is_public 
              ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/10' 
              : 'bg-white/50 text-zinc-300 border border-white/40'
          }`}
        >
          {config.is_public ? '👁️' : '🕶️'}
        </button>

        {/* Delete Action */}
        <button 
          onClick={() => onRemove(config.id)} 
          className="w-10 h-10 flex items-center justify-center text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DashboardItem;