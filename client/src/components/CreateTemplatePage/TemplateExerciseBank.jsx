import React, { useState, useMemo } from 'react';

const TemplateExerciseBank = ({ exercises, handleAddExercise }) => {
  // Local state for the search input
  const [exerciseSearch, setExerciseSearch] = useState('');

  // Local filtering logic explicitly checking ex.tags based on the server payload
  const filteredExercises = useMemo(() => {
    if (!exerciseSearch.trim()) return exercises || [];
    const term = exerciseSearch.toLowerCase();
    
    return exercises?.filter(ex => {
      // 1. Check if the exercise name matches the search term
      const nameMatch = ex.name?.toLowerCase().includes(term);
      
      // 2. Check if ANY of the tags' names match the search term
      const tagsMatch = Array.isArray(ex.tags) && ex.tags.some(tag => 
        tag.name?.toLowerCase().includes(term)
      );

      // Return true if either the name or the tag matches
      return nameMatch || tagsMatch;
    }) || [];
  }, [exercises, exerciseSearch]);

  return (
    <div className="space-y-4 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
      <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">מאגר התרגילים (לחץ להוספה)</label>
      <input 
        type="text" 
        placeholder="סנן תרגילים לפי שם או תגית (לדוגמה: 'חזה' או 'אירובי')..." 
        className="w-full p-4 bg-white rounded-xl font-bold text-sm border border-zinc-200 outline-none focus:border-cyan-500 transition-colors shadow-sm" 
        value={exerciseSearch} 
        onChange={e => setExerciseSearch(e.target.value)} 
      />
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-2">
        {filteredExercises.length > 0 ? filteredExercises.map(ex => (
          <button 
            key={ex.id} 
            type="button" 
            onClick={() => handleAddExercise(ex)} 
            className="bg-white p-4 rounded-xl border border-zinc-200 hover:border-cyan-500 hover:shadow-md transition-all text-right group flex flex-col gap-2 justify-between"
          >
            <span className="font-black text-sm text-zinc-800 group-hover:text-cyan-700">{ex.name}</span>
            
            {/* Direct rendering of the tags array from the server payload */}
            {Array.isArray(ex.tags) && ex.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {ex.tags.slice(0, 2).map(tag => (
                  <span key={tag.id} className="text-[9px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500">
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </button>
        )) : (
          <p className="text-xs text-zinc-400 p-2 col-span-full">לא נמצאו תרגילים התואמים את החיפוש.</p>
        )}
      </div>
    </div>
  );
};

export default TemplateExerciseBank;