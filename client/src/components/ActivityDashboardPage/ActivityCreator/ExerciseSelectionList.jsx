import React, { useState, useContext, useMemo } from 'react';
import { ExerciseContext } from '../../../contexts/ExerciseContext';

/**
 * ExerciseSelectionList Component - Flat grid selector for logging exercises.
 * Refactored: Replaces old categorical drill-down filters with a responsive flat pool search layout.
 * Allocated strictly within the components/ActivityDashboardPage/ActivityCreator nested workspace.
 */
const ExerciseSelectionList = ({ onSelect }) => {
  const { exercises } = useContext(ExerciseContext);
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Filter exercises directly based on the quick flat-registry search bar input token.
   */
  const filteredExercises = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return exercises;

    return exercises.filter(ex => 
      (ex.exercise_name || '').toLowerCase().includes(term)
    );
  }, [exercises, searchTerm]);

  return (
    <div className="font-sans space-y-6" dir="rtl">
      
      {/* Search Input Zone Frame */}
      <div className="relative group max-w-md mx-auto">
        <input 
          type="text" 
          placeholder="חפש תרגיל ממאגר הקבוצה לתיעוד..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/50 border border-white/80 backdrop-blur-md rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all placeholder:text-zinc-300 shadow-sm"
        />
        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none select-none">🔍</span>
      </div>

      {/* Exercises Flat Grid Presentation Stream Box */}
      <div className="space-y-4 max-h-[420px] overflow-y-auto px-1 pr-2 scrollbar-hide">
        {filteredExercises.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredExercises.map(ex => (
              <button
                key={ex.id}
                type="button"
                onClick={() => onSelect(ex)}
                className="flex items-center justify-between p-5 bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] shadow-sm hover:shadow-xl hover:bg-white transition-all duration-300 active:scale-[0.98] group text-right"
              >
                <div className="space-y-0.5">
                  <span className="text-lg font-black text-zinc-900 tracking-tight block transition-colors group-hover:text-blue-600">
                    {ex.exercise_name}
                  </span>
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block font-mono">
                    {ex.active_parameter_ids?.length || 0} Metrics Tracked
                  </span>
                </div>

                {/* RTL Arrow Utility Stamp Box */}
                <div className="w-9 h-9 bg-zinc-900 text-white rounded-xl flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all duration-300 shadow-md shrink-0">
                  ←
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-white/20 backdrop-blur-sm rounded-[2.5rem] border-2 border-dashed border-white/40 select-none pointer-events-none">
            <span className="text-2xl mb-2 opacity-30">🏋️</span>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest italic">
              לא נמצאו תרגילים תואמים במאגר הקבוצה
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseSelectionList;