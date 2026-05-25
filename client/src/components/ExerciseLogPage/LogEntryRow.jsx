import React, { useState, useMemo } from 'react';

const LogEntryRow = ({ log, exercise, isEditing, onStartEdit, onSave, onCancel, onDelete, canModify }) => {
  // Initialize state with the log's existing parameters
  const [editParams, setEditParams] = useState(() => 
    log.params.reduce((acc, p) => ({ ...acc, [p.parameter_name]: p.value }), {})
  );
  
  // Format current date for datetime-local (YYYY-MM-DDThh:mm)
  const [editDate, setEditDate] = useState(() => 
    new Date(log.created_at).toISOString().slice(0, 16)
  );

  // Split parameters into manual and virtual based on exercise definition
  const { manualParams, virtualParams } = useMemo(() => {
    if (!exercise || !Array.isArray(exercise.parameters)) {
      return { manualParams: [], virtualParams: [] };
    }
    return {
      manualParams: exercise.parameters.filter(p => !p.is_virtual),
      virtualParams: exercise.parameters.filter(p => p.is_virtual)
    };
  }, [exercise]);

  // Real-time calculation of virtual parameters
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
    // Manually format date to YYYY-MM-DD HH:MM:SS to avoid UTC shift
    const d = new Date(editDate);
    const formattedDate = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:00`;

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
    
    onSave({ created_at: formattedDate, params: updatedParams });
  };

  if (isEditing) {
    return (
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-4 shadow-sm">
        <div className="flex gap-4 items-center">
            <input 
                type="datetime-local" 
                value={editDate} 
                onChange={(e) => setEditDate(e.target.value)}
                className="p-2 border rounded text-sm"
            />
            <span className="font-bold text-gray-800">{log.exercise_name}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {manualParams.map(p => (
            <div key={p.id}>
              <label className="text-xs font-medium text-gray-600">{p.name} ({p.unit})</label>
              <input 
                type="number"
                value={editParams[p.name] ?? ''}
                onChange={(e) => handleParamChange(p.name, e.target.value)}
                className="w-full p-2 border rounded bg-white"
              />
            </div>
          ))}
          {virtualParams.map(vp => (
             <div key={vp.id}>
               <label className="text-xs font-medium text-blue-700">{vp.name} (מחושב)</label>
               <div className="w-full p-2 border rounded bg-gray-100 text-gray-500 font-mono">
                  {calculatedVirtuals[vp.name] || '0'}
               </div>
             </div>
          ))}
        </div>
        
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="text-gray-500 px-3 hover:text-gray-700">ביטול</button>
          <button onClick={handleSave} className="text-green-600 font-bold px-4 py-1.5 bg-white border border-green-200 rounded hover:bg-green-50">שמור</button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center hover:bg-gray-100 transition">
      <div>
        <h4 className="font-bold text-gray-900">{log.exercise_name}</h4>
      </div>
      <div className="flex gap-4">
        {log.params.map(p => (
           <div key={p.parameter_name} className="text-right">
             <span className="block text-[10px] text-gray-400 uppercase font-semibold">{p.parameter_name}</span>
             <span className="font-mono font-bold text-gray-800">{p.value} {p.parameter_unit}</span>
           </div>
        ))}
        {canModify && (
          <div className="flex gap-2 mr-4 border-r pr-4 border-gray-200">
             <button onClick={onStartEdit} className="text-blue-500 text-sm hover:underline">ערוך</button>
             <button onClick={onDelete} className="text-red-500 text-sm hover:underline">מחק</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogEntryRow;