import React from 'react';

/**
 * ParameterForm Component - Handles field layout logic dependent on the active creationMode.
 */
const ParameterForm = ({ creationMode, formData, setFormData, parameters, editingId, resetForms, handleSubmit }) => {
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSourceParamChange = (index, value) => {
    setFormData(prev => {
      const updatedSources = [...prev.source_parameter_ids];
      updatedSources[index] = value ? parseInt(value) : '';
      return { ...prev, source_parameter_ids: updatedSources };
    });
  };

  const filteredParams = parameters.filter(p => p.id !== editingId);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">שם המדד</label>
          <input type="text" name="name" placeholder="לדוגמה: משקל, חזרות, מרחק" value={formData.name} onChange={handleInputChange} className="w-full bg-white/60 border border-white/80 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">יחידת מידה</label>
          <input type="text" name="unit" placeholder="לדוגמה: ק''ג, חזרות, מטרים" value={formData.unit} onChange={handleInputChange} className="w-full bg-white/60 border border-white/80 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">אסטרטגיית סיכום סטטיסטי</label>
          <select name="aggregation_strategy" value={formData.aggregation_strategy} onChange={handleInputChange} className="w-full bg-white/60 border border-white/80 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 appearance-none transition-all">
            <option value="sum">סכום מצטבר (Sum)</option>
            <option value="max">ערך שיא מקסימלי (Max)</option>
            <option value="avg">ממוצע ביצועים (Avg)</option>
          </select>
        </div>
      </div>

      {creationMode === 'conversion' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 bg-white/30 border border-white/40 rounded-2xl">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">פרמטר בסיס גולמי להמרה</label>
            <select value={formData.source_parameter_ids[0]} onChange={(e) => handleSourceParamChange(0, e.target.value)} className="w-full bg-white/60 border border-white/80 rounded-xl p-3.5 text-xs font-bold outline-none">
              <option value="">-- בחר מדד מקור --</option>
              {filteredParams.filter(p => !p.is_virtual).map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">מכפיל יחס המרה (Multiplier)</label>
            <input type="number" step="any" name="multiplier" value={formData.multiplier} onChange={handleInputChange} className="w-full bg-white/60 border border-white/80 rounded-xl p-3 text-xs font-bold outline-none" />
          </div>
        </div>
      )}

      {creationMode === 'combination' && (
        <div className="space-y-4 p-5 bg-white/30 border border-white/40 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">מדד מקור א'</label>
              <select value={formData.source_parameter_ids[0]} onChange={(e) => handleSourceParamChange(0, e.target.value)} className="w-full bg-white/60 border border-white/80 rounded-xl p-3.5 text-xs font-bold outline-none">
                <option value="">-- בחר מדד --</option>
                {filteredParams.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">פעולה מתמטית</label>
              <select name="calculation_type" value={formData.calculation_type} onChange={handleInputChange} className="w-full bg-white/60 border border-white/80 rounded-xl p-3.5 text-xs font-bold outline-none">
                <option value="multiply">מכפלה (*) [נפח = חזרות כפול משקל]</option>
                <option value="divide">חילוק (/) [קצב = מרחק חלקי זמן]</option>
                <option value="sum">חיבור (+)</option>
                <option value="subtract">חיסור (-)</option>
                <option value="percentage">אחוזים (A / B * 100)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">מדד מקור ב'</label>
              <select value={formData.source_parameter_ids[1]} onChange={(e) => handleSourceParamChange(1, e.target.value)} className="w-full bg-white/60 border border-white/80 rounded-xl p-3.5 text-xs font-bold outline-none">
                <option value="">-- בחר מדד --</option>
                {filteredParams.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">מכפיל פקטור חיצוני (Multiplier)</label>
              <input type="number" step="any" name="multiplier" value={formData.multiplier} onChange={handleInputChange} className="w-full bg-white/60 border border-white/80 rounded-xl p-3 text-xs font-bold outline-none" />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-zinc-900/5 pt-4">
        {editingId && (
          <button type="button" onClick={resetForms} className="px-6 py-3 bg-white/80 border border-zinc-200 rounded-xl text-zinc-500 font-bold text-xs hover:bg-white transition-all">
            ביטול
          </button>
        )}
        <button type="submit" className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-zinc-800 transition-all active:scale-95">
          {editingId ? 'שמור שינויים' : creationMode === 'regular' ? 'הוסף פרמטר רגיל' : creationMode === 'conversion' ? 'הקם מדד המרה' : 'הקם שילוב פרמטרים'}
        </button>
      </div>
    </form>
  );
};

export default ParameterForm;