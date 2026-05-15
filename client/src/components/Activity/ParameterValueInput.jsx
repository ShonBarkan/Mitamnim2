import React from 'react';

/**
 * ParameterValueInput Component - Premium entry module for physical data points.
 * Features a giant minimalist manual input field paired with glassmorphism quick-select nodes.
 */
const ParameterValueInput = ({ unit, value, onChange, defaultValue }) => {
  const quickValues = [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100];

  const handleQuickClick = (val) => {
    onChange(String(val));
  };

  return (
    <div className="w-full max-w-sm mx-auto font-sans" dir="rtl">
      
      {/* Primary Input Display Area */}
      <div className="flex flex-col items-center justify-center mb-12 group">
        <div className="relative flex items-center justify-center">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={defaultValue || "0"}
            className="w-48 bg-transparent border-b-2 border-white/60 focus:border-zinc-900 text-6xl font-black text-zinc-900 text-center py-4 outline-none transition-all placeholder:text-zinc-300/60 tabular-nums focus:scale-105 duration-300"
          />
          <span className="absolute -left-14 bottom-5 text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-widest shadow-sm">
            {unit || 'VAL'}
          </span>
        </div>
        <p className="mt-4 text-[9px] font-black text-zinc-400 uppercase tracking-[0.25em]">Manual Input Engine</p>
      </div>

      {/* Quick Selection Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 opacity-40">
          <div className="h-px flex-1 bg-white" />
          <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">Quick Select</p>
          <div className="h-px flex-1 bg-white" />
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {quickValues.map((val) => {
            const isSelected = value === String(val);
            return (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickClick(val)}
                className={`py-4 rounded-2xl font-black text-xs transition-all duration-300 active:scale-90 ${
                  isSelected
                    ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/10 scale-105 border border-zinc-900'
                    : 'bg-white/60 backdrop-blur-md border border-white/80 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 hover:bg-white'
                }`}
              >
                {val}
              </button>
            );
          })}
          
          {/* Functional Clear Key */}
          <button
            type="button"
            onClick={() => onChange('')}
            className="col-span-1 py-4 rounded-2xl border border-rose-100 bg-rose-50/50 text-rose-500 font-black text-[10px] uppercase tracking-wider hover:bg-rose-500 hover:text-white transition-all duration-300 active:scale-90"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParameterValueInput;