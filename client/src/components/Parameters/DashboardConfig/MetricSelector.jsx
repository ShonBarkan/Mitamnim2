import React, { useMemo } from 'react';

const MetricSelector = ({ 
  selectedExerciseId, 
  exercises = [], 
  parameters = [], 
  formulas = [], 
  conversions = [], 
  activeParams = [], 
  value, 
  onChange 
}) => {
  
  const availableMetrics = useMemo(() => {
    if (!selectedExerciseId) return [];

    console.group(`🔍 Metric Discovery: Exercise ID ${selectedExerciseId}`);
    
    // 1. Recursive search for all descendant exercise IDs (Tree)
    const getAllDescendants = (parentId) => {
      const children = exercises.filter(ex => ex.parent_id === parentId);
      let descendants = [parentId];
      children.forEach(child => {
        descendants = [...descendants, ...getAllDescendants(child.id)];
      });
      return descendants;
    };

    const relevantExerciseIds = getAllDescendants(selectedExerciseId);
    console.log("Step 1: Relevant Exercise IDs (Tree):", relevantExerciseIds);

    // 2. Identify linked parameters using the activeParams passed down
    const linkedParamIds = new Set();
    activeParams.forEach(ap => {
      if (relevantExerciseIds.includes(ap.exercise_id)) {
        linkedParamIds.add(Number(ap.parameter_id));
      }
    });
    
    const foundRawIds = Array.from(linkedParamIds);
    console.log("Step 2: Linked Parameter IDs from active_params:", foundRawIds);

    // 3. Map to actual parameter objects (Base Metrics)
    const baseMetrics = parameters
      .filter(p => linkedParamIds.has(Number(p.id)))
      .map(p => ({ id: p.id, name: p.name, unit: p.unit, type: 'גולמי' }));

    console.log(`Step 3: Matched ${baseMetrics.length} base parameters from metadata.`);

    // 4. Identify derived metrics (formulas and conversions)
    const derivedFromFormulas = formulas
      .filter(f => f.source_parameter_ids?.some(id => linkedParamIds.has(Number(id))))
      .map(f => ({ id: f.target_name, name: f.target_name, unit: f.unit, type: 'נוסחה' }));

    const derivedFromConversions = conversions
      .filter(c => linkedParamIds.has(Number(c.source_parameter_id)))
      .map(c => ({ id: c.target_name, name: c.target_name, unit: c.unit, type: 'המרה' }));

    const finalResult = [...baseMetrics, ...derivedFromFormulas, ...derivedFromConversions];
    
    console.log("Step 4: Discovery Complete.");
    console.table(finalResult);
    
    console.groupEnd();
    
    return finalResult;
  }, [selectedExerciseId, exercises, parameters, formulas, conversions, activeParams]);

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-gray-500 mr-1">2. בחר מטריקה למדידה</label>
      <select 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 rounded-lg border-none shadow-sm focus:ring-2 focus:ring-purple-500 text-sm font-medium disabled:opacity-50"
        disabled={!selectedExerciseId}
        required
      >
        <option value="">-- בחר פרמטר --</option>
        {availableMetrics.map((m, idx) => (
          <option key={`${m.id}-${idx}`} value={m.id}>
            {m.name} ({m.type}) {m.unit ? `[${m.unit}]` : ''}
          </option>
        ))}
      </select>
      {selectedExerciseId && availableMetrics.length === 0 && (
        <span className="text-[10px] text-red-400 mr-1 italic">לא הוגדרו פרמטרים פעילים לתרגיל זה</span>
      )}
    </div>
  );
};

export default MetricSelector;