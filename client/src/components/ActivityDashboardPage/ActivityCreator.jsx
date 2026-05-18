import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useActivity } from '../../contexts/ActivityContext';
import { ParameterContext } from '../../contexts/ParameterContext';
import { useToast } from '../../contexts/ToastContext';

// Sub-components cleanly nested inside the component-specific local directory pipeline
import ExerciseSelectionList from './ActivityCreator/ExerciseSelectionList';
import StepByStepParameterForm from './ActivityCreator/StepByStepParameterForm';
import FrontendLogger from '../../utils/logger';

/**
 * ActivityCreator Component - Multi-step logging wizard for standalone workout tracking.
 * Refactored for Flat Registry architecture and Arctic Mirror glassmorphic design guidelines.
 * Features a dynamic Arithmetic Engine to compile calculated formulas during the summary phase.
 */
const ActivityCreator = ({ initialExercise = null, onComplete }) => {
  const { addLog } = useActivity();
  const { parameters } = useContext(ParameterContext);
  const { showToast } = useToast();

  const [currentExercise, setCurrentExercise] = useState(initialExercise);
  const [step, setStep] = useState(initialExercise ? 'entry' : 'selection'); // States: 'selection' | 'entry' | 'summary'
  const [logTimestamp, setLogTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [performanceData, setPerformanceData] = useState([]);

  // Sync incoming hot payload changes into localized state vectors on mount
  useEffect(() => {
    if (initialExercise) {
      FrontendLogger.info('ACTIVITY_CREATOR', 'Hydrating wizard context directly with injected template exercise parameters');
      setCurrentExercise(initialExercise);
      setStep('entry');
    } else {
      setCurrentExercise(null);
      setStep('selection');
    }
  }, [initialExercise]);

  /**
   * Resolves structural configuration mapping schemas for the selected exercise context.
   */
  const activeParamsForExercise = useMemo(() => {
    if (!currentExercise || !parameters.length) return [];
    const activeIds = currentExercise.active_parameter_ids || [];
    return activeIds
      .map(pId => parameters.find(p => Number(p.id) === Number(pId)))
      .filter(Boolean);
  }, [currentExercise, parameters]);

  /**
   * Arithmetic Engine: Processes dry row metrics into virtual evaluation results on summary steps.
   */
  const calculatedResults = useMemo(() => {
    if (step !== 'summary') return [];
    
    FrontendLogger.info('ACTIVITY_CREATOR', 'Executing summary matrix calculation algorithms on raw set records');
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
        const found = performanceData.find(item => Number(item.parameter_id) === Number(paramMeta.id));
        finalValue = found ? String(found.value !== undefined ? found.value : found.score) : "0";
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
            case 'divide': result = sourceValues[1] !== 0 ? sourceValues[0] / sourceValues[1] : null; break;
            case 'percentage': result = sourceValues[1] !== 0 ? (sourceValues[0] / sourceValues[1]) * 100 : null; break;
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
    FrontendLogger.info('ACTIVITY_CREATOR', `Target exercise row chosen inside template pool: '${exercise.exercise_name}'`);
    setCurrentExercise(exercise);
    setStep('entry');
  };

  const handleReviewRequest = (data) => {
    FrontendLogger.info('ACTIVITY_CREATOR', 'Transitioning tracking focus from raw configuration fields to final review');
    setPerformanceData(data);
    setStep('summary');
  };

  /**
   * Commits the built performance record package to network database pipelines.
   */
  const handleFinalSubmit = async () => {
    FrontendLogger.info('ACTIVITY_CREATOR', 'Initiating standalone performance log submission transaction pipeline');
    
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
      
      showToast("האימון תועד ונשמר בהצלחה ביומן", "success");
      if (onComplete) onComplete();
      resetCreator();
    } catch (err) {
      FrontendLogger.error('ACTIVITY_CREATOR', 'Database failure intercepted during activity creation submit lifecycle', err);
      showToast("שגיאה בתהליך שמירת נתוני האימון", "error");
    }
  };

  const resetCreator = () => {
    FrontendLogger.info('ACTIVITY_CREATOR', 'Purging creator wizard state maps to baseline setup');
    setPerformanceData([]);
    if (!initialExercise) {
      setCurrentExercise(null);
      setStep('selection');
    } else {
      setStep('entry');
    }
  };

  return (
    <div className="bg-white/30 backdrop-blur-3xl rounded-[3rem] p-4 border border-white/60 shadow-2xl w-full" dir="rtl">
      
      {/* Dynamic Header Setup */}
      <header className="px-6 py-6 border-b border-white/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase m-0 leading-none">
            {step === 'summary' ? 'בדיקת נתונים' : 'תיעוד אימון'}
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600 m-0 select-none">
            {step === 'selection' ? 'Step 1: Choose Exercise' : step === 'entry' ? 'Step 2: Enter Metrics' : 'Step 3: Final Review'}
          </p>
        </div>

        {currentExercise && (
          <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/80 shadow-sm animate-in fade-in duration-300">
            <span className="text-sm font-black text-zinc-900 leading-none">
              {currentExercise.exercise_name || currentExercise.name}
            </span>
            {step !== 'selection' && !initialExercise && (
              <button 
                type="button"
                onClick={resetCreator} 
                className="text-[10px] font-black text-blue-600 uppercase tracking-wider border-r border-zinc-200 pr-4 mr-1 hover:text-blue-700 transition-colors"
              >
                החלף תרגיל
              </button>
            )}
          </div>
        )}
      </header>

      <div className="p-6">
        {/* Step 1: Flat Selection Registry List */}
        {step === 'selection' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ExerciseSelectionList onSelect={handleExerciseSelect} />
          </div>
        )}

        {/* Step 2: Time and Metric Input Parameters Panels */}
        {step === 'entry' && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-white/40 border border-white/60 p-6 rounded-[2rem] shadow-inner">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-3 mr-2 select-none">מועד האימון</label>
              <input 
                type="datetime-local" 
                value={logTimestamp} 
                onChange={(e) => setLogTimestamp(e.target.value)} 
                className="w-full bg-white border border-zinc-100 rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all shadow-sm font-mono" 
              />
            </div>
            
            <StepByStepParameterForm 
              params={activeParamsForExercise.filter(p => !p.is_virtual)} 
              onSubmit={handleReviewRequest}
              onCancel={resetCreator}
            />
          </div>
        )}

        {/* Step 3: Bright Glassmorphism Final Summary Review Card Layout */}
        {step === 'summary' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="bg-white/50 backdrop-blur-2xl border border-white/80 rounded-[2.5rem] p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
              <h4 className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mb-6 mr-2 select-none">סיכום ביצועים סופי</h4>
              
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
                      <span className={`text-xs font-black uppercase tracking-tight ${res.is_virtual ? 'text-blue-600' : 'text-zinc-500'}`}>
                        {res.parameter_name}
                      </span>
                      {res.is_virtual && (
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest select-none">
                          Calculated Result 🧬
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-2 font-mono">
                      <span className={`text-3xl font-black tracking-tight ${res.is_virtual ? 'text-blue-600' : 'text-zinc-900'}`}>{res.value}</span>
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">{res.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Suite Actions Control Bar Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                type="button"
                onClick={handleFinalSubmit} 
                className="flex-[2] bg-zinc-900 text-white px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.25em] transition-all shadow-2xl shadow-zinc-900/20 active:scale-[0.98] hover:bg-zinc-800"
              >
                אשר ושמור תיעוד
              </button>
              <button 
                type="button"
                onClick={() => setStep('entry')} 
                className="flex-1 bg-white/60 text-zinc-400 border border-white/80 px-8 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all active:scale-95 hover:bg-white hover:text-zinc-900"
              >
                חזור לעריכה
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityCreator;