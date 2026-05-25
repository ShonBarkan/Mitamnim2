import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useExercise } from '../../../contexts/ExerciseContext';
import { useExerciseLog } from '../../../contexts/ExerciseLogContext';
import FrontendLogger from '../../../utils/logger';

const ExerciseLogForm = ({ selectedUserId, canModifyLogs, editLogToLoad, onEditComplete }) => {
  const { exercises, fetchExercises } = useExercise() || {};
  const { createLog, updateLog, loading: logsLoading } = useExerciseLog() || {};

  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState(0); 
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [dryParams, setDryParams] = useState({});
  const [editingLogId, setEditingLogId] = useState(null);
  
  // Unified Search State
  const [searchQuery, setSearchQuery] = useState('');

  const QUICK_OPTIONS = [5, 10, 20, 50, 100];

  useEffect(() => {
    if (typeof fetchExercises === 'function') fetchExercises();
  }, [fetchExercises]);

  const resetForm = useCallback(() => {
    setIsCreating(false);
    setStep(0);
    setEditingLogId(null);
    setSelectedExerciseId('');
    setDryParams({});
    setSearchQuery('');
  }, []);

  useEffect(() => {
    resetForm();
  }, [selectedUserId, resetForm]);

  // Unified Filter Logic: Search in name OR tags
  const filteredExercises = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return exercises?.filter(ex => {
      const nameMatch = ex.name.toLowerCase().includes(query);
      const tagMatch = ex.tags?.some(t => t.name.toLowerCase().includes(query));
      return nameMatch || tagMatch;
    });
  }, [exercises, searchQuery]);

  useEffect(() => {
    if (!editLogToLoad || !canModifyLogs) return;

    setEditingLogId(editLogToLoad.id);
    setSelectedExerciseId(editLogToLoad.exercise_id.toString());
    setIsCreating(true);
    setStep(1); 

    const existingParams = {};
    if (Array.isArray(editLogToLoad.params)) {
      editLogToLoad.params.forEach((p) => {
        existingParams[p.parameter_name] = p.value;
      });
    }
    setDryParams(existingParams);
    onEditComplete?.();
  }, [editLogToLoad, canModifyLogs, onEditComplete]);

  const activeExercise = useMemo(() => {
    if (!exercises || !Array.isArray(exercises)) return null;
    return exercises.find((ex) => ex && ex.id === parseInt(selectedExerciseId, 10)) || null;
  }, [selectedExerciseId, exercises]);

  const { manualParams, virtualParams } = useMemo(() => {
    if (!activeExercise || !Array.isArray(activeExercise.parameters)) {
      return { manualParams: [], virtualParams: [] };
    }
    return {
      manualParams: activeExercise.parameters.filter((p) => p && !p.is_virtual),
      virtualParams: activeExercise.parameters.filter((p) => p && p.is_virtual),
    };
  }, [activeExercise]);

  const calculatedVirtuals = useMemo(() => {
    const results = {};
    if (!activeExercise?.parameters) return results;
    const paramMap = new Map(activeExercise.parameters.map(p => [p.id, p]));
    
    virtualParams.forEach((vp) => {
      const sourceValues = (vp.source_parameter_ids || []).map(id => {
        const source = paramMap.get(id);
        return source ? (dryParams[source.name] || 0) : 0;
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
  }, [virtualParams, dryParams, activeExercise]);

  const handleSubmit = async () => {
    if (!activeExercise || !canModifyLogs) return;
    try {
      const paramsSnapshot = [
        ...manualParams.map((p) => ({ parameter_name: p.name, parameter_unit: p.unit, value: dryParams[p.name] || 0 })),
        ...virtualParams.map((vp) => ({ parameter_name: vp.name, parameter_unit: vp.unit, value: parseFloat(calculatedVirtuals[vp.name] || 0) })),
      ];
      if (editingLogId) {
        await updateLog(editingLogId, { params: paramsSnapshot });
      } else {
        await createLog({ user_id: selectedUserId, exercise_id: activeExercise.id, exercise_name: activeExercise.name, sets: 1, params: paramsSnapshot });
      }
      resetForm();
    } catch (error) { FrontendLogger.error('EXERCISE_LOG_FORM', 'Submission failed', error); }
  };

  return (
    <div className="mb-8 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">{editingLogId ? 'עריכת סט' : 'תיעוד סט חדש'}</h2>
        <button className={`px-4 py-2 text-white font-medium rounded-lg ${isCreating ? 'bg-gray-500' : 'bg-blue-600'}`} onClick={() => isCreating ? resetForm() : setIsCreating(true)}>
          {isCreating ? 'ביטול' : '+ הוסף סט'}
        </button>
      </div>

      {isCreating && (
        <div className="border-t pt-6 space-y-6">
          {/* Step 0: Search & Selection */}
          {step === 0 && (
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="חיפוש תרגיל או תגית..." 
                className="w-full p-3 border rounded-lg" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {filteredExercises?.map(ex => (
                    <button key={ex.id} className="p-3 border rounded hover:bg-blue-50 text-right" onClick={() => { setSelectedExerciseId(ex.id.toString()); setStep(1); }}>
                        <div className="font-bold">{ex.name}</div>
                        <div className="text-xs text-blue-600 font-medium">{ex.tags?.map(t => t.name).join(', ')}</div>
                    </button>
                ))}
              </div>
            </div>
          )}

          {/* Steps 1..N: Manual Params */}
          {step > 0 && step <= manualParams.length && (
            <div>
              <h3 className="text-lg font-bold mb-4">
                כמה {manualParams[step - 1].name} ({manualParams[step - 1].unit}) ?
              </h3>
              <input
                type="number"
                className="w-full p-4 text-2xl border rounded-lg text-center mb-4"
                value={dryParams[manualParams[step - 1].name] || ''}
                onChange={(e) => setDryParams(prev => ({ ...prev, [manualParams[step - 1].name]: parseFloat(e.target.value) || 0 }))}
              />
              <div className="grid grid-cols-5 gap-2">
                {QUICK_OPTIONS.map(val => (
                  <button key={val} className="p-3 bg-gray-100 rounded hover:bg-blue-100" onClick={() => setDryParams(prev => ({ ...prev, [manualParams[step - 1].name]: val }))}>{val}</button>
                ))}
              </div>
            </div>
          )}

          {/* Summary Step */}
          {step > manualParams.length && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold mb-2">סיכום סט: {activeExercise?.name}</h3>
              {manualParams.map(p => <div key={p.id}>{p.name}: {dryParams[p.name]} {p.unit}</div>)}
              {virtualParams.map(vp => <div key={vp.id} className="text-blue-600 font-bold">{vp.name}: {calculatedVirtuals[vp.name]}</div>)}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <button disabled={step === 0} onClick={() => setStep(s => s - 1)} className="px-4 py-2 border rounded">אחורה</button>
            {step < manualParams.length ? (
              <button onClick={() => setStep(s => s + 1)} className="px-6 py-2 bg-blue-600 text-white rounded">הבא</button>
            ) : step === manualParams.length ? (
              <button onClick={() => setStep(s => s + 1)} className="px-6 py-2 bg-blue-600 text-white rounded">סיכום</button>
            ) : (
              <button onClick={handleSubmit} className="px-6 py-2 bg-green-600 text-white rounded">{logsLoading ? 'שומר...' : 'סיום ושליחה'}</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseLogForm;