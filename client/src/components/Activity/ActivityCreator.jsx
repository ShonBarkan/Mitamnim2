import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useActivity } from '../../hooks/useActivity';
import { ParameterContext } from '../../contexts/ParameterContext';
import { ActiveParamContext } from '../../contexts/ActiveParamContext';
import ExerciseDrillDown from './ExerciseDrillDown';
import StepByStepParameterForm from './StepByStepParameterForm';

const ActivityCreator = ({ initialExercise = null, onComplete }) => {
  const { addLog } = useActivity();
  const { parameters } = useContext(ParameterContext);
  const { activeParams, fetchActiveParams, loading: paramsLoading } = useContext(ActiveParamContext);

  const [currentExercise, setCurrentExercise] = useState(initialExercise);
  const [step, setStep] = useState(
    initialExercise && !initialExercise.has_children ? 'entry' : 'selection'
  );
  
  const [logTimestamp, setLogTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    if (initialExercise) {
      setCurrentExercise(initialExercise);
      if (!initialExercise.has_children) {
        fetchActiveParams(initialExercise.id);
        setStep('entry');
      } else {
        setStep('selection');
      }
    } else {
      setCurrentExercise(null);
      setStep('selection');
    }
  }, [initialExercise, fetchActiveParams]);

  const calculatedResults = useMemo(() => {
    if (step !== 'summary') return [];
    const valuesByParamId = {};
    
    performanceData.forEach(item => {
      const val = item.value !== undefined ? item.value : item.score;
      if (item.parameter_id !== undefined && val !== undefined && val !== '') {
        valuesByParamId[item.parameter_id] = parseFloat(val);
      }
    });

    return activeParams.map(ap => {
      const paramMeta = parameters.find(p => p.id === ap.parameter_id);
      const isVirtual = paramMeta?.is_virtual || false;
      const unit = paramMeta?.unit || ap.parameter_unit || '';
      const name = paramMeta?.name || ap.parameter_name || '';

      let finalValue = "0";

      if (!isVirtual) {
        const found = performanceData.find(item => item.parameter_id === ap.parameter_id);
        finalValue = found ? (found.value !== undefined ? found.value : found.score) : "0";
      } else {
        let result = null;
        const sources = paramMeta?.source_parameter_ids || [];
        const sourceValues = sources.map(id => valuesByParamId[id]).filter(v => !isNaN(v));
        
        if (sourceValues.length === sources.length && sources.length > 0) {
          switch (paramMeta.calculation_type) {
            case 'conversion': result = sourceValues[0] * (paramMeta.multiplier || 1); break;
            case 'sum': result = sourceValues.reduce((a, b) => a + b, 0); break;
            case 'subtract': result = sourceValues[0] - sourceValues[1]; break;
            case 'multiply': result = sourceValues.reduce((a, b) => a * b, 1); break;
            case 'divide': result = (sourceValues.length >= 2 && sourceValues[1] !== 0) ? sourceValues[0] / sourceValues[1] : null; break;
            case 'percentage': result = (sourceValues.length >= 2 && sourceValues[1] !== 0) ? (sourceValues[0] / sourceValues[1]) * 100 : null; break;
            default: result = null;
          }
        }
        finalValue = result !== null ? result.toFixed(2).replace(/\.00$/, '') : "0";
      }

      return { 
        parameter_id: ap.parameter_id,
        parameter_name: name,
        unit: unit,
        value: finalValue, 
        is_virtual: isVirtual 
      };
    });
  }, [step, performanceData, activeParams, parameters]);

  const handleExerciseSelect = async (exercise) => {
    setCurrentExercise(exercise);
    if (!exercise.has_children) {
      await fetchActiveParams(exercise.id);
      setStep('entry');
    }
  };

  const handleReviewRequest = (data) => {
    setPerformanceData(data);
    setStep('summary');
  };

  const handleFinalSubmit = async () => {
    const finalPayload = calculatedResults.map(res => ({
      parameter_id: res.parameter_id,
      parameter_name: res.parameter_name,
      unit: res.unit,
      value: res.value
    }));

    try {
      await addLog({
        exercise_id: currentExercise.id,
        timestamp: new Date(logTimestamp).toISOString(),
        performance_data: finalPayload
      });
      if (onComplete) onComplete();
      resetCreator();
    } catch (err) {
      alert("שגיאה בשמירת האימון");
    }
  };

  const resetCreator = () => {
    setPerformanceData([]);
    if (!initialExercise) {
      setCurrentExercise(null);
      setStep('selection');
    } else if (initialExercise.has_children) {
      setCurrentExercise(initialExercise);
      setStep('selection');
    } else {
      setStep('entry');
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-2 font-sans" dir="rtl">
      {/* Dynamic Header */}
      <header className="px-6 py-8 border-b border-zinc-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-3xl font-black text-zinc-900 tracking-tighter">
            {step === 'summary' ? 'בדיקת נתונים' : 'תיעוד אימון'}
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
            {step === 'selection' ? 'Step 1: Choose Exercise' : step === 'entry' ? 'Step 2: Enter Metrics' : 'Step 3: Final Review'}
          </p>
        </div>

        {currentExercise && (
          <div className="flex items-center gap-3 bg-zinc-50 px-4 py-2 rounded-2xl border border-zinc-100 shadow-sm">
            <span className="text-sm font-black text-zinc-800">{currentExercise.name}</span>
            {(step !== 'selection' && (!initialExercise || initialExercise.has_children)) && (
              <button 
                onClick={resetCreator} 
                className="text-[10px] font-bold text-blue-600 hover:underline border-r border-zinc-200 pr-3 mr-1"
              >
                החלף תרגיל
              </button>
            )}
          </div>
        )}
      </header>

      <div className="p-6">
        {/* Step 1: Selection */}
        {step === 'selection' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ExerciseDrillDown 
              onSelect={handleExerciseSelect} 
              initialParentId={initialExercise?.id || null} 
            />
          </div>
        )}

        {/* Step 2: Data Entry */}
        {step === 'entry' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-zinc-100">
              <label className="text-[11px] font-black uppercase tracking-widest text-zinc-400 block mb-3 mr-2">מועד האימון</label>
              <input 
                type="datetime-local" 
                value={logTimestamp} 
                onChange={(e) => setLogTimestamp(e.target.value)} 
                className="w-full bg-white border border-zinc-200 rounded-2xl px-5 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 transition-all shadow-sm" 
              />
            </div>
            
            {paramsLoading ? (
              <div className="flex flex-col items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4" />
                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Loading metrics...</p>
              </div>
            ) : (
              <StepByStepParameterForm 
                params={activeParams.filter(ap => {
                    const meta = parameters.find(p => p.id === ap.parameter_id);
                    return meta && !meta.is_virtual;
                })} 
                onSubmit={handleReviewRequest}
                onCancel={resetCreator}
              />
            )}
          </div>
        )}

        {/* Step 3: Summary & Submit */}
        {step === 'summary' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="bg-zinc-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                <h4 className="text-white/50 text-[11px] font-black uppercase tracking-[0.2em] mb-6">סיכום ביצועים סופי</h4>
                
                <div className="grid gap-4 relative z-10">
                  {calculatedResults.map(res => (
                    <div 
                      key={res.parameter_id} 
                      className={`flex justify-between items-center p-5 rounded-2xl transition-all border ${
                        res.is_virtual 
                        ? 'bg-blue-600/10 border-blue-500/20' 
                        : 'bg-white/5 border-white/5'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${res.is_virtual ? 'text-blue-400' : 'text-zinc-400'}`}>
                          {res.parameter_name}
                        </span>
                        {res.is_virtual && <span className="text-[8px] font-black text-blue-500/50 uppercase tracking-widest mt-0.5">Calculated Result</span>}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">{res.value}</span>
                        <span className="text-xs font-bold text-zinc-500 uppercase">{res.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleFinalSubmit} 
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 rounded-[1.5rem] font-black text-lg transition-all shadow-xl shadow-blue-500/20 active:scale-95"
              >
                אשר ושמור תיעוד
              </button>
              <button 
                onClick={() => setStep('entry')} 
                className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-8 py-5 rounded-[1.5rem] font-black text-lg transition-all active:scale-95"
              >
                חזור
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityCreator;