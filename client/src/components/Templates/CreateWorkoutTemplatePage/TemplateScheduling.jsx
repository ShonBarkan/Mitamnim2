import React from 'react';

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

  const toggleDay = (dayValue) => {
    if (scheduledDays.includes(dayValue)) {
      onDaysChange(scheduledDays.filter(d => d !== dayValue));
    } else {
      onDaysChange([...scheduledDays, dayValue].sort());
    }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      
      {/* Selection of training days */}
      <div>
        <label className="block text-sm font-bold text-zinc-700 mb-3">ימי אימון מיועדים:</label>
        <div className="flex gap-2">
          {days.map(day => {
            const isSelected = scheduledDays.includes(day.value);
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                className={`w-10 h-10 rounded-full font-bold text-sm transition-all shadow-sm ${
                  isSelected 
                    ? 'bg-zinc-900 text-white border-zinc-900 scale-110' 
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50'
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-8">
        {/* Estimated Duration Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-zinc-700">זמן משוער (דקות):</label>
          <input 
            type="number" 
            min="1"
            value={expectedDurationTime} 
            onChange={(e) => onDurationChange(e.target.value)}
            className="w-24 px-3 py-2 rounded-xl border border-zinc-200 text-center font-medium focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none"
          />
        </div>

        {/* Scheduled Start Hour Input */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-zinc-700">שעת התחלת אימון:</label>
          <input 
            type="time" 
            value={scheduledHour || ''} 
            onChange={(e) => onHourChange(e.target.value)}
            className="w-32 px-3 py-2 rounded-xl border border-zinc-200 text-center font-medium focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default TemplateScheduling;