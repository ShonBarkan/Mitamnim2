import React, { useState, useMemo } from 'react';
import { useParameter } from '../../contexts/ParameterContext';
import { useToast } from '../../hooks/useToast';

/**
 * ParameterFormulas Component - Specialized manager for multi-parameter calculations.
 * Part of the Virtual Parameter engine in Mitamnim2.
 * Implements the "Arctic Mirror" design aesthetic.
 */
const ParameterFormulas = () => {
  const { parameters, addParameter, removeParameter, loading } = useParameter();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    calculation_type: 'multiply',
    source_parameter_ids: [],
    unit: '',
    is_virtual: true,
    aggregation_strategy: 'sum'
  });

  /**
   * Filters parameters to find virtual "Formula" types (excluding simple conversions).
   */
  const existingFormulas = useMemo(() => {
    return parameters.filter(p => p.is_virtual && p.calculation_type !== 'conversion');
  }, [parameters]);

  /**
   * Handles formula creation.
   * Maps the UI state to the Virtual Parameter schema.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.source_parameter_ids.length < 2) {
      showToast("Please select at least two source parameters", "error");
      return;
    }

    try {
      await addParameter(formData);
      showToast("הנוסחה נוצרה בהצלחה", "success");
      setFormData({ 
        name: '', 
        calculation_type: 'multiply', 
        source_parameter_ids: [], 
        unit: '', 
        is_virtual: true,
        aggregation_strategy: 'sum'
      });
    } catch (err) {
      showToast("שגיאה ביצירת נוסחה", "error");
    }
  };

  /**
   * Toggles parameter selection for the formula.
   */
  const toggleParam = (id) => {
    setFormData(prev => {
      const ids = prev.source_parameter_ids.includes(id)
        ? prev.source_parameter_ids.filter(pId => pId !== id)
        : [...prev.source_parameter_ids, id];
      return { ...prev, source_parameter_ids: ids };
    });
  };

  return (
    <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border border-white/60 h-full flex flex-col font-sans" dir="rtl">
      <header className="mb-8 space-y-1">
        <h2 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">נוסחאות וחישובים</h2>
        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em]">Multi-Source Logical Engine</p>
      </header>
      
      {/* Arctic Mirror Formula Editor */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white/30 border border-white/60 p-6 rounded-[2.5rem] mb-10 shadow-inner">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">שם הנוסחה (לדוגמה: נפח / הספק)</label>
          <input 
            placeholder="Formula Name" 
            className="w-full p-4 rounded-2xl bg-white/50 border border-white/40 text-sm font-bold outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">פעולה חשבונית</label>
            <select 
              className="w-full p-4 rounded-2xl bg-white/50 border border-white/40 text-sm font-bold outline-none appearance-none focus:ring-8 focus:ring-zinc-900/5 transition-all"
              value={formData.calculation_type}
              onChange={(e) => setFormData({...formData, calculation_type: e.target.value})}
            >
              <option value="multiply">מכפלה (*)</option>
              <option value="sum">סכום (+)</option>
              <option value="subtract">חיסור (-)</option>
              <option value="divide">חילוק (/)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">יחידת מידה</label>
            <input 
              placeholder="Unit (e.g. Watts)" 
              className="w-full p-4 rounded-2xl bg-white/50 border border-white/40 text-sm font-bold outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all"
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
              required
            />
          </div>
        </div>

        {/* Source Parameter Picker */}
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">בחר פרמטרים לחישוב:</label>
          <div className="max-h-40 overflow-y-auto border border-white/40 p-4 bg-white/20 rounded-2xl scrollbar-hide space-y-2">
            {parameters.filter(p => !p.is_virtual).map(p => (
              <label key={p.id} className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox"
                  className="w-5 h-5 rounded-lg border-2 border-zinc-200 checked:bg-zinc-900 transition-all cursor-pointer"
                  checked={formData.source_parameter_ids.includes(p.id)}
                  onChange={() => toggleParam(p.id)}
                /> 
                <span className={`text-sm font-bold transition-colors ${
                  formData.source_parameter_ids.includes(p.id) ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-600'
                }`}>
                  {p.name} <span className="opacity-40 text-[10px]">({p.unit})</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <button className="w-full bg-zinc-900 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-zinc-900/20 hover:bg-zinc-800 transition-all active:scale-[0.98] text-xs uppercase tracking-[0.2em]">
          שמירת נוסחה במערכת
        </button>
      </form>

      {/* Directory of Active Formulas */}
      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-3">
        <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-4">נוסחאות פעילות</h3>
        {existingFormulas.map(f => (
          <div key={f.id} className="flex justify-between items-center p-5 border border-white/60 rounded-[2rem] bg-white/30 hover:bg-white/60 hover:shadow-xl transition-all duration-500">
            <div className="flex flex-col">
              <span className="text-lg font-black text-zinc-900 tracking-tight">{f.name}</span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                Logic: <span className="text-blue-600">{f.calculation_type}</span> ({f.unit})
              </span>
            </div>
            <button 
              onClick={() => removeParameter(f.id)} 
              className="w-10 h-10 flex items-center justify-center text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              ✕
            </button>
          </div>
        ))}

        {existingFormulas.length === 0 && (
          <div className="text-center py-12 text-zinc-300 font-bold uppercase tracking-[0.3em] text-[10px] border-2 border-dashed border-white/40 rounded-[3rem]">
            No formulas defined
          </div>
        )}
      </div>
    </div>
  );
};

export default ParameterFormulas;