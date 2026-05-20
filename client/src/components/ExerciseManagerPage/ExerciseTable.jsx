import React from 'react';
import TagDisplay from '../common/tags/TagDisplay';
import FrontendLogger from '../../utils/logger';

/**
 * ExerciseTable Component
 * Renders the athletic exercise inventory with relational tag and parameter mapping.
 */
const ExerciseTable = ({ exercises, loading, onEdit, onDelete }) => {
  
  const handleEditClick = (ex) => {
    FrontendLogger.info('EXERCISE_TABLE', `Edit button clicked for exercise: ${ex.name} (ID: ${ex.id})`);
    onEdit(ex.id); // Passing only the ID as expected by the form logic
  };

  const handleDeleteClick = (id) => {
    FrontendLogger.info('EXERCISE_TABLE', `Delete button clicked for ID: ${id}`);
    onDelete(id);
  };

  return (
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
          ) : exercises.length === 0 ? (
            <tr><td colSpan="4" className="p-10 text-center text-xs font-bold text-zinc-300">לא נמצאו תרגילים במערכת</td></tr>
          ) : (
            exercises.map(ex => (
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
  );
};

export default ExerciseTable;