import React from 'react';

/**
 * TemplateGeneralInfo Component - Handles the core metadata for a workout template.
 * Refactored to completely remove all category layers and select filters.
 * Implements the "Arctic Mirror" aesthetic with glassmorphic inputs.
 */
const TemplateGeneralInfo = ({ formData, setFormData }) => {
  return (
    <section className="bg-white/40 backdrop-blur-3xl rounded-[3rem] p-10 border border-white/60 shadow-xl space-y-8">
      
      {/* Module Title Header Block */}
      <header className="flex items-center gap-4 mb-2">
        <div className="w-10 h-10 bg-zinc-900 rounded-2xl flex items-center justify-center text-white text-lg shadow-md">
          📝
        </div>
        <div className="space-y-0.5">
          <h3 className="text-2xl font-black tracking-tight text-zinc-900 uppercase">פרטים כלליים</h3>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Basic Session Metadata</p>
        </div>
      </header>

      {/* Main Structural Form Inputs Stack */}
      <div className="space-y-6">
        
        {/* Workout Session Descriptive Name */}
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

        {/* Extended Context Narrative Area */}
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
    </section>
  );
};

export default TemplateGeneralInfo;