import React, { useState } from 'react';
import ParameterValueInput from './ParameterValueInput';

/**
 * StepByStepParameterForm - Wizard interface for step-by-step parameter logging.
 * Refactored to premium Arctic Mirror glassmorphism styling and normalized context keys.
 */
const StepByStepParameterForm = ({ params, onSubmit, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState({});

  // Render empty state if no active parameters are assigned to this exercise
  if (!params || params.length === 0) {
    return (
      <div className="text-center py-16 px-8 bg-white/20 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-white/40">
        <p className="text-zinc-400 font-bold mb-8 italic">לא הוגדרו פרמטרים לתרגיל זה.</p>
        <button 
          onClick={onCancel} 
          className="px-8 py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95"
        >
          ביטול
        </button>
      </div>
    );
  }

  const currentParam = params[currentIndex];
  const paramId = currentParam.id || currentParam.parameter_id;
  const isLastStep = currentIndex === params.length - 1;
  const progress = ((currentIndex + 1) / params.length) * 100;

  const handleValueChange = (val) => {
    setResults({ ...results, [paramId]: val });
  };

  const nextStep = () => {
    if (!results[paramId]) return;
    setCurrentIndex(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentIndex(prev => prev - 1);
  };

  /**
   * Bundles all wizard steps into a structured payload for calculation and dispatch.
   */
  const handleFinish = () => {
    if (!results[paramId]) return;

    const performanceData = params.map(p => {
      const pId = p.id || p.parameter_id;
      return {
        parameter_id: pId,
        parameter_name: p.name || p.parameter_name,
        unit: p.unit || p.parameter_unit,
        value: String(results[pId])
      };
    });

    onSubmit(performanceData);
  };

  return (
    <div className="w-full font-sans space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Progress & Metadata Bar */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-600">
              Metric Progress
            </span>
            <h4 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">
              {currentParam.name || currentParam.parameter_name}
            </h4>
          </div>
          <span className="text-xs font-black text-zinc-400 tabular-nums bg-white/60 border border-white/80 px-3 py-1 rounded-lg shadow-sm">
            {currentIndex + 1} / {params.length}
          </span>
        </div>

        {/* Custom Premium Progress Bar */}
        <div className="h-3 w-full bg-white/40 border border-white/60 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(37,99,235,0.3)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Input Display Container */}
      <div className="py-12 min-h-[300px] flex items-center justify-center bg-white/40 backdrop-blur-xl rounded-[3rem] border border-white/60 shadow-inner">
        <div className="w-full max-w-sm px-6">
          <ParameterValueInput
            unit={currentParam.unit || currentParam.parameter_unit}
            defaultValue={currentParam.default_value}
            value={results[paramId] || ''}
            onChange={handleValueChange}
          />
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-4">
        {currentIndex > 0 ? (
          <button 
            type="button"
            onClick={prevStep} 
            className="flex-1 bg-white/60 text-zinc-400 hover:text-zinc-900 border border-white/80 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all active:scale-95"
          >
            חזור
          </button>
        ) : (
          <button 
            type="button"
            onClick={onCancel} 
            className="flex-1 bg-white/60 text-zinc-400 border border-white/80 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all active:scale-95"
          >
            ביטול
          </button>
        )}

        {isLastStep ? (
          <button 
            type="button"
            onClick={handleFinish} 
            disabled={!results[paramId]}
            className="flex-[2] bg-zinc-900 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-zinc-900/20 transition-all active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed"
          >
            סיום ושמירה
          </button>
        ) : (
          <button 
            type="button"
            onClick={nextStep} 
            disabled={!results[paramId]}
            className="flex-[2] bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] disabled:opacity-20 disabled:cursor-not-allowed hover:bg-blue-700"
          >
            הבא
          </button>
        )}
      </div>

      {/* Behavioral Notice Footer */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-xs">⏱️</span>
        <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-wide italic">
          מומלץ להזין נתונים מיד בתום הביצוע לדיוק מרבי במערכת
        </p>
      </div>
    </div>
  );
};

export default StepByStepParameterForm;