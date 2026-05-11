import React, { useState } from 'react';

const WorkoutHeader = ({ 
  name, 
  description, 
  parentName, 
  onSave, 
  onCancel, 
  isSaving,
  onAddExercise,
  startTime,
  setStartTime 
}) => {
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [tempTime, setTempTime] = useState("");

  const handleEditTimeClick = () => {
    // Format current startTime for datetime-local input
    // toISOString gives UTC, we need local time string "YYYY-MM-DDTHH:mm"
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
    const localISOTime = (new Date(startTime - tzoffset)).toISOString().slice(0, 16);
    setTempTime(localISOTime);
    setIsEditingTime(true);
  };

  const handleTimeSave = () => {
    if (tempTime) {
      setStartTime(new Date(tempTime));
    }
    setIsEditingTime(false);
  };

  return (
    <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100 shadow-sm px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4" dir="rtl">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{parentName}</span>
        <h2 className="text-2xl font-black text-zinc-900 tracking-tighter m-0">{name}</h2>
        {description && <p className="text-sm font-bold text-zinc-500 m-0 max-w-md truncate">{description}</p>}
        
        {/* Time Editor */}
        <div className="mt-2 flex items-center gap-2">
           <span className="text-xs font-bold text-zinc-500">התחלה:</span>
           {isEditingTime ? (
             <div className="flex items-center gap-2">
               <input 
                 type="datetime-local" 
                 value={tempTime}
                 onChange={(e) => setTempTime(e.target.value)}
                 className="text-xs border border-zinc-200 rounded-lg px-2 py-1 bg-white font-sans text-zinc-900 outline-none focus:border-blue-500"
               />
               <button onClick={handleTimeSave} className="text-[10px] bg-zinc-900 text-white px-2 py-1 rounded-md font-bold">שמור</button>
               <button onClick={() => setIsEditingTime(false)} className="text-[10px] bg-zinc-200 text-zinc-600 px-2 py-1 rounded-md font-bold">ביטול</button>
             </div>
           ) : (
             <div className="flex items-center gap-2">
               <span className="text-xs font-bold text-zinc-700">{startTime.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' })}</span>
               <button onClick={handleEditTimeClick} className="text-xs text-blue-600 hover:text-blue-800 transition-colors">✎ ערוך</button>
             </div>
           )}
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <button 
          onClick={onAddExercise}
          className="flex-1 md:flex-none bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 px-4 py-2.5 rounded-2xl font-black text-sm transition-all active:scale-95"
        >
          + הוסף תרגיל
        </button>
        <button 
          onClick={onCancel} 
          disabled={isSaving}
          className="bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 px-4 py-2.5 rounded-2xl font-black text-sm transition-all active:scale-95"
        >
          ביטול
        </button>
        <button 
          onClick={onSave} 
          disabled={isSaving}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-2xl font-black text-sm transition-all active:scale-95 text-white ${isSaving ? 'bg-zinc-400 cursor-not-allowed' : 'bg-zinc-900 hover:bg-zinc-800 shadow-lg shadow-zinc-200'}`}
        >
          {isSaving ? "שומר..." : "סיום אימון"}
        </button>
      </div>
    </div>
  );
};

export default WorkoutHeader;
