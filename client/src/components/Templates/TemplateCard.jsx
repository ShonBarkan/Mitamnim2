import React from 'react';

/**
 * Individual Card representing a workout template.
 * Displays summary info and action buttons.
 */
const TemplateCard = ({ template, onEdit, onDelete, onStart, isTrainer }) => {
  const { name, description, expected_duration_time, exercises_config, scheduled_days } = template;

  const daysOfWeek = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4" dir="rtl">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-zinc-900 m-0 leading-tight">{name}</h3>
        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
          {expected_duration_time || '--'} דקות
        </span>
      </div>

      <p className="text-sm text-zinc-500 min-h-[40px] leading-relaxed m-0">
        {description || 'אין תיאור זמין'}
      </p>

      {/* Info chips */}
      <div className="flex flex-wrap gap-2">
        <div className="bg-zinc-50 text-zinc-600 px-3 py-1 rounded-full text-xs font-semibold border border-zinc-200">
          {exercises_config?.length || 0} תרגילים
        </div>
        {scheduled_days?.length > 0 && (
          <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold border border-amber-200">
            ימי פעילות: {scheduled_days.map(d => daysOfWeek[d]).join(', ')}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-2 flex gap-2">
        <button 
          onClick={() => onStart(template)}
          className="flex-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm active:scale-95"
        >
          🚀 התחל אימון
        </button>

        {isTrainer && (
          <>
            <button 
              onClick={() => onEdit(template)}
              className="flex-1 w-full bg-white hover:bg-zinc-50 text-zinc-700 py-2.5 rounded-xl font-bold text-sm border border-zinc-200 transition-colors active:scale-95"
            >
              ערוך
            </button>
            <button 
              onClick={() => onDelete(template.id)}
              className="bg-white hover:bg-rose-50 text-rose-500 px-3 py-2.5 rounded-xl font-bold text-sm border border-rose-100 transition-colors active:scale-95 flex items-center justify-center"
              title="מחק שבלונה"
            >
              🗑️
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TemplateCard;