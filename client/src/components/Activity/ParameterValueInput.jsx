import React from 'react';

/**
 * Input component for a single parameter value.
 * Features a large manual input and stylized quick-access numeric buttons.
 */
const ParameterValueInput = ({ unit, value, onChange, defaultValue }) => {
  const quickValues = [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100];

  const handleQuickClick = (val) => {
    onChange(String(val));
  };

  return (
    <div className="parameter-value-input w-full max-w-sm mx-auto font-sans" dir="rtl">
      {/* Primary Input Display */}
      <div className="flex flex-col items-center justify-center mb-10 group">
        <div className="relative flex items-center justify-center">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={defaultValue || "0"}
            className="w-40 bg-transparent border-b-4 border-zinc-200 focus:border-blue-600 text-5xl font-black text-zinc-900 text-center py-4 outline-none transition-all placeholder:text-zinc-100 tabular-nums"
          />
          <span className="absolute -right-12 bottom-4 text-sm font-black text-blue-500 uppercase tracking-widest">
            {unit}
          </span>
        </div>
        <p className="mt-4 text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em]">Manual Entry</p>
      </div>

      {/* Quick Selection Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-100" />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Quick Select</p>
          <div className="h-px flex-1 bg-zinc-100" />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {quickValues.map((val) => {
            const isSelected = value === String(val);
            return (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickClick(val)}
                className={`py-3 rounded-xl font-black text-xs transition-all active:scale-90 ${
                  isSelected
                    ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-200'
                    : 'bg-white border border-zinc-100 text-zinc-500 hover:border-zinc-300 hover:text-zinc-900'
                }`}
              >
                {val}
              </button>
            );
          })}
          
          {/* Clear Action */}
          <button
            type="button"
            onClick={() => onChange('')}
            className="col-span-1 py-3 rounded-xl border border-rose-100 bg-rose-50/30 text-rose-500 font-black text-[10px] uppercase tracking-tighter hover:bg-rose-50 transition-all active:scale-90"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParameterValueInput;