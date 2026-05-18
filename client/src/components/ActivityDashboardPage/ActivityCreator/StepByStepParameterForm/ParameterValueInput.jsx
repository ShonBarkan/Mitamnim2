import React from 'react';

/**
 * ParameterValueInput Component - Premium entry module for single execution metrics data points.
 * Features a giant minimalist manual input field paired with glassmorphic quick-select numeric nodes.
 * Allocated strictly within the components/ActivityDashboardPage/ActivityCreator/StepByStepParameterForm local directory tree maps.
 */
const ParameterValueInput = ({ unit, value, onChange, defaultValue }) => {
  const quickValues = [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100];

  const handleQuickClick = (val) => {
    onChange(String(val));
  };

  return (
    <div className="w-full max-w-sm mx-auto font-sans" dir="rtl">
      
      {/* Primary Input Large Display Area */}
      <div className="flex flex-col items-center justify-center mb-12 group">
        <div className="relative flex items-center justify-center">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={defaultValue || "0"}
            className="w-48 bg-transparent border-b-2 border-white/60 focus:border-zinc-900 text-6xl font-black text-zinc-900 text-center py-4 outline-none transition-all placeholder:text-zinc-300/60 font-mono focus:scale-105 duration-300 appearance-none"
          />
          <span className="absolute -left-16 bottom-6 text-[10px] font-black text-blue-600 bg-blue-600/5 border border-blue-500/10 px-2.5 py-1 rounded-md uppercase tracking-widest shadow-inner select-none font-mono">
            {unit || 'VAL'}
          </span>
        </div>
        <p className="mt-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.25em] select-none">Manual Input Engine</p>
      </div>

      {/* Quick Selection Hot Chips Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 opacity-30 select-none pointer-events-none">
          <div className="h-px flex-1 bg-white" />
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">Quick Select</p>
          <div className="h-px flex-1 bg-white" />
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {quickValues.map((val) => {
            const isSelected = String(value) === String(val);
            return (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickClick(val)}
                className={`py-4 rounded-2xl font-black text-xs transition-all duration-300 active:scale-90 font-mono shadow-sm ${
                  isSelected
                    ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/10 scale-105 border border-zinc-900'
                    : 'bg-white/60 backdrop-blur-md border border-white/80 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 hover:bg-white'
                }`}
              >
                {val}
              </button>
            );
          })}
          
          {/* Functional Clear Hot Key */}
          <button
            type="button"
            onClick={() => onChange('')}
            className="col-span-1 py-4 rounded-2xl border border-rose-100 bg-rose-50 text-rose-500 font-black text-[10px] uppercase tracking-wider hover:bg-rose-500 hover:text-white transition-all duration-300 active:scale-90 shadow-sm"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParameterValueInput;