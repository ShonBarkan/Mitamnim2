import React from 'react';

/**
 * WorkoutFooterSection Component - Concludes a live tracking workout session.
 * Redesigned following the premium Arctic Mirror glassmorphism theme and clean spacing grids.
 */
const WorkoutFooterSection = ({ 
  summary, 
  setSummary, 
  duration, 
  setDuration, 
  onFinish, 
  isSaving 
}) => {
  return (
    <div className="bg-white/40 backdrop-blur-2xl rounded-[3rem] p-10 border border-white/60 shadow-xl font-sans mt-12 mb-12 relative overflow-hidden" dir="rtl">
      
      {/* Decorative top accent gradient */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-900/10 via-white/60 to-zinc-900/10" />

      {/* Header Section */}
      <header className="mb-8 mr-2">
        <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">סיכום וסיום אימון</h3>
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.25em] mt-1">Session Summary & Post-Workout Notes</p>
      </header>
      
      <div className="grid grid-cols-1 gap-8">
        
        {/* Session Actual Duration Input */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mr-2">
            כמה זמן לקח האימון? (אופציונלי)
          </label>
          <div className="relative max-w-xs group">
            <input 
              type="number"
              placeholder="למשל: 45"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-base font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all shadow-sm placeholder:text-zinc-300"
            />
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-300 uppercase tracking-widest pointer-events-none">
              MIN
            </span>
          </div>
        </div>

        {/* Narrative / Focus Summary Input */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mr-2">
            איך היה האימון?
          </label>
          <textarea 
            placeholder="כתוב כאן הערות כלליות, תחושות עייפות, עמידה ביעדים או דגשים לפעם הבאה..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full bg-white/50 border border-white/40 rounded-[2rem] px-6 py-5 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all min-h-[140px] resize-none shadow-sm placeholder:text-zinc-300"
          />
        </div>
      </div>

      {/* Persistent Finish Commit Action Button */}
      <div className="mt-10">
        <button 
          onClick={onFinish}
          disabled={isSaving}
          className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] transition-all duration-300 active:scale-[0.98] border ${
            isSaving 
              ? 'bg-zinc-200 text-zinc-400 border-transparent cursor-not-allowed shadow-none animate-pulse' 
              : 'bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-800 shadow-2xl shadow-zinc-900/20'
          }`}
        >
          {isSaving ? "SYNCHRONIZING..." : "✅ סיום ושמירת אימון"}
        </button>
      </div>
    </div>
  );
};

export default WorkoutFooterSection;