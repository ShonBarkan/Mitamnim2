import React from 'react';

const WorkoutFooterSection = ({ 
  summary, 
  setSummary, 
  duration, 
  setDuration, 
  onFinish, 
  isSaving 
}) => {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-xl shadow-slate-200/50 font-sans mt-8 mb-8" dir="rtl">
      <h3 className="text-xl font-black text-zinc-900 tracking-tighter mb-6">סיכום וסיום אימון</h3>
      
      <div className="flex flex-col gap-2 mb-6">
        <label className="text-xs font-black uppercase tracking-widest text-zinc-500">כמה זמן לקח האימון? (בדקות - אופציונלי)</label>
        <input 
          type="number"
          placeholder="למשל: 45"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
        />
      </div>

      <div className="flex flex-col gap-2 mb-8">
        <label className="text-xs font-black uppercase tracking-widest text-zinc-500">איך היה האימון? (סיכום קצר)</label>
        <textarea 
          placeholder="כתוב כאן הערות, תחושות או דגשים..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all min-h-[120px] resize-y"
        />
      </div>

      <button 
        onClick={onFinish}
        disabled={isSaving}
        className={`w-full py-5 rounded-[1.5rem] font-black text-lg transition-all active:scale-95 ${
          isSaving 
            ? 'bg-zinc-400 text-zinc-100 cursor-not-allowed' 
            : 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-xl shadow-zinc-200'
        }`}
      >
        {isSaving ? "שומר נתונים..." : "✅ סיום ושמירת אימון"}
      </button>
    </div>
  );
};

export default WorkoutFooterSection;
