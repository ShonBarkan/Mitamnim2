import React from 'react';

/**
 * TagForm Component - Standard input interface for manual tag creation/editing.
 */
const TagForm = ({ formData, editingId, PRESET_COLORS, onInputChange, onPresetColorSelect, onSubmit, onReset }) => {
  return (
    <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-lg">
      <h3 className="text-sm font-black uppercase tracking-wider text-zinc-700 mb-6 select-none">
        {editingId ? '✏️ עריכת תג קבוצתי' : '🏷️ הקמת תג קבוצתי חדש'}
      </h3>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">שם התג</label>
            <input 
              type="text" name="name" placeholder="לדוגמה: כוח, סיבולת..." value={formData.name} 
              onChange={onInputChange} 
              className="w-full bg-white/60 border border-white/80 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">בחירת צבע</label>
            <div className="flex gap-4 items-center h-[54px] bg-white/40 border border-white/80 rounded-2xl px-4">
              <input type="color" name="color" value={formData.color} onChange={onInputChange} className="w-10 h-10 border-0 rounded-xl cursor-pointer bg-transparent" />
              <span className="font-mono text-xs text-zinc-500 font-bold">{formData.color.toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          {editingId && <button type="button" onClick={onReset} className="px-6 py-3 bg-white/80 rounded-xl text-zinc-500 font-bold text-xs hover:bg-white transition-all">ביטול</button>}
          <button type="submit" className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-black text-xs uppercase shadow-md hover:bg-zinc-800 transition-all">
            {editingId ? 'שמור שינויים' : 'צור תג חדש'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TagForm;