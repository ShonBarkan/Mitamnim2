import React from 'react';

/**
 * TemplateGeneralInfo Component - Handles the core metadata fields for a workout template.
 * Refactored: Stripped from duplicate sections wrappers to comply with parent layout architecture guidelines.
 * Implements the bright "Arctic Mirror" aesthetic with high-end glassmorphic inputs.
 * Validated with strict English-only code commentary and total Hebrew UI localization.
 */
const TemplateGeneralInfo = ({ formData, setFormData }) => {
  return (
    <div className="space-y-8" dir="rtl">
      
      {/* Module Title Header Block */}
      <header className="flex items-center gap-4 mb-2">
        <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center text-white text-lg shadow-md select-none">
          📝
        </div>
        <div className="space-y-0.5">
          <h3 className="text-2xl font-black tracking-tight text-zinc-900 uppercase">פרטים כלליים</h3>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">נתוני בסיס של תוכנית האימון</p>
        </div>
      </header>

      {/* Main Structural Form Inputs Stack */}
      <div className="space-y-6">
        
        {/* Workout Session Descriptive Name Input Field */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mr-2">שם האימון</label>
          <input 
            type="text" 
            placeholder="למשל: אימון חזה ויד אחורית - היפרטרופיה"
            value={formData.name || ''} 
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all shadow-sm placeholder:text-zinc-300"
            required
          />
        </div>

        {/* Extended Context Narrative Description Area */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mr-2">תיאור ודגשים</label>
          <textarea 
            placeholder="כתוב כאן על מטרת האימון, תיאור כללי, ציוד נדרש או דגשים קבועים למתאמנים..."
            value={formData.description || ''} 
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full bg-white/50 border border-white/40 rounded-3xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all h-32 resize-none shadow-sm placeholder:text-zinc-300"
          />
        </div>

      </div>
    </div>
  );
};

export default TemplateGeneralInfo;