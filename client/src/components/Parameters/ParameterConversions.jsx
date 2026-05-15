import React, { useState, useMemo } from 'react';
import { useParameter } from '../../contexts/ParameterContext';

/**
 * ParameterConversions Component - Manages Virtual Parameters (Conversions).
 * Implements the "Arctic Mirror" (Glassmorphism) aesthetic.
 */
const ParameterConversions = () => {
  // Accessing the updated ParameterContext which handles both raw and virtual params
  const { parameters, addParameter, editParameter, removeParameter, loading } = useParameter();

  const [filterText, setFilterText] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  const initialFormState = {
    name: '',
    unit: '',
    is_virtual: true,
    calculation_type: 'conversion',
    source_parameter_ids: [],
    multiplier: 1,
    aggregation_strategy: 'sum'
  };

  const [formData, setFormData] = useState(initialFormState);

  /**
   * Filtered list of conversion-type virtual parameters.
   */
  const conversionParameters = useMemo(() => {
    return parameters.filter(p => 
      p.is_virtual && 
      p.calculation_type === 'conversion' &&
      (p.name.toLowerCase().includes(filterText.toLowerCase()) || 
       p.unit.toLowerCase().includes(filterText.toLowerCase()))
    );
  }, [parameters, filterText]);

  const resetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
  };

  /**
   * Handles form submission to create or update a virtual parameter.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await editParameter(editingId, formData);
      } else {
        await addParameter(formData);
      }
      resetForm();
    } catch (err) {
      console.error("Failed to save parameter conversion:", err);
    }
  };

  const startEdit = (param) => {
    setEditingId(param.id);
    setFormData({
      name: param.name,
      unit: param.unit,
      is_virtual: true,
      calculation_type: 'conversion',
      source_parameter_ids: param.source_parameter_ids || [],
      multiplier: param.multiplier || 1,
      aggregation_strategy: param.aggregation_strategy || 'sum'
    });
  };

  return (
    <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border border-white/60 h-full flex flex-col" dir="rtl">
      <header className="mb-8 space-y-1">
        <h2 className="text-2xl font-black text-zinc-900 tracking-tighter">המרת יחידות ופרמטרים</h2>
        <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em]">Unit Logic & Virtual Definitions</p>
      </header>

      {/* Arctic Mirror Editor Form */}
      <form 
        onSubmit={handleSubmit} 
        className={`p-6 rounded-[2.5rem] mb-10 border transition-all duration-500 ${
          editingId ? 'bg-blue-600/5 border-blue-200/50' : 'bg-white/40 border-white/60'
        }`}
      >
        <div className="flex items-center gap-3 mb-6">
           <div className={`w-2 h-2 rounded-full ${editingId ? 'bg-blue-500' : 'bg-emerald-500'}`} />
           <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tighter">
             {editingId ? 'עריכת המרה' : 'הגדרה חדשה'}
           </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Source Parameter Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">פרמטר מקור</label>
            <select 
              className="w-full p-4 rounded-2xl bg-white/50 border border-white/40 text-sm font-bold outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all"
              value={formData.source_parameter_ids[0] || ''}
              onChange={(e) => setFormData({...formData, source_parameter_ids: [parseInt(e.target.value)]})}
              required
            >
              <option value="">בחר פרמטר...</option>
              {parameters.filter(p => !p.is_virtual).map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
              ))}
            </select>
          </div>

          {/* Target Display Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שם תצוגה (יעד)</label>
            <input 
              placeholder="e.g., מרחק כולל" 
              className="w-full p-4 rounded-2xl bg-white/50 border border-white/40 text-sm font-bold outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          {/* Multiplier / Ratio */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">מכפיל יחס</label>
            <input 
              type="number" step="0.0001"
              placeholder="1 unit equals..." 
              className="w-full p-4 rounded-2xl bg-white/50 border border-white/40 text-sm font-bold outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all"
              value={formData.multiplier}
              onChange={(e) => setFormData({...formData, multiplier: parseFloat(e.target.value)})}
              required
            />
          </div>

          {/* New Display Unit */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">יחידת מידה</label>
            <input 
              placeholder="e.g., קילומטרים" 
              className="w-full p-4 rounded-2xl bg-white/50 border border-white/40 text-sm font-bold outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all"
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
              required
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button 
            type="submit" 
            className={`flex-1 font-black py-4 rounded-2xl transition-all shadow-2xl active:scale-95 text-xs uppercase tracking-widest ${
              editingId ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-zinc-900 text-white shadow-zinc-200'
            }`}
          >
            {editingId ? 'עדכון לוגיקה' : 'שמירת המרה'}
          </button>
          {editingId && (
            <button 
              type="button" 
              onClick={resetForm} 
              className="bg-white/60 text-zinc-500 font-black py-4 px-8 rounded-2xl hover:bg-white/80 text-xs uppercase tracking-widest transition-all"
            >
              ביטול
            </button>
          )}
        </div>
      </form>

      {/* Directory Search & List */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="relative mb-6">
          <input 
            type="text"
            placeholder="חיפוש לפי שם או יחידה..."
            className="w-full p-5 pr-14 rounded-3xl border border-white bg-white/50 text-sm font-bold outline-none focus:ring-8 focus:ring-zinc-900/5"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
          <span className="absolute right-6 top-5 text-xl opacity-20">🔍</span>
        </div>

        <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2 scrollbar-hide">
          {conversionParameters.map(p => {
            const sourceParamName = parameters.find(sp => sp.id === p.source_parameter_ids[0])?.name;
            return (
              <div 
                key={p.id} 
                className="group flex justify-between items-center p-6 border border-white/60 rounded-[2rem] bg-white/30 hover:bg-white/60 hover:shadow-xl transition-all duration-500"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xl font-black text-zinc-900 tracking-tight">{p.name}</span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="text-zinc-900">Source: {sourceParamName || 'N/A'}</span>
                    <span className="opacity-30">•</span>
                    <span className="text-blue-600">Ratio: x{p.multiplier} {p.unit}</span>
                  </span>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => startEdit(p)}
                    className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => removeParameter(p.id)}
                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
          
          {conversionParameters.length === 0 && !loading && (
            <div className="text-center py-16 text-zinc-300 font-bold uppercase tracking-[0.3em] text-[10px] border-2 border-dashed border-white/40 rounded-[3rem]">
              No conversions defined
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParameterConversions;