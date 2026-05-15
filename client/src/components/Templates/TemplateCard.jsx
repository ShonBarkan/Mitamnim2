import React from 'react';

/**
 * TemplateCard Component - Displays a summary of a workout template.
 * Features the "Arctic Mirror" aesthetic with high-end Glassmorphism.
 */
const TemplateCard = ({ template, onEdit, onDelete, onStart, isTrainer }) => {
  const { name, description, expected_duration_time, exercises_config, scheduled_days } = template;
  const daysOfWeek = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  return (
    <div className="bg-white/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 p-8 shadow-xl shadow-zinc-200/50 flex flex-col gap-6 transition-all duration-300 hover:scale-[1.02] hover:bg-white/60 group" dir="rtl">
      
      {/* Header: Title and Duration */}
      <div className="flex justify-between items-start gap-4">
        <h3 className="text-xl font-black text-zinc-900 tracking-tighter uppercase leading-tight">
          {name}
        </h3>
        <div className="bg-zinc-900 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest flex-shrink-0">
          {expected_duration_time || '--'} MIN
        </div>
      </div>

      {/* Description Body */}
      <p className="text-zinc-500 font-medium text-sm leading-relaxed line-clamp-2 min-h-[40px]">
        {description || 'No description provided for this template.'}
      </p>

      {/* Meta Chips: Exercises count and Schedule */}
      <div className="flex flex-wrap gap-2 mt-auto">
        <div className="bg-white/50 border border-white px-4 py-1.5 rounded-full text-[10px] font-black text-zinc-400 uppercase tracking-widest">
          {exercises_config.length} Exercises
        </div>
        
        {scheduled_days?.length > 0 && (
          <div className="bg-blue-600/10 border border-blue-200 px-4 py-1.5 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-widest">
            Days: {scheduled_days.map(d => daysOfWeek[d]).join(', ')}
          </div>
        )}
      </div>

      {/* Action Suite */}
      <div className="flex gap-3 pt-4 border-t border-white/40">
        <button 
          onClick={() => onStart(template)}
          className="flex-[2] bg-emerald-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
        >
          🚀 Start Workout
        </button>

        {isTrainer && (
          <>
            <button 
              onClick={() => onEdit(template)}
              className="flex-1 bg-white/60 text-zinc-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/80 hover:bg-white transition-all active:scale-95"
            >
              Edit
            </button>
            <button 
              onClick={() => onDelete(template.id)}
              className="w-14 h-14 flex items-center justify-center bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TemplateCard;