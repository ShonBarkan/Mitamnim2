import React, { useState, useMemo } from 'react';
import TagDisplay from '../../common/tags/TagDisplay';

/**
 * TagTable Component - Display matrix for all registered group tags.
 * Utilizes TagDisplay for standardized, contrast-aware badge rendering.
 * Includes real-time search filtering with performance optimization via useMemo.
 */
const TagTable = ({ loading, tags, onStartEdit, onDelete }) => {
  // State management for search term
  const [searchTerm, setSearchTerm] = useState('');

  // Memoized filtering logic to prevent unnecessary re-renders while typing
  const filteredTags = useMemo(() => {
    if (!searchTerm.trim()) return tags;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(lowerSearchTerm)
    );
  }, [tags, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Glassmorphism search input following Arctic Mirror aesthetic */}
      <div className="relative">
        <input
          type="text"
          placeholder="חיפוש תגים..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-zinc-200/40 rounded-2xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/30 transition-all shadow-sm"
        />
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-300">🔍</span>
      </div>

      {/* Table container with Arctic Mirror glassmorphism styling */}
      <div className="border border-zinc-100 rounded-2xl overflow-hidden shadow-sm bg-white/20">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-zinc-100/50 text-zinc-400 uppercase text-[10px] font-black tracking-wider border-b border-zinc-200/60 select-none">
              <th className="px-6 py-4">תצוגה חזותית (Badge)</th>
              <th className="px-6 py-4">שם התג</th>
              <th className="px-6 py-4 text-left">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr>
                <td colSpan="3" className="p-10 text-center text-xs font-bold text-zinc-400 uppercase animate-pulse">
                  מסנכרן הגדרות תגים קבוצתיים...
                </td>
              </tr>
            ) : filteredTags.length === 0 ? (
              <tr>
                <td colSpan="3" className="p-10 text-center text-xs font-bold text-zinc-300 italic">
                  {searchTerm.trim() ? 'לא נמצאו תגים התואמים לחיפוש' : 'לא הוגדרו עדיין תגים מותאמים עבור קבוצה זו'}
                </td>
              </tr>
            ) : (
              filteredTags.map(tag => (
                <tr key={tag.id} className="hover:bg-white/40 transition-all group">
                  <td className="px-6 py-4">
                    {/* Using the centralized TagDisplay component for consistent styling and contrast */}
                    <TagDisplay name={tag.name} color={tag.color} />
                  </td>
                  <td className="px-6 py-4 font-black text-sm text-zinc-900">{tag.name}</td>
                  <td className="px-6 py-4 text-left">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onStartEdit(tag)} 
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                        title="ערוך תג"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => onDelete(tag.id)} 
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors"
                        title="מחק תג"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TagTable;