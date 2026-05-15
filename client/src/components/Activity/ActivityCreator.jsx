import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useActivity } from '../../hooks/useActivity';
import { ParameterContext } from '../../contexts/ParameterContext';

// Sub-components updated to the flat architecture
import ExerciseSelectionList from './ExerciseSelectionList';
import StepByStepParameterForm from './StepByStepParameterForm';

/**
 * ActivityCreator Component - Multi-step logging wizard for workout tracking.
 * Refactored for Flat Registry architecture and Arctic Mirror design guidelines.
 */
const ActivityCreator = ({ initialExercise = null, onComplete }) => {
  const { addLog } = useActivity();
  const { parameters } = useContext(ParameterContext);

  const [currentExercise, setCurrentExercise] = useState(initialExercise);
  const [step, setStep] = useState(initialExercise ? 'entry' : 'selection');
  const [logTimestamp, setLogTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [performanceData, setPerformanceData] = useState([]);

  // Sync initial exercise state on mount or prop change
  useEffect(() => {
    if (initialExercise) {
      setCurrentExercise(initialExercise);
      setStep('entry');
    } else {
      setCurrentExercise(null);
      setStep('selection');
    }
  }, [initialExercise]);

  /**
   * Resolves parameters mapped to the currently selected exercise object.
   */
  const activeParamsForExercise = useMemo(() => {
    if (!currentExercise || !parameters.length) return [];
    return currentExercise.active_parameter_ids
      ?.map(pId => parameters.find(p => p.id === pId))
      .filter(Boolean) || [];
  }, [currentExercise, parameters]);

  /**
   * Arithmetic Logic: Computes virtual stats based on raw inputs during the summary phase.
   */
  const calculatedResults = useMemo(() => {
    if (step !== 'summary') return [];
    const valuesByParamId = {};
    
    performanceData.forEach(item => {
      const val = item.value !== undefined ? item.value : item.score;
      if (item.parameter_id !== undefined && val !== undefined && val !== '') {
        valuesByParamId[item.parameter_id] = parseFloat(val);
      }
    });

    return activeParamsForExercise.map(paramMeta => {
      const isVirtual = paramMeta?.is_virtual || false;
      const unit = paramMeta?.unit || '';
      const name = paramMeta?.name || '';

      let finalValue = "0";

      if (!isVirtual) {
        const found = performanceData.find(item => item.parameter_id === paramMeta.id);
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
        parameter_id: paramMeta.id,
        parameter_name: name,
        unit: unit,
        value: finalValue, 
        is_virtual: isVirtual 
      };
    });
  }, [step, performanceData, activeParamsForExercise]);

  const handleExerciseSelect = (exercise) => {
    setCurrentExercise(exercise);
    setStep('entry');
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
    } else {
      setStep('entry');
    }
  };

  return (
    <div className="bg-white/30 backdrop-blur-3xl rounded-[3rem] p-4 border border-white/60 shadow-2xl" dir="rtl">
      
      {/* Dynamic Header Setup */}
      <header className="px-8 py-8 border-b border-white/40 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase">
            {step === 'summary' ? 'בדיקת נתונים' : 'תיעוד אימון'}
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">
            {step === 'selection' ? 'Step 1: Choose Exercise' : step === 'entry' ? 'Step 2: Enter Metrics' : 'Step 3: Final Review'}
          </p>
        </div>

        {currentExercise && (
          <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/80 shadow-sm">
            <span className="text-sm font-black text-zinc-900">{currentExercise.name}</span>
            {step !== 'selection' && !initialExercise && (
              <button 
                onClick={resetCreator} 
                className="text-[10px] font-black text-blue-600 uppercase tracking-wider border-r border-white/80 pr-4 mr-1 hover:text-blue-700 transition-colors"
              >
                החלף תרגיל
              </button>
            )}
          </div>
        )}
      </header>

      <div className="p-8">
        {/* Step 1: Flat Selection List */}
        {step === 'selection' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ExerciseSelectionList onSelect={handleExerciseSelect} />
          </div>
        )}

        {/* Step 2: Time and Metric Inputs */}
        {step === 'entry' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white/40 border border-white/60 p-6 rounded-[2rem] shadow-inner">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-3 mr-2">מועד האימון</label>
              <input 
                type="datetime-local" 
                value={logTimestamp} 
                onChange={(e) => setLogTimestamp(e.target.value)} 
                className="w-full bg-white border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all shadow-sm" 
              />
            </div>
            
            <StepByStepParameterForm 
              params={activeParamsForExercise.filter(p => !p.is_virtual)} 
              onSubmit={handleReviewRequest}
              onCancel={resetCreator}
            />
          </div>
        )}

        {/* Step 3: Bright Glassmorphism Final Review Card */}
        {step === 'summary' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="bg-white/50 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />
              <h4 className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 mr-2">סיכום ביצועים סופי</h4>
              
              <div className="grid gap-4 relative z-10">
                {calculatedResults.map(res => (
                  <div 
                    key={res.parameter_id} 
                    className={`flex justify-between items-center p-6 rounded-2xl transition-all border ${
                      res.is_virtual 
                        ? 'bg-blue-600/5 border-blue-200/40 shadow-inner' 
                        : 'bg-white/80 border-white/40 shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className={`text-xs font-black uppercase ${res.is_virtual ? 'text-blue-600' : 'text-zinc-500'}`}>
                        {res.parameter_name}
                      </span>
                      {res.is_virtual && (
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">
                          Calculated Result
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-3xl font-black ${res.is_virtual ? 'text-blue-600' : 'text-zinc-900'}`}>{res.value}</span>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">{res.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Suite Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleFinalSubmit} 
                className="flex-[2] bg-zinc-900 text-white px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.25em] transition-all shadow-2xl shadow-zinc-900/20 active:scale-[0.98] hover:bg-zinc-800"
              >
                אשר ושמור תיעוד
              </button>
              <button 
                onClick={() => setStep('entry')} 
                className="flex-1 bg-white/60 text-zinc-400 border border-white/80 px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all active:scale-95 hover:bg-white hover:text-zinc-900"
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