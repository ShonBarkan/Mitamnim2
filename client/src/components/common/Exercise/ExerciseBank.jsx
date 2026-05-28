import React, { useState, useMemo } from 'react';
import TagDisplay from '../tags/TagDisplay';

const ExerciseBank = ({ exercises, onSelect, className = "" }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredExercises = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return exercises?.filter(ex => {
      const nameMatch = ex.name?.toLowerCase().includes(query);
      const tagMatch = ex.tags?.some(t => t.name?.toLowerCase().includes(query));
      return nameMatch || tagMatch;
    }) || [];
  }, [exercises, searchTerm]);

  return (
    <div className={`space-y-4 ${className}`}>
      <input 
        type="text" 
        placeholder="חיפוש תרגיל..." 
        className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all font-bold text-sm" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)} 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
        {filteredExercises.length > 0 ? (
          filteredExercises.map(ex => (
            <button 
              key={ex.id} 
              type="button"
              /* Switched to flex-col to ensure name always has full row priority */
              className="flex flex-col items-start gap-2 p-3 bg-white border border-zinc-200 rounded-xl hover:border-zinc-900 hover:shadow-sm transition-all text-right group w-full" 
              onClick={(e) => {
                e.preventDefault();
                onSelect(ex);
              }}
            >
              {/* Name is now full width */}
              <span className="font-black text-sm text-zinc-900 w-full truncate">
                {ex.name}
              </span>
              
              {/* Tags wrap automatically if there isn't enough space */}
              {Array.isArray(ex.tags) && ex.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {ex.tags.slice(0, 3).map(tag => (
                    <div key={tag.id} className="text-[10px]"> 
                      <TagDisplay name={tag.name} color={tag.color} />
                    </div>
                  ))}
                </div>
              )}
            </button>
          ))
        ) : (
          <p className="text-xs text-zinc-400 p-3 col-span-full text-center">לא נמצאו תרגילים.</p>
        )}
      </div>
    </div>
  );
};

export default ExerciseBank;