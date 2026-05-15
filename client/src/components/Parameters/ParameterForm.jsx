import React, { useState } from 'react';
import { useParameter } from '../../contexts/ParameterContext';
import { useToast } from '../../hooks/useToast';

/**
 * ParameterForm Component - Independent form for creating measuring parameters.
 * Supports Raw, Conversion, and multi-operation Virtual parameters.
 * Implements the Arctic Mirror (Glassmorphism) design language.
 */
const ParameterForm = ({ onSuccess }) => {
  const { parameters, addParameter } = useParameter();
  const { showToast } = useToast();

  const initialState = {
    name: '',
    unit: '',
    aggregation_strategy: 'sum',
    is_virtual: false,
    calculation_type: null,
    source_parameter_ids: [],
    multiplier: 1.0
  };

  const [formData, setFormData] = useState(initialState);

  /**
   * Resets form to initial values.
   */
  const resetForm = () => {
    setFormData(initialState);
  };

  /**
   * Switches between raw and virtual parameter logic.
   * Resets specific virtual fields when switching to 'raw'.
   */
  const handleTypeChange = (type) => {
    if (type === 'raw') {
      setFormData(prev => ({ ...prev, is_virtual: false, calculation_type: null, source_parameter_ids: [] }));
    } else {
      setFormData(prev => ({ ...prev, is_virtual: true, calculation_type: type }));
    }
  };

  /**
   * Manages the selection of source parameters.
   * Ensures 'conversion' type only allows a single source.
   */
  const toggleSourceParam = (id) => {
    setFormData(prev => {
      const ids = [...prev.source_parameter_ids];
      if (ids.includes(id)) {
        return { ...prev, source_parameter_ids: ids.filter(paramId => paramId !== id) };
      } else {
        if (prev.calculation_type === 'conversion') {
          return { ...prev, source_parameter_ids: [id] };
        }
        return { ...prev, source_parameter_ids: [...ids, id] };
      }
    });
  };

  /**
   * Form submission logic.
   * Validates virtual dependencies before calling the context.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.is_virtual && formData.source_parameter_ids.length === 0) {
      showToast("Please select at least one source parameter", "error");
      return;
    }

    try {
      await addParameter(formData);
      showToast("הפרמטר נוצר בהצלחה", "success");
      resetForm();
      if (onSuccess) onSuccess();
    } catch (error) {
      showToast("כשל ביצירת פרמטר", "error");
    }
  };

  return (
    <div className="w-full max-w-[600px] bg-white/40 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/60 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] font-sans" dir="rtl">
      
      {/* Header Branding */}
      <header className="mb-10 space-y-1">
        <h3 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">
          🆕 יצירת פרמטר חדש
        </h3>
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Unit Registry Engine</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Core Metadata Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mr-4">שם הפרמטר</label>
            <input 
              required
              placeholder="e.g., משקל"
              className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mr-4">יחידת מידה</label>
            <input 
              required
              placeholder="e.g., קילוגרם"
              className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all"
              value={formData.unit}
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
            />
          </div>
        </div>

        {/* Logical Type Selection */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mr-4">סוג פרמטר (Logic)</label>
          <select 
            className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none appearance-none focus:ring-8 focus:ring-zinc-900/5 transition-all"
            value={!formData.is_virtual ? 'raw' : formData.calculation_type}
            onChange={(e) => handleTypeChange(e.target.value)}
          >
            <option value="raw">רגיל (Raw)</option>
            <option value="conversion">המרה (Conversion - יחס קבוע)</option>
            <option value="sum">חיבור (Sum)</option>
            <option value="subtract">חיסור (Subtract)</option>
            <option value="multiply">מכפלה (Multiply)</option>
            <option value="divide">חילוק (Divide)</option>
            <option value="percentage">אחוזים (Percentage)</option>
          </select>
        </div>

        {/* Virtual Configuration (Conditional) */}
        {formData.is_virtual && (
          <div className="p-8 rounded-[2rem] bg-white/40 border border-white/60 space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
            
            {formData.calculation_type === 'conversion' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">מקדם הכפלה</label>
                <input 
                  type="number" step="0.0001"
                  className="w-full bg-white/60 border border-white/40 rounded-xl px-6 py-3 text-sm font-black outline-none"
                  value={formData.multiplier}
                  onChange={(e) => setFormData({...formData, multiplier: parseFloat(e.target.value)})}
                />
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight italic">Example: 1 pool = 25 meters, multiplier is 25.</p>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                בחר פרמטרי מקור 
                {['subtract', 'divide', 'percentage'].includes(formData.calculation_type) && " (סדר הבחירה קובע)"}
              </label>
              
              <div className="flex flex-wrap gap-2">
                {parameters.filter(p => !p.is_virtual).map(p => {
                  const selectionIndex = formData.source_parameter_ids.indexOf(p.id);
                  const isSelected = selectionIndex !== -1;
                  
                  return (
                    <button 
                      key={p.id}
                      type="button"
                      onClick={() => toggleSourceParam(p.id)}
                      className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-tighter transition-all active:scale-95 ${
                        isSelected 
                        ? 'bg-zinc-900 text-white shadow-lg' 
                        : 'bg-white/50 text-zinc-400 hover:bg-white/80'
                      }`}
                    >
                      {isSelected && <span className="ml-2 text-blue-400">{selectionIndex + 1}.</span>}
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Aggregation Selection */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mr-4">שיטת אגרגציה (Stats)</label>
          <select 
            className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none appearance-none focus:ring-8 focus:ring-zinc-900/5 transition-all"
            value={formData.aggregation_strategy}
            onChange={(e) => setFormData({...formData, aggregation_strategy: e.target.value})}
          >
            <option value="sum">סיכום (Sum)</option>
            <option value="max">שיא / מקסימום (Max)</option>
            <option value="min">מינימום (Min)</option>
            <option value="avg">ממוצע (Avg)</option>
            <option value="latest">ערך אחרון (Latest)</option>
          </select>
        </div>

        {/* Form Submission */}
        <button 
          type="submit"
          className="w-full bg-zinc-900 text-white rounded-3xl py-6 font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl shadow-zinc-900/20 active:scale-[0.98] hover:bg-zinc-800"
        >
          שמור פרמטר במערכת
        </button>
      </form>
    </div>
  );
};

export default ParameterForm;