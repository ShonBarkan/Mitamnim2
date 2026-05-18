import React, { useState, useEffect } from 'react';
import { useParameter } from '../../contexts/ParameterContext';
import { useToast } from '../../contexts/ToastContext';
import FrontendLogger from '../../utils/logger';

/**
 * ParameterManager Component - System metric matrix architecture supervisor.
 * Splits Raw and Virtual parameter blueprint operations into isolated, fluid glass layouts.
 */
const ParameterManager = () => {
  const { parameters, loading, fetchParameters, addParameter, editParameter, removeParameter } = useParameter();
  const { showToast } = useToast();

  // Internal structural state controls
  const [creationMode, setCreationMode] = useState('raw'); // 'raw' | 'virtual'
  const [editingId, setEditingId] = useState(null);

  // Raw Parameter state layout
  const [rawForm, setRawForm] = useState({ name: '', unit: '', aggregation_strategy: 'max' });

  // Virtual Parameter state layout
  const [virtualForm, setVirtualForm] = useState({
    name: '',
    unit: '',
    aggregation_strategy: 'sum',
    calculation_type: 'sum',
    source_parameter_ids: ['', ''],
    multiplier: 1
  });

  // Fetch group parameters registry on load
  useEffect(() => {
    FrontendLogger.info('PARAMETER_MANAGER', 'Syncing operational measurement metrics registry data');
    fetchParameters();
  }, [fetchParameters]);

  const handleRawChange = (e) => {
    const { name, value } = e.target;
    setRawForm(prev => ({ ...prev, [name]: value }));
  };

  const handleVirtualChange = (e) => {
    const { name, value } = e.target;
    setVirtualForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSourceParamChange = (index, value) => {
    setVirtualForm(prev => {
      const updatedSources = [...prev.source_parameter_ids];
      updatedSources[index] = value ? parseInt(value) : '';
      return { ...prev, source_parameter_ids: updatedSources };
    });
  };

  const resetForms = () => {
    setEditingId(null);
    setRawForm({ name: '', unit: '', aggregation_strategy: 'max' });
    setVirtualForm({
      name: '',
      unit: '',
      aggregation_strategy: 'sum',
      calculation_type: 'sum',
      source_parameter_ids: ['', ''],
      multiplier: 1
    });
  };

  /**
   * Transitions parameter data values directly into form structures for active mutations
   */
  const startEdit = (param) => {
    FrontendLogger.info('PARAMETER_MANAGER', `Injecting parameter id: ${param.id} into blueprint update fields`);
    setEditingId(param.id);
    
    if (param.is_virtual) {
      setCreationMode('virtual');
      setVirtualForm({
        name: param.name,
        unit: param.unit,
        aggregation_strategy: param.aggregation_strategy || 'sum',
        calculation_type: param.calculation_type || 'sum',
        source_parameter_ids: param.source_parameter_ids || ['', ''],
        multiplier: param.multiplier || 1
      });
    } else {
      setCreationMode('raw');
      setRawForm({
        name: param.name,
        unit: param.unit,
        aggregation_strategy: param.aggregation_strategy || 'max'
      });
    }
  };

  /**
   * Dispatches unified transaction calls for parameter additions or mutations
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    FrontendLogger.info('PARAMETER_MANAGER', 'Intercepted parameter schema submission execution request');

    try {
      if (creationMode === 'raw') {
        if (!rawForm.name || !rawForm.unit) {
          showToast("אנא מלא את כל שדות החובה עבור פרמטר בסיסי", "error");
          return;
        }
        
        const payload = { ...rawForm, is_virtual: false };
        if (editingId) {
          await editParameter(editingId, payload);
          showToast("הפרמטר הבסיסי עודכן בהצלחה", "success");
        } else {
          await addParameter(payload);
          showToast("פרמטר בסיסי חדש נוסף למערכת", "success");
        }
      } else {
        if (!virtualForm.name || !virtualForm.unit) {
          showToast("אנא מלא את שדות החובה עבור פרמטר וירטואלי", "error");
          return;
        }

        // Filter and sanitize numeric array fields
        const validSources = virtualForm.source_parameter_ids.filter(id => id !== '');
        if (validSources.length === 0) {
          showToast("חובה לבחור לפחות פרמטר מקור אחד עבור הנוסחה", "error");
          return;
        }

        const payload = {
          ...virtualForm,
          is_virtual: true,
          source_parameter_ids: validSources,
          multiplier: parseFloat(virtualForm.multiplier) || 1
        };

        if (editingId) {
          await editParameter(editingId, payload);
          showToast("הפרמטר הווירטואלי עודכן בהצלחה", "success");
        } else {
          await addParameter(payload);
          showToast("קומבו פרמטר וירטואלי הוקם בהצלחה", "success");
        }
      }
      resetForms();
    } catch (error) {
      FrontendLogger.error('PARAMETER_MANAGER', 'Error committing metrics schema layout modifications', error);
      showToast("פעולה נכשלה, אנא בדוק את ערכי הקלט", "error");
    }
  };

  const handleDelete = async (id) => {
    FrontendLogger.warn('PARAMETER_MANAGER', `Executing destruction countdown chain for parameter validation entity node: ${id}`);
    if (window.confirm("האם אתה בטוח שברצונך למחוק פרמטר זה? מחיקה עלולה לשבור נוסחאות וירטואליות התלויות בו.")) {
      try {
        await removeParameter(id);
        showToast("הפרמטר הוסר לחלוטין מהמערכת", "success");
        if (editingId === id) resetForms();
      } catch (error) {
        showToast("שגיאה בהסרת הפרמטר", "error");
      }
    }
  };

  return (
    <div className="space-y-10 font-sans" dir="rtl">
      
      {/* --- FORM SUB-SYSTEM CLUSTER --- */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-lg">
        
        {/* Type Blueprint Selector Tab System */}
        {!editingId && (
          <div className="grid grid-cols-2 p-1.5 bg-zinc-200/50 backdrop-blur-sm rounded-2xl mb-8 max-w-md shadow-inner">
            <button
              type="button"
              onClick={() => setCreationMode('raw')}
              className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                creationMode === 'raw' ? 'bg-white text-zinc-900 shadow' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              🛠️ פרמטר בסיסי (Raw)
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('virtual')}
              className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                creationMode === 'virtual' ? 'bg-white text-zinc-900 shadow' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              🧬 שילוב וירטואלי (Calculated)
            </button>
          </div>
        )}

        {editingId && (
          <div className="mb-6 flex items-center gap-3">
            <span className="bg-orange-500 text-white text-[10px] px-3 py-1 rounded-md font-black uppercase tracking-widest">Edit Mode Active</span>
            <span className="text-zinc-400 text-xs font-bold">עורך פרמטר מזהה מערכת #{editingId}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* --- CASE A: RAW PARAMETER FORM LAYER --- */}
          {creationMode === 'raw' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שם המדד (לדוגמה: משקל)</label>
                <input type="text" name="name" placeholder="Weight / Time / Reps" value={rawForm.name} onChange={handleRawChange} className="w-full bg-white/60 border border-white/80 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">יחידת מידה (לדוגמה: ק"ג, שניות)</label>
                <input type="text" name="unit" placeholder="kg / sec / count" value={rawForm.unit} onChange={handleRawChange} className="w-full bg-white/60 border border-white/80 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">אסטרטגיית סיכום גרפים</label>
                <select name="aggregation_strategy" value={rawForm.aggregation_strategy} onChange={handleRawChange} className="w-full bg-white/60 border border-white/80 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 appearance-none transition-all">
                  <option value="max">ערך מקסימלי (Max Record)</option>
                  <option value="sum">סכימת נפח כולל (Sum Accumulation)</option>
                  <option value="avg">ממוצע ביצועים (Average)</option>
                  <option value="latest">ביצוע אחרון כרונולוגית (Latest)</option>
                </select>
              </div>
            </div>
          )}

          {/* --- CASE B: VIRTUAL PARAMETER FORM LAYER --- */}
          {creationMode === 'virtual' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">שם מדד מחושב (לדוגמה: נפח סט)</label>
                  <input type="text" name="name" placeholder="Total Volume / Intensity Index" value={virtualForm.name} onChange={handleVirtualChange} className="w-full bg-white/60 border border-white/80 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">יחידת מידה תוצאתית</label>
                  <input type="text" name="unit" placeholder="kg-vol / score-index" value={virtualForm.unit} onChange={handleVirtualChange} className="w-full bg-white/60 border border-white/80 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">סוג הנוסחה / המניפולציה</label>
                  <select name="calculation_type" value={virtualForm.calculation_type} onChange={handleVirtualChange} className="w-full bg-white/60 border border-white/80 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 appearance-none transition-all">
                    <option value="sum">מכפלה / חיבור פרמטרים (Sum Matrix)</option>
                    <option value="divide">חלוקת פרמטר א' בפרמטר ב' (Ratio Division)</option>
                    <option value="percentage">יחס אחוזים (A / B * 100)</option>
                    <option value="conversion">המרה ישירה של מדד יחיד (Multiplier Transformation)</option>
                  </select>
                </div>
              </div>

              {/* Formula inputs configuration row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-5 bg-white/30 border border-white/40 rounded-2xl">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">פרמטר מקור א' (בסיס)</label>
                  <select value={virtualForm.source_parameter_ids[0]} onChange={(e) => handleSourceParamChange(0, e.target.value)} className="w-full bg-white/60 border border-white/80 rounded-xl p-3 text-xs font-bold outline-none appearance-none">
                    <option value="">-- בחר פרמטר --</option>
                    {parameters.filter(p => !p.is_virtual || p.id !== editingId).map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                    ))}
                  </select>
                </div>

                {virtualForm.calculation_type !== 'conversion' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">פרמטר מקור ב'</label>
                    <select value={virtualForm.source_parameter_ids[1]} onChange={(e) => handleSourceParamChange(1, e.target.value)} className="w-full bg-white/60 border border-white/80 rounded-xl p-3 text-xs font-bold outline-none appearance-none">
                      <option value="">-- בחר פרמטר --</option>
                      {parameters.filter(p => !p.is_virtual || p.id !== editingId).map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">מכפיל פקטור (Multiplier)</label>
                  <input type="number" step="any" name="multiplier" value={virtualForm.multiplier} onChange={handleVirtualChange} className="w-full bg-white/60 border border-white/80 rounded-xl p-3 text-xs font-bold outline-none focus:ring-2 focus:ring-zinc-900/5" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mr-2">אסטרטגיית סיכום קומבו</label>
                  <select name="aggregation_strategy" value={virtualForm.aggregation_strategy} onChange={handleVirtualChange} className="w-full bg-white/60 border border-white/80 rounded-xl p-3 text-xs font-bold outline-none appearance-none">
                    <option value="max">ערך מקסימלי (Max Compound)</option>
                    <option value="sum">סכום מצטבר (Sum Compound)</option>
                    <option value="avg">ממוצע ריצה (Avg Compound)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Controls Layout */}
          <div className="flex justify-end gap-3 border-t border-zinc-900/5 pt-4">
            {editingId && (
              <button type="button" onClick={resetForms} className="px-6 py-3 bg-white/80 border border-zinc-200 rounded-xl text-zinc-500 font-bold text-xs hover:bg-white transition-all">
                ביטול
              </button>
            )}
            <button type="submit" className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md hover:bg-zinc-800 transition-all active:scale-95">
              {editingId ? 'שמור שינויים' : creationMode === 'raw' ? 'הוסף פרמטר בסיסי' : 'הקם קומבו וירטואלי'}
            </button>
          </div>

        </form>
      </div>

      {/* --- DATA MATRIX VISUAL REGISTRY LIST --- */}
      <div className="border border-zinc-100 rounded-2xl overflow-hidden shadow-sm bg-white/20">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-zinc-100/50 text-zinc-400 uppercase text-[10px] font-black tracking-wider border-b border-zinc-200/60">
              <th className="px-6 py-4">סוג המדד</th>
              <th className="px-6 py-4">שם הפרמטר</th>
              <th className="px-6 py-4">יחידה</th>
              <th className="px-6 py-4">נוסחה / חוקיות מערכת</th>
              <th className="px-6 py-4 text-left">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-10 text-center text-xs font-bold text-zinc-400 uppercase animate-pulse">Syncing Metric Schemas...</td>
              </tr>
            ) : parameters.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-10 text-center text-xs font-bold text-zinc-300 italic">לא הוגדרו עדיין פרמטרי מדידה בקבוצה זו</td>
              </tr>
            ) : (
              parameters.map(param => (
                <tr key={param.id} className="group transition-all hover:bg-white/40">
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      param.is_virtual ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {param.is_virtual ? 'וירטואלי 🧬' : 'בסיסי 🛠️'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-black text-zinc-900 text-sm">{param.name}</td>
                  <td className="px-6 py-4 font-mono text-xs text-zinc-500">{param.unit}</td>
                  <td className="px-6 py-4 text-xs font-bold text-zinc-600">
                    {param.is_virtual ? (
                      <span className="bg-purple-50/60 px-3 py-1 rounded-lg border border-purple-100/40 font-mono text-[11px] text-purple-600">
                        Type: {param.calculation_type} | Fact: x{param.multiplier}
                      </span>
                    ) : (
                      <span className="text-zinc-400 font-mono text-[11px]">Raw Field [Agg: {param.aggregation_strategy}]</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => startEdit(param)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors active:scale-90">✏️</button>
                      <button type="button" onClick={() => handleDelete(param.id)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors active:scale-90">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default ParameterManager;