import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * WorkoutCard Component - Visualizes specific training routine layout summaries.
 * Styled with premium bright "Arctic Mirror" glassmorphism variables.
 * Enforces strict English-only code commentary and total Hebrew UI localization.
 */
const WorkoutCard = ({ template, onDelete, onStart, isTrainer }) => {
  const navigate = useNavigate();
  const { id, name, description, expected_duration_time, template_exercises, scheduled_days } = template;
  const daysOfWeek = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  const exercises = template_exercises || [];

  /**
   * Routes the user to the central architecture studio view, passing the complete 
   * template record entity framework state down via the router state context metadata channel.
   */
  const handleEditRedirect = () => {
    navigate('/create-workout-templates', { state: { template } });
  };

  return (
    <div className="bg-white/40 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 p-8 shadow-xl shadow-zinc-200/50 flex flex-col gap-6 transition-all duration-300 hover:scale-[1.02] hover:bg-white/60 group" dir="rtl">
      
      {/* Upper Information Layer Layout */}
      <div className="flex justify-between items-start gap-4 select-none">
        <h3 className="text-xl font-black text-zinc-900 tracking-tighter uppercase leading-tight">
          {name}
        </h3>
        <div className="bg-zinc-900 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest flex-shrink-0">
          {expected_duration_time || '--'} דקות
        </div>
      </div>

      {/* Description String Frame */}
      <p className="text-zinc-500 font-medium text-sm leading-relaxed line-clamp-2 min-h-[40px]">
        {description || 'לא הוזנו דגשים או הגדרות מערכת עבור תוכנית אימון זו.'}
      </p>

      {/* Meta Structural Configuration Chips */}
      <div className="flex flex-wrap gap-2 mt-auto select-none">
        <div className="bg-white/50 border border-white px-4 py-1.5 rounded-full text-[10px] font-black text-zinc-400 uppercase tracking-widest">
          {exercises.length} תרגילים
        </div>
        
        {scheduled_days?.length > 0 && (
          <div className="bg-blue-600/10 border border-blue-200 px-4 py-1.5 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-widest">
            ימים: {scheduled_days.map(d => daysOfWeek[d]).join(', ')}
          </div>
        )}
      </div>

      {/* Interactive Command Suit Area */}
      <div className="flex gap-3 pt-4 border-t border-white/40">
        <button 
          type="button"
          onClick={() => onStart(template)}
          className="flex-[2] bg-emerald-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95"
        >
          🚀 הפעל אימון
        </button>

        {isTrainer && (
          <>
            <button 
              type="button" 
              onClick={handleEditRedirect}
              className="flex-1 bg-white/60 text-zinc-900 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/80 hover:bg-white transition-all active:scale-95"
            >
              ערוך
            </button>
            <button 
              type="button"
              onClick={() => onDelete(id)}
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

export default WorkoutCard;