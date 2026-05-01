import React, { useState, useContext, useCallback } from 'react';
import { useActivity } from '../../hooks/useActivity';
import { ParameterContext } from '../../contexts/ParameterContext';

/**
 * Premium edit modal with real-time math recalculation.
 */
const ActivityLogEditModal = ({ log, onClose }) => {
  const { editLog } = useActivity();
  const { parameters } = useContext(ParameterContext);
  
  // Format existing timestamp for datetime-local input
  const formatForInput = (dateStr) => {
    const d = new Date(dateStr);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [timestamp, setTimestamp] = useState(formatForInput(log.timestamp));
  const [performanceData, setPerformanceData] = useState([...log.performance_data]);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Internal math engine for virtual parameters
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-300">
      
      <div className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden font-sans animate-in zoom-in-95 duration-300" dir="rtl">
        
        {/* Header Area */}
        <div className="p-8 border-b border-zinc-50">
          <h3 className="text-2xl font-black text-zinc-900 tracking-tighter">עריכת תיעוד</h3>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Update performance record</p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto scrollbar-hide">
          
          {/* Timestamp Field */}
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mr-2">זמן הביצוע</label>
            <input 
              type="datetime-local" 
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-5 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
            />
          </div>

          {/* Parameters List */}
          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mr-2">נתוני ביצוע</label>
            <div className="grid gap-3">
              {performanceData.map((param) => {
                const meta = parameters.find(m => m.id === param.parameter_id);
                const isVirtual = meta?.is_virtual;

                return (
                  <div key={param.parameter_id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    isVirtual ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-zinc-100'
                  }`}>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-zinc-800">{param.parameter_name}</span>
                      {isVirtual && <span className="text-[8px] font-black text-blue-500 uppercase tracking-tighter">Auto-Calculated</span>}
                    </div>

                    <div className="flex items-center gap-3">
                      {isVirtual ? (
                        <div className="text-lg font-black text-blue-600 tabular-nums px-3">{param.value}</div>
                      ) : (
                        <input 
                          type="number" 
                          value={param.value}
                          onChange={(e) => handleParamChange(param.parameter_id, e.target.value)}
                          className="w-20 bg-white border border-zinc-200 rounded-xl py-2 text-center text-sm font-black text-zinc-900 focus:border-zinc-900 transition-all outline-none"
                        />
                      )}
                      <span className="text-[10px] font-bold text-zinc-400 w-8">{param.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-8 bg-zinc-50/50 border-t border-zinc-50 flex gap-4">
          <button 
            onClick={onClose} 
            disabled={isSaving} 
            className="flex-1 py-4 rounded-2xl bg-white border border-zinc-200 text-zinc-500 font-black text-xs uppercase tracking-widest hover:text-zinc-900 hover:bg-white transition-all active:scale-95"
          >
            ביטול
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="flex-[2] py-4 rounded-2xl bg-zinc-900 text-white font-black text-sm uppercase tracking-widest hover:bg-zinc-800 shadow-xl shadow-zinc-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSaving ? 'מעדכן...' : 'שמור שינויים'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogEditModal;