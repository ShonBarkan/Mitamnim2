import React, { useState, useMemo } from 'react';
import { Edit2, Trash2, Save, X } from 'lucide-react';

// Helper to convert UTC DB time to proper Local Time for the datetime-local input
const getLocalIsoString = (dateString) => {
  const date = new Date(dateString);
  const tzOffset = date.getTimezoneOffset() * 60000;
  // Subtract offset to get local time, then slice to fit datetime-local format (YYYY-MM-DDThh:mm)
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const LogEntryRow = ({ log, exercise, isEditing, onStartEdit, onSave, onCancel, onDelete, canModify }) => {
  const [editParams, setEditParams] = useState(() => 
    log.params.reduce((acc, p) => ({ ...acc, [p.parameter_name]: p.value }), {})
  );
  
  // Use the helper to ensure the input shows the correct local time
  const [editDate, setEditDate] = useState(() => getLocalIsoString(log.created_at));

  const { manualParams, virtualParams } = useMemo(() => {
    if (!exercise || !Array.isArray(exercise.parameters)) {
      return { manualParams: [], virtualParams: [] };
    }
    return {
      manualParams: exercise.parameters.filter(p => !p.is_virtual),
      virtualParams: exercise.parameters.filter(p => p.is_virtual)
    };
  }, [exercise]);

  const calculatedVirtuals = useMemo(() => {
    const results = {};
    if (!exercise?.parameters) return results;

    const getVal = (name) => editParams[name] || 0;
    const paramMap = new Map(exercise.parameters.map(p => [p.id, p]));

    virtualParams.forEach(vp => {
      const sourceValues = (vp.source_parameter_ids || []).map(id => {
        const source = paramMap.get(id);
        return source ? getVal(source.name) : 0;
      });

      const val1 = sourceValues[0] || 0;
      const val2 = sourceValues[1] || 0;

      switch (vp.calculation_type) {
        case 'multiply': results[vp.name] = (val1 * val2) * (vp.multiplier || 1); break;
        case 'conversion': results[vp.name] = val1 * (vp.multiplier || 1); break;
        case 'sum': results[vp.name] = (val1 + val2) * (vp.multiplier || 1); break;
        case 'subtract': results[vp.name] = (val1 - val2) * (vp.multiplier || 1); break;
        case 'divide': results[vp.name] = val2 !== 0 ? (val1 / val2) * (vp.multiplier || 1) : 0; break;
        default: results[vp.name] = 0;
      }
    });
    return results;
  }, [virtualParams, editParams, exercise]);

  const handleParamChange = (name, value) => {
    setEditParams(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSave = () => {
    // Convert the local time from the input back to a proper standard ISO string for the backend
    const localDate = new Date(editDate);
    const tzOffset = localDate.getTimezoneOffset() * 60000;
    const standardIsoDate = new Date(localDate.getTime() + tzOffset).toISOString();

    const updatedParams = [
      ...manualParams.map(p => ({
        parameter_name: p.name,
        parameter_unit: p.unit,
        value: editParams[p.name] ?? 0
      })),
      ...virtualParams.map(vp => ({
        parameter_name: vp.name,
        parameter_unit: vp.unit,
        value: parseFloat(calculatedVirtuals[vp.name] || 0)
      }))
    ];
    
    onSave({ created_at: standardIsoDate, params: updatedParams });
  };

  if (isEditing) {
    return (
      <div className="p-5 bg-blue-50/80 rounded-2xl border border-blue-200/60 shadow-inner w-full mb-2 animate-in fade-in duration-200">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-5 pb-4 border-b border-blue-200/50">
            <span className="font-black text-lg text-blue-900">{log.exercise_name}</span>
            <div className="flex-1" />
            <input 
                type="datetime-local" 
                value={editDate} 
                onChange={(e) => setEditDate(e.target.value)}
                className="p-2 bg-white border border-blue-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-bold text-gray-700"
            />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {manualParams.map(p => (
            <div key={p.id} className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-blue-800/70 tracking-wider">
                {p.name} ({p.unit})
              </label>
              <input 
                type="number"
                value={editParams[p.name] ?? ''}
                onChange={(e) => handleParamChange(p.name, e.target.value)}
                className="w-full p-2.5 border border-blue-200 rounded-xl bg-white text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
            </div>
          ))}
          {virtualParams.map(vp => (
             <div key={vp.id} className="space-y-1.5">
               <label className="text-[10px] font-black uppercase text-indigo-600/70 tracking-wider">
                 {vp.name} (מחושב)
               </label>
               <div className="w-full p-2.5 border border-indigo-100 rounded-xl bg-indigo-50/50 text-indigo-900 font-mono text-sm font-bold flex items-center h-[42px]">
                  {calculatedVirtuals[vp.name] || '0'}
               </div>
             </div>
          ))}
        </div>
        
        <div className="flex gap-3 justify-end pt-5 mt-2 border-t border-blue-200/50">
          <button 
            onClick={onCancel} 
            className="flex items-center gap-1.5 text-xs text-gray-500 bg-white hover:bg-gray-100 border border-gray-200 px-4 py-2 rounded-xl font-bold transition-all active:scale-95"
          >
            <X size={14}/> ביטול
          </button>
          <button 
            onClick={handleSave} 
            className="flex items-center gap-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-blue-600/20"
          >
            <Save size={14}/> שמור שינויים
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex flex-col lg:flex-row justify-between lg:items-center py-3 px-4 mb-2 bg-white hover:bg-zinc-50 border border-zinc-100 rounded-2xl transition-all shadow-sm hover:shadow-md gap-4">
      <div className="flex-1 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
        <div className="flex items-center min-w-[150px]">
          <span className="font-black text-sm text-zinc-900">{log.exercise_name}</span>
        </div>
        
        {log.params && log.params.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
                {log.params.map((param, idx) => (
                    <div key={idx} className="flex flex-col px-3 py-1.5 rounded-xl bg-zinc-100/50 border border-zinc-200/50 min-w-[70px]">
                        <span className="text-[9px] uppercase font-black text-zinc-400 tracking-wider">
                            {param.parameter_name}
                        </span>
                        <div className="font-bold text-zinc-800 text-sm flex items-baseline gap-1">
                            {param.value} 
                            <span className="text-[10px] font-bold text-zinc-500">{param.parameter_unit}</span>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {canModify && (
        <div className="shrink-0 flex items-center gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button 
              onClick={onStartEdit} 
              className="flex items-center gap-1.5 text-[11px] bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 px-3 py-2 rounded-xl font-bold transition-colors active:scale-95 shadow-sm"
            >
              <Edit2 size={12}/> ערוך
            </button>
            <button 
              onClick={onDelete} 
              className="flex items-center gap-1.5 text-[11px] bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 px-3 py-2 rounded-xl font-bold transition-colors active:scale-95 shadow-sm"
            >
              <Trash2 size={12}/> מחק
            </button>
        </div>
      )}
    </div>
  );
};

export default LogEntryRow;