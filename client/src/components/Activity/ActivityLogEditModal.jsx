import React, { useState, useContext, useCallback } from 'react';
import { useActivity } from '../../hooks/useActivity';
import { ParameterContext } from '../../contexts/ParameterContext';

/**
 * ActivityLogEditModal Component - High-end performance editor.
 * Features real-time arithmetic recalculation for virtual parameters.
 */
const ActivityLogEditModal = ({ log, onClose }) => {
  const { editLog } = useActivity();
  const { parameters } = useContext(ParameterContext);
  
  /**
   * Helper: Formats timestamp for standard HTML datetime-local inputs.
   */
  const formatForInput = (dateStr) => {
    const d = new Date(dateStr);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [timestamp, setTimestamp] = useState(formatForInput(log.timestamp));
  const [performanceData, setPerformanceData] = useState([...log.performance_data]);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Internal Arithmetic Engine: Synchronizes virtual metrics during live editing.
   */
  const runMath = useCallback((type, values, multiplier) => {
    const nums = values.map(v => parseFloat(v) || 0);
    switch (type) {
      case 'sum': return nums.reduce((a, b) => a + b, 0);
      case 'subtract': return nums[0] - (nums[1] || 0);
      case 'multiply': return nums.reduce((a, b) => a * b, 1);
      case 'divide': return nums[1] !== 0 ? nums[0] / nums[1] : 0;
      case 'percentage': return nums[1] !== 0 ? (nums[0] / nums[1]) * 100 : 0;
      case 'conversion': return nums[0] * (multiplier || 1);
      default: return 0;
    }
  }, []);

  /**
   * Change Handler: Updates raw values and triggers recursive recalculation 
   * for any virtual dependencies in the set.
   */
  const handleParamChange = (pId, newValue) => {
    const updatedData = [...performanceData];
    const targetIdx = updatedData.findIndex(p => p.parameter_id === pId);
    if (targetIdx === -1) return;
    
    updatedData[targetIdx] = { ...updatedData[targetIdx], value: newValue };

    const currentValuesMap = {};
    updatedData.forEach(p => {
      currentValuesMap[p.parameter_id] = p.value;
    });

    const fullyUpdatedData = updatedData.map(pEntry => {
      const meta = parameters.find(m => m.id === pEntry.parameter_id);
      if (meta?.is_virtual) {
        const sourceIds = meta.source_parameter_ids || [];
        const sourceValues = sourceIds.map(sId => currentValuesMap[sId] || 0);
        const result = runMath(meta.calculation_type, sourceValues, meta.multiplier);
        return {
          ...pEntry,
          value: result.toFixed(2).replace(/\.00$/, "")
        };
      }
      return pEntry;
    });

    setPerformanceData(fullyUpdatedData);
  };

  /**
   * Dispatches the updated record to the persistence layer.
   */
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const cleanPerformanceData = performanceData.map(p => ({
        parameter_id: p.parameter_id,
        value: String(p.value)
      }));

      await editLog(log.id, {
        timestamp: new Date(timestamp).toISOString(),
        performance_data: cleanPerformanceData
      });
      onClose();
    } catch (err) {
      alert("שגיאה בעדכון הנתונים");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-500">
      
      <div className="relative w-full max-w-xl bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[3rem] shadow-2xl overflow-hidden font-sans animate-in zoom-in-95 duration-500" dir="rtl">
        
        {/* Floating Header */}
        <div className="p-10 border-b border-white/40">
          <h3 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase">עריכת תיעוד ביצוע</h3>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mt-1">Live Performance Record Editor</p>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-10 space-y-10 max-h-[60vh] overflow-y-auto scrollbar-hide">
          
          {/* Timestamp Module */}
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mr-2">מועד הביצוע המעודכן</label>
            <input 
              type="datetime-local" 
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full bg-white/60 border border-white/80 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all shadow-sm"
            />
          </div>

          {/* Performance Parameters Grid */}
          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mr-2">נתוני המדידה</label>
            <div className="grid gap-4">
              {performanceData.map((param) => {
                const meta = parameters.find(m => m.id === param.parameter_id);
                const isVirtual = meta?.is_virtual;

                return (
                  <div key={param.parameter_id} className={`flex items-center justify-between p-6 rounded-[1.5rem] border transition-all duration-500 ${
                    isVirtual 
                      ? 'bg-blue-600/5 border-blue-200/40 shadow-inner' 
                      : 'bg-white/80 border-white/40 shadow-sm'
                  }`}>
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-xs font-black uppercase ${isVirtual ? 'text-blue-600' : 'text-zinc-500'}`}>
                        {param.parameter_name}
                      </span>
                      {isVirtual && (
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                          Auto-Recalculating
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {isVirtual ? (
                        <div className="text-xl font-black text-blue-600 tabular-nums px-4 tracking-tight">{param.value}</div>
                      ) : (
                        <input 
                          type="number" 
                          value={param.value}
                          onChange={(e) => handleParamChange(param.parameter_id, e.target.value)}
                          className="w-24 bg-white border border-zinc-100 rounded-xl py-3 text-center text-sm font-black text-zinc-900 focus:ring-4 focus:ring-zinc-900/5 transition-all outline-none"
                        />
                      )}
                      <span className="text-[10px] font-black text-zinc-300 uppercase w-10 text-right">{param.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions Suite */}
        <div className="p-10 bg-white/40 border-t border-white/40 flex gap-4">
          <button 
            onClick={onClose} 
            disabled={isSaving} 
            className="flex-1 py-5 rounded-[1.5rem] bg-white/60 text-zinc-400 hover:text-zinc-900 border border-white/80 font-black text-xs uppercase tracking-widest transition-all active:scale-95"
          >
            ביטול
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="flex-[2] py-5 rounded-[1.5rem] bg-zinc-900 text-white font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-zinc-900/20 hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? 'Synchronizing...' : 'שמור שינויים'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogEditModal;