import React, { useState, useContext, useCallback } from 'react';
import { ActivityContext } from '../../../../contexts/ActivityContext';
import { ParameterContext } from '../../../../contexts/ParameterContext';
import { useToast } from '../../../../contexts/ToastContext';
import FrontendLogger from '../../../../utils/logger';

/**
 * ActivityLogEditModal Component - High-end live standalone performance node record editor.
 * Features an integrated Arithmetic Engine to recalculate virtual parameter formulas dynamically.
 * Allocated strictly inside the component-specific local nested directory pipeline.
 */
const ActivityLogEditModal = ({ log, onClose }) => {
  const { editLog } = useContext(ActivityContext);
  const { parameters } = useContext(ParameterContext);
  const { showToast } = useToast();
  
  /**
   * Helper: Formats timestamp accurately for standard HTML datetime-local input fields.
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
   * Arithmetic Engine: Computes raw values into virtual formulas row-by-row on the fly.
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
   * Change Handler: Dispatches row cell updates and triggers dynamic cascade 
   * calculation sequences across dependent virtual context nodes.
   */
  const handleParamChange = (pId, newValue) => {
    FrontendLogger.info('ACTIVITY_LOG_EDIT_MODAL', `Mutating parameter context row target ID: ${pId} with cell value: '${newValue}'`);
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
   * Dispatches the compiled layout dataset to persistence network context layers.
   */
  const handleSave = async () => {
    FrontendLogger.info('ACTIVITY_LOG_EDIT_MODAL', `Committing performance record updates for log entity ID: ${log.id}`);
    setIsSaving(true);
    
    try {
      const cleanPerformanceData = performanceData.map(p => ({
        parameter_id: p.parameter_id,
        value: String(p.value || "0")
      }));

      await editLog(log.id, {
        timestamp: new Date(timestamp).toISOString(),
        performance_data: cleanPerformanceData
      });
      
      showToast("התיעוד עודכן ושומר בהצלחה", "success");
      onClose();
    } catch (err) {
      FrontendLogger.error('ACTIVITY_LOG_EDIT_MODAL', 'Operational synchronization failure during edit patch transactions', err);
      showToast("שגיאה בתהליך עדכון הנתונים במערכת", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-400">
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-xl bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[3rem] shadow-2xl overflow-hidden font-sans animate-in zoom-in-95 duration-400" dir="rtl">
        
        {/* Floating Modal Title Frame Header */}
        <div className="p-10 border-b border-white/40 bg-white/10">
          <h3 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase m-0 leading-none">עריכת תיעוד ביצוע</h3>
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mt-2 select-none">Live Performance Record Editor</p>
        </div>

        {/* Scrollable Form Workspace Node Content */}
        <div className="p-10 space-y-10 max-h-[55vh] overflow-y-auto scrollbar-hide">
          
          {/* Timestamp Scheduling Adjustment Module */}
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mr-2 select-none">מועד הביצוע המעודכן</label>
            <input 
              type="datetime-local" 
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              className="w-full bg-white/60 border border-white/80 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all shadow-sm font-mono"
            />
          </div>

          {/* Performance Track Metric Parameters Distribution Grid */}
          <div className="space-y-4">
            <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 mr-2 select-none">נתוני המדידה והביצוע</label>
            <div className="grid gap-4">
              {performanceData.map((param) => {
                const meta = parameters.find(m => m.id === param.parameter_id);
                const isVirtual = meta?.is_virtual;

                return (
                  <div 
                    key={param.parameter_id} 
                    className={`flex items-center justify-between p-6 rounded-[1.5rem] border transition-all duration-500 ${
                      isVirtual 
                        ? 'bg-blue-600/5 border-blue-200/40 shadow-inner' 
                        : 'bg-white/80 border-white/40 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-xs font-black uppercase tracking-tight ${isVirtual ? 'text-blue-600' : 'text-zinc-500'}`}>
                        {param.parameter_name}
                      </span>
                      {isVirtual && (
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest select-none">
                          Auto-Recalculating 🧬
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {isVirtual ? (
                        <div className="text-xl font-black text-blue-600 font-mono px-4 tracking-tight">{param.value || "0"}</div>
                      ) : (
                        <input 
                          type="text" 
                          value={param.value}
                          onChange={(e) => handleParamChange(param.parameter_id, e.target.value)}
                          className="w-24 bg-white border border-zinc-100 rounded-xl py-3 text-center text-sm font-black text-zinc-900 focus:ring-4 focus:ring-zinc-900/5 transition-all outline-none font-mono shadow-sm"
                        />
                      )}
                      <span className="text-[10px] font-black text-zinc-400 uppercase w-10 text-right select-none truncate">{param.unit || 'יח\''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Controls Submission Suite Footer Panel */}
        <div className="p-10 bg-white/30 border-t border-white/40 flex gap-4">
          <button 
            type="button"
            onClick={onClose} 
            disabled={isSaving} 
            className="flex-1 py-5 rounded-[1.5rem] bg-white/60 text-zinc-400 hover:text-zinc-900 border border-white/80 font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm"
          >
            ביטול
          </button>
          <button 
            type="button"
            onClick={handleSave} 
            disabled={isSaving} 
            className="flex-[2] py-5 rounded-[1.5rem] bg-zinc-900 text-white font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-zinc-900/20 hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Synchronizing...' : 'שמור שינויים'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogEditModal;