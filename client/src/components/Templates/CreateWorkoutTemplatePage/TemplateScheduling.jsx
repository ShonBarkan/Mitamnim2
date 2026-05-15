import React from 'react';

/**
 * TemplateScheduling Component - Configures workout timing and frequency.
 * Implements the "Arctic Mirror" aesthetic with high-end Glassmorphism.
 */
const TemplateScheduling = ({ 
  scheduledDays, 
  expectedDurationTime, 
  scheduledHour, 
  onDaysChange, 
  onDurationChange, 
  onHourChange 
}) => {
  const days = [
    { label: 'א', value: 0 },
    { label: 'ב', value: 1 },
    { label: 'ג', value: 2 },
    { label: 'ד', value: 3 },
    { label: 'ה', value: 4 },
    { label: 'ו', value: 5 },
    { label: 'ש', value: 6 }
  ];

  /**
   * Toggles the selection of a specific day and ensures the array remains sorted.
   */
  const toggleDay = (dayValue) => {
    if (scheduledDays.includes(dayValue)) {
      onDaysChange(scheduledDays.filter(d => d !== dayValue));
    } else {
      onDaysChange([...scheduledDays, dayValue].sort((a, b) => a - b));
    }
  };

  return (
    <div className="flex flex-col gap-10" dir="rtl">
      
      {/* Day Selection Logic */}
      <div className="space-y-4">
        <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mr-2">
          ימי אימון מיועדים:
        </label>
        <div className="flex gap-3">
          {days.map(day => {
            const isSelected = scheduledDays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-300 shadow-sm active:scale-90 ${
                  isSelected 
                    ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/20' 
                    : 'bg-white/50 text-zinc-400 border border-white/60 hover:bg-white hover:text-zinc-600'
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Expected Duration Input */}
        <div className="space-y-3">
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mr-2">
            זמן משוער (דקות):
          </label>
          <div className="relative group">
            <input 
              type="number" 
              min="1"
              value={expectedDurationTime} 
              onChange={(e) => onDurationChange(e.target.value)}
              className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-lg font-black text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all text-center"
            />
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-300 uppercase">Min</span>
          </div>
        </div>

        {/* Start Hour Selection */}
        <div className="space-y-3">
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500 mr-2">
            שעת התחלת אימון:
          </label>
          <div className="relative group">
            <input 
              type="time" 
              value={scheduledHour || ''} 
              onChange={(e) => onHourChange(e.target.value)}
              className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-lg font-black text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all text-center appearance-none"
            />
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-300 uppercase">Hour</span>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default TemplateScheduling;