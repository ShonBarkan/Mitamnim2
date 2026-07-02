import React from 'react';
import CustomDateTimePicker from '../common/CustomDateTimePicker';

const WorkoutHeader = ({ activeWorkout, setActiveWorkout }) => {

  // Fallback to current date if started_at is missing
  const initialDateStr = activeWorkout.started_at || new Date().toISOString();

  // Handler for updating the start time from the custom picker
  const handleDateChange = (formattedDateTime) => {
    // formattedDateTime comes as "YYYY-MM-DDTHH:mm:00"
    // new Date() parses it as local time, toISOString() converts it to UTC for state
    const localDate = new Date(formattedDateTime);
    
    if (!isNaN(localDate.getTime())) {
      setActiveWorkout((prev) => ({
        ...prev,
        started_at: localDate.toISOString(),
      }));
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <input 
          className="text-2xl md:text-3xl font-black w-full bg-transparent outline-none text-zinc-900 placeholder:text-zinc-300"
          value={activeWorkout.name || ''}
          placeholder="שם האימון..."
          onChange={e => setActiveWorkout(prev => ({...prev, name: e.target.value}))}
        />
        
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          
          {/* Start Time Custom Input Wrapper */}
          <div className="flex items-center gap-2">
            
            <CustomDateTimePicker 
              initialDate={initialDateStr}
              onChange={handleDateChange}
            />
          </div>

          {/* Duration Input */}
          <div className="flex items-center gap-2 bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-200 h-full">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <input 
              type="number"
              min="1"
              dir="ltr"
              className="w-12 bg-transparent text-center font-black text-zinc-900 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              value={activeWorkout.duration_minutes || ''}
              onChange={e => setActiveWorkout(prev => ({...prev, duration_minutes: parseInt(e.target.value) || 0}))}
            />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">דקות</span>
          </div>
        </div>
      </div>

      <textarea
        className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-zinc-900 resize-none"
        placeholder="הערות לאימון (איך הרגשת, דגשים לפעם הבאה...)"
        rows="2"
        value={activeWorkout.note || ''}
        onChange={e => setActiveWorkout(prev => ({...prev, note: e.target.value}))}
      />
    </div>
  );
};

export default WorkoutHeader;