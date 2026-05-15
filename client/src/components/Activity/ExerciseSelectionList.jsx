import React, { useState, useContext, useMemo } from 'react';
import { ExerciseContext } from '../../contexts/ExerciseContext';

/**
 * ExerciseSelectionList Component - Flat grid selector for logging exercises.
 * Replaces the old hierarchical DrillDown component. Groups exercises by category tags.
 */
const ExerciseSelectionList = ({ onSelect }) => {
  const { exercises } = useContext(ExerciseContext);
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Filter and group exercises based on the quick search bar input.
   */
  const filteredGroupedExercises = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const filtered = exercises.filter(ex => 
      ex.name.toLowerCase().includes(term) || 
      (ex.category && ex.category.toLowerCase().includes(term))
    );

    // Group items by category string
    const groups = {};
    filtered.forEach(ex => {
      const cat = ex.category || 'General';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(ex);
    });

    return groups;
  }, [exercises, searchTerm]);

  return (
    <div className="font-sans space-y-8" dir="rtl">
      
      {/* Search Input Zone */}
      <div className="relative group max-w-md mx-auto">
        <input 
          type="text" 
          placeholder="חפש תרגיל לתיעוד..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/50 border border-white/80 backdrop-blur-md rounded-2xl px-6 py-4 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all placeholder:text-zinc-300"
        />
        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none">🔍</span>
      </div>

      {/* Grouped Lists Display */}
      <div className="space-y-8 max-h-[500px] overflow-y-auto px-2 scrollbar-hide">
        {Object.keys(filteredGroupedExercises).length > 0 ? (
          Object.entries(filteredGroupedExercises).map(([category, items]) => (
            <div key={category} className="space-y-4">
              
              {/* Category Tag Header */}
              <div className="flex items-center gap-3 opacity-50 px-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
                  {category}
                </span>
                <div className="h-px flex-1 bg-zinc-200" />
              </div>

              {/* Exercises Flat Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map(ex => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => onSelect(ex)}
                    className="flex items-center justify-between p-6 bg-white/60 backdrop-blur-xl border border-white/80 rounded-[2rem] shadow-sm hover:shadow-xl hover:bg-white transition-all duration-300 active:scale-[0.98] group text-right"
                  >
                    <div className="space-y-1">
                      <span className="text-lg font-black text-zinc-900 tracking-tight block">
                        {ex.name}
                      </span>
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">
                        {ex.active_parameter_ids?.length || 0} Metrics Tracked
                      </span>
                    </div>

                    <div className="w-10 h-10 bg-zinc-900 text-white rounded-xl flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 group-hover:translate-x-[-4px] transition-all shadow-md">
                      ←
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 bg-white/20 backdrop-blur-sm rounded-[2.5rem] border-2 border-dashed border-white/40">
            <span className="text-2xl mb-2 opacity-30">🏋️</span>
            <p className="text-xs font-black text-zinc-400 uppercase tracking-widest italic">
              לא נמצאו תרגילים תואמים
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseSelectionList;