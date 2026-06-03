import React, { useState, useMemo } from 'react';
import TagDisplay from '../common/tags/TagDisplay';
import FrontendLogger from '../../utils/logger';

/**
 * ExerciseTable Component
 * Renders the athletic exercise inventory with relational tag and parameter mapping.
 * Includes real-time search filtering with performance optimization via useMemo.
 */
const ExerciseTable = ({ exercises, loading, onEdit, onDelete }) => {
  
  // State management for search term
  const [searchTerm, setSearchTerm] = useState('');

  const handleEditClick = (ex) => {
    FrontendLogger.info('EXERCISE_TABLE', `Edit button clicked for exercise: ${ex.name} (ID: ${ex.id})`);
    onEdit(ex.id); // Passing only the ID as expected by the form logic
  };

  const handleDeleteClick = (id) => {
    FrontendLogger.info('EXERCISE_TABLE', `Delete button clicked for ID: ${id}`);
    onDelete(id);
  };

  // Memoized filtering logic to prevent unnecessary re-renders while typing
  const filteredExercises = useMemo(() => {
    if (!searchTerm.trim()) return exercises;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return exercises.filter(ex => {
      // Search across exercise name
      if (ex.name.toLowerCase().includes(lowerSearchTerm)) return true;
      
      // Search across tag names
      if (ex.tags && ex.tags.some(tag => tag.name.toLowerCase().includes(lowerSearchTerm))) return true;
      
      // Search across parameter names
      if (ex.parameters && ex.parameters.some(param => param.name.toLowerCase().includes(lowerSearchTerm))) return true;
      
      return false;
    });
  }, [exercises, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Glassmorphism search input following Arctic Mirror aesthetic */}
      <div className="relative">
        <input
          type="text"
          placeholder="חיפוש לפי שם או תג או פרמטר..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-zinc-200/40 rounded-2xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/30 transition-all shadow-sm"
        />
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-300">🔍</span>
      </div>

      {/* Table container with Arctic Mirror glassmorphism styling */}
      <div className="border border-zinc-100 rounded-2xl overflow-hidden shadow-sm bg-white/20 backdrop-blur-sm">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-zinc-100/50 text-zinc-400 uppercase text-[10px] font-black tracking-wider border-b border-zinc-200/60 select-none">
              <th className="px-6 py-4">שם התרגיל</th>
              <th className="px-6 py-4">תגים</th>
              <th className="px-6 py-4">פרמטרים משויכים</th>
              {(onEdit || onDelete) && <th className="px-6 py-4 text-left">פעולות</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr><td colSpan="4" className="p-10 text-center text-xs font-bold text-zinc-400 animate-pulse">טוען תרגילים...</td></tr>
            ) : filteredExercises.length === 0 ? (
              <tr><td colSpan="4" className="p-10 text-center text-xs font-bold text-zinc-300">
                {searchTerm.trim() ? 'לא נמצאו תרגילים התואמים לחיפוש' : 'לא נמצאו תרגילים במערכת'}
              </td></tr>
            ) : (
              filteredExercises.map(ex => (
                <tr key={ex.id} className="hover:bg-white/40 transition-all group">
                  <td className="px-6 py-4 font-black text-sm text-zinc-900">{ex.name}</td>
                  
                  <td className="px-6 py-4 flex gap-1 flex-wrap">
                    {ex.tags.map(tag => (
                      <TagDisplay key={tag.id} name={tag.name} color={tag.color} />
                    ))}
                  </td>

                  <td className="px-6 py-4 text-xs font-mono text-zinc-500">
                    {ex.parameters.map(p => p.name).join(', ')}
                  </td>

                  {(onEdit || onDelete) && (
                    <td className="px-6 py-4 text-left">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onEdit && (
                          <button 
                            type="button"
                            onClick={() => handleEditClick(ex)} 
                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                          >
                            ✏️
                          </button>
                        )}
                        {onDelete && (
                          <button 
                            type="button"
                            onClick={() => handleDeleteClick(ex.id)} 
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExerciseTable;