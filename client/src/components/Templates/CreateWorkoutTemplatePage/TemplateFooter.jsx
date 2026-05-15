import React from 'react';

/**
 * TemplateFooter Component - The action bar for template creation.
 * Implements a floating Glassmorphism bar with high-end Arctic Mirror styling.
 */
const TemplateFooter = ({ onCancel }) => {
  return (
    <div className="sticky bottom-8 z-10 mt-12 bg-white/40 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/60 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] flex gap-4 transition-all duration-500">
      
      {/* Primary Action: Save Template */}
      <button 
        type="submit" 
        className="flex-[2] py-5 bg-zinc-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-zinc-900/30 hover:bg-zinc-800 transition-all active:scale-[0.98] group"
      >
        <span className="flex items-center justify-center gap-2">
          שמור שבלונה במערכת
          <span className="opacity-0 group-hover:opacity-100 group-hover:translate-x-[-4px] transition-all">←</span>
        </span>
      </button>

      {/* Secondary Action: Cancel/Discard */}
      <button 
        type="button" 
        onClick={onCancel} 
        className="flex-1 py-5 bg-white/60 text-zinc-400 hover:text-zinc-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest border border-white/80 hover:bg-white transition-all active:scale-[0.95]"
      >
        ביטול
      </button>
      
    </div>
  );
};

export default TemplateFooter;