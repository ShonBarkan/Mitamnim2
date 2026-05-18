import React, { useEffect, useRef } from 'react';

/**
 * TemplateScheduling Component - Configures workout timing and weekly frequency.
 * Features automated global defaults hydration and bulk selection utility toggles.
 * Implements the bright "Arctic Mirror" aesthetic with high-end glassmorphic fields.
 * Validated with strict English-only code commentary and total Hebrew UI localization.
 */
const TemplateScheduling = ({ 
  scheduledDays = [], 
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

  const isInitialSync = useRef(true);

  // Automatically select all days by default during the initial creation lifecycle step
  useEffect(() => {
    if (scheduledDays.length === 0 && isInitialSync.current) {
      onDaysChange(days.map(d => d.value));
    }
    isInitialSync.current = false;
  }, [scheduledDays, onDaysChange]);

  /**
   * Toggles the selection of a specific day and ensures the array remains strictly sorted.
   */
  const toggleDay = (dayValue) => {
    if (scheduledDays.includes(dayValue)) {
      onDaysChange(scheduledDays.filter(d => d !== dayValue));
    } else {
      onDaysChange([...scheduledDays, dayValue].sort((a, b) => a - b));
    }
  };

  const handleSelectAll = () => {
    onDaysChange(days.map(d => d.value));
  };

  const handleClearAll = () => {
    onDaysChange([]);
  };

  return (
    <div className="flex flex-col gap-10" dir="rtl">
      
      {/* Day Selection Logic Badge Matrix */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mr-2 select-none">
          <label className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
            ימי אימון מיועדים:
          </label>
          
          {/* Bulk Action Toggle Managers */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg font-black text-[9px] uppercase tracking-wider active:scale-95 transition-all shadow-sm"
            >
              בחר הכל
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 bg-white/60 text-zinc-400 hover:text-zinc-900 border border-white/80 rounded-lg font-black text-[9px] uppercase tracking-wider active:scale-95 transition-all shadow-sm"
            >
              נקה הכל
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        
        {/* Expected Duration Numeric Input Track */}
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
              className="w-full bg-white/50 border border-white/40 rounded-2xl px-6 py-4 text-lg font-black text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all text-center placeholder:text-zinc-300"
              placeholder="45"
            />
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-300 uppercase select-none pointer-events-none">דקות</span>
          </div>
        </div>

        {/* Start Hour Clock Time Selection Field */}
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
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-300 uppercase select-none pointer-events-none">שעה</span>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default TemplateScheduling;