import React, { useState } from 'react';
import ParameterValueInput from './ParameterValueInput';

/**
 * Step-by-step form for entering performance values for multiple parameters.
 */
const StepByStepParameterForm = ({ params, onSubmit, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState({});

  if (!params || params.length === 0) {
    return (
      <div className="text-center py-12 px-6 arctic-glass rounded-[2rem] border-dashed border-zinc-200">
        <p className="text-zinc-400 font-bold mb-6 italic">לא הוגדרו פרמטרים לתרגיל זה.</p>
        <button 
          onClick={onCancel} 
          className="bg-zinc-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all"
        >
          ביטול
        </button>
      </div>
    );
  }

  const currentParam = params[currentIndex];
  const isLastStep = currentIndex === params.length - 1;
  const progress = ((currentIndex + 1) / params.length) * 100;

  const handleValueChange = (val) => {
    setResults({ ...results, [currentParam.parameter_id]: val });
  };

  const nextStep = () => {
    if (!results[currentParam.parameter_id]) {
      // כאן אפשר להחליף ב-Toast בעתיד
      return;
    }
    setCurrentIndex(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentIndex(prev => prev - 1);
  };

  const handleFinish = () => {
    if (!results[currentParam.parameter_id]) return;

    const performanceData = params.map(p => ({
      parameter_id: p.parameter_id,
      parameter_name: p.parameter_name,
      unit: p.parameter_unit,
      value: String(results[p.parameter_id])
    }));

    onSubmit(performanceData);
  };

  return (
    <div className="w-full font-sans space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Progress Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">
              Metric Progress
            </span>
            <h4 className="text-2xl font-black text-zinc-900 leading-none">
              {currentParam.parameter_name}
            </h4>
          </div>
          <span className="text-xs font-black text-zinc-400 tabular-nums">
            {currentIndex + 1} / {params.length}
          </span>
        </div>

        {/* Dynamic Bar */}
        <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-700 ease-out shadow-[0_0_12px_rgba(37,99,235,0.4)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Input Zone - Key Interaction */}
      <div className="py-6 min-h-[280px] flex items-center justify-center bg-slate-50/50 rounded-[2.5rem] border border-zinc-100 shadow-inner">
        <div className="w-full max-w-sm px-4">
            <ParameterValueInput
                unit={currentParam.parameter_unit}
                defaultValue={currentParam.default_value}
                value={results[currentParam.parameter_id] || ''}
                onChange={handleValueChange}
            />
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center gap-4">
        {currentIndex > 0 ? (
          <button 
            onClick={prevStep} 
            className="flex-1 bg-white border border-zinc-200 text-zinc-500 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-zinc-50 hover:text-zinc-900 transition-all active:scale-95"
          >
            חזור
          </button>
        ) : (
          <button 
            onClick={onCancel} 
            className="flex-1 bg-zinc-50 text-zinc-400 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-zinc-100 transition-all active:scale-95"
          >
            ביטול
          </button>
        )}

        {isLastStep ? (
          <button 
            onClick={handleFinish} 
            disabled={!results[currentParam.parameter_id]}
            className="flex-[2] bg-emerald-600 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
          >
            סיום ושמירה
          </button>
        ) : (
          <button 
            onClick={nextStep} 
            disabled={!results[currentParam.parameter_id]}
            className="flex-[2] bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-30"
          >
            הבא
          </button>
        )}
      </div>

      {/* Visual Context */}
      <p className="text-center text-[10px] font-bold text-zinc-300 uppercase tracking-tighter italic">
        * מומלץ להזין נתונים מיד בתום הסט לדיוק מרבי
      </p>
    </div>
  );
};

export default StepByStepParameterForm;