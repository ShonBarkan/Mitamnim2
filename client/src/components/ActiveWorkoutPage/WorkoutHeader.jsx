import React, { useState } from 'react';

/**
 * WorkoutHeader Component - Sticky navigation and status bar for live workouts.
 * Implements the "Arctic Mirror" glassmorphism theme with embedded session time editing.
 */
const WorkoutHeader = ({ 
  name, 
  description, 
  parentName, 
  onSave, 
  onCancel, 
  isSaving,
  onAddExercise,
  startTime,
  setStartTime 
}) => {
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [tempTime, setTempTime] = useState("");

  /**
   * Translates the active start time into local ISO format for the HTML datetime input.
   */
  const handleEditTimeClick = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(startTime - tzoffset)).toISOString().slice(0, 16);
    setTempTime(localISOTime);
    setIsEditingTime(true);
  };

  /**
   * Commits the edited temporary timestamp back to the state manager.
   */
  const handleTimeSave = () => {
    if (tempTime) {
      setStartTime(new Date(tempTime));
    }
    setIsEditingTime(false);
  };

  return (
    <div className="sticky top-0 z-50 bg-white/40 backdrop-blur-2xl border-b border-white/60 shadow-xl px-8 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6" dir="rtl">
      
      {/* Meta Identity Block */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-black text-blue-600 bg-blue-600/5 border border-blue-500/10 px-2.5 py-1 rounded-md uppercase tracking-widest w-fit shadow-inner">
          {parentName}
        </span>
        <h2 className="text-3xl font-black text-zinc-900 tracking-tighter m-0 uppercase leading-none">
          {name}
        </h2>
        {description && (
          <p className="text-xs font-bold text-zinc-400 m-0 max-w-md truncate">
            {description}
          </p>
        )}
        
        {/* Session Live Clock Editor */}
        <div className="mt-3 flex items-center gap-2.5 bg-white/40 border border-white/60 px-4 py-1.5 rounded-xl shadow-sm w-fit">
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">התחלה:</span>
          {isEditingTime ? (
            <div className="flex items-center gap-2 animate-in fade-in duration-300">
              <input 
                type="datetime-local" 
                value={tempTime}
                onChange={(e) => setTempTime(e.target.value)}
                className="text-xs border border-zinc-100 rounded-lg px-3 py-1 bg-white font-sans text-zinc-900 outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all shadow-inner"
              />
              <button 
                onClick={handleTimeSave} 
                className="text-[9px] bg-zinc-900 text-white px-3 py-1.5 rounded-md font-black uppercase tracking-wider shadow-md"
              >
                שמור
              </button>
              <button 
                onClick={() => setIsEditingTime(false)} 
                className="text-[9px] bg-white/80 text-zinc-400 border border-white/90 px-3 py-1.5 rounded-md font-black uppercase tracking-wider"
              >
                ביטול
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 animate-in fade-in duration-300">
              <span className="text-xs font-black text-zinc-800 tabular-nums">
                {startTime.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
              <button 
                onClick={handleEditTimeClick} 
                className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
              >
                ✎ ערוך זמן
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Primary Action Button Suite */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <button 
          onClick={onAddExercise}
          className="flex-1 md:flex-none bg-blue-600/10 text-blue-600 border border-blue-200/40 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm"
        >
          ＋ הוסף תרגיל
        </button>
        
        <button 
          onClick={onCancel} 
          disabled={isSaving}
          className="bg-white/60 border border-white/80 text-rose-500 hover:bg-rose-500 hover:text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm"
        >
          ביטול
        </button>
        
        <button 
          onClick={onSave} 
          disabled={isSaving}
          className={`flex-1 md:flex-none px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.25em] transition-all active:scale-[0.98] text-white ${
            isSaving 
              ? 'bg-zinc-300 cursor-not-allowed border border-transparent' 
              : 'bg-zinc-900 hover:bg-zinc-800 shadow-2xl shadow-zinc-900/20 border border-zinc-900'
          }`}
        >
          {isSaving ? "שומר אימון..." : "סיום אימון 🚀"}
        </button>
      </div>
    </div>
  );
};

export default WorkoutHeader;