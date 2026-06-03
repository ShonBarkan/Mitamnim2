import React, { useState, useMemo } from 'react';
import TagDisplay from '../../common/tags/TagDisplay';

/**
 * TagTable Component - Display matrix for all registered group tags.
 * Utilizes TagDisplay for standardized, contrast-aware badge rendering.
 * Includes real-time search filtering with performance optimization via useMemo.
 * Fully responsive: Renders as a sleek card list on mobile and a traditional table on desktop.
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
          className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-zinc-200/40 rounded-2xl text-sm font-bold text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/30 transition-all shadow-sm"
        />
        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-300 select-none pointer-events-none">🔍</span>
      </div>

      {/* Main Container: Adapts structure based on screen size */}
      <div className="border-none md:border md:border-zinc-100 md:rounded-2xl md:overflow-hidden md:shadow-sm md:bg-white/20 transition-all">
        
        {/* --- DESKTOP VIEW: Traditional Table Layout (Hidden on Mobile) --- */}
        <table className="hidden md:table w-full text-right border-collapse">
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
                  <td className="px-6 py-4 w-1/3">
                    <TagDisplay name={tag.name} color={tag.color} />
                  </td>
                  <td className="px-6 py-4 font-black text-sm text-zinc-900 w-1/3">{tag.name}</td>
                  <td className="px-6 py-4 text-left w-1/3">
                    {/* Actions are hidden by default on desktop until hover */}
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

        {/* --- MOBILE VIEW: Card List Layout (Hidden on Desktop) --- */}
        <div className="md:hidden flex flex-col gap-3">
          {loading ? (
            <div className="p-8 text-center text-xs font-bold text-zinc-400 uppercase animate-pulse bg-white/20 rounded-2xl border border-zinc-100 shadow-sm">
              מסנכרן הגדרות תגים קבוצתיים...
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="p-8 text-center text-xs font-bold text-zinc-300 italic bg-white/20 rounded-2xl border border-zinc-100 shadow-sm">
              {searchTerm.trim() ? 'לא נמצאו תגים התואמים לחיפוש' : 'לא הוגדרו עדיין תגים מותאמים עבור קבוצה זו'}
            </div>
          ) : (
            filteredTags.map(tag => (
              <div 
                key={tag.id} 
                className="bg-white/40 backdrop-blur-sm border border-white/60 rounded-2xl p-4 flex items-center justify-between shadow-sm transition-all active:scale-[0.98]"
              >
                {/* Tag Info */}
                <div className="flex flex-col gap-2.5">
                  <span className="font-black text-sm text-zinc-900 leading-none">{tag.name}</span>
                  <div className="self-start">
                    <TagDisplay name={tag.name} color={tag.color} />
                  </div>
                </div>
                
                {/* Always-visible Action Buttons for Touch Interfaces */}
                <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                  <button 
                    onClick={() => onStartEdit(tag)} 
                    className="p-2.5 bg-blue-50/80 text-blue-600 active:bg-blue-100 rounded-xl transition-colors shadow-sm border border-blue-100"
                    title="ערוך תג"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => onDelete(tag.id)} 
                    className="p-2.5 bg-red-50/80 text-red-600 active:bg-red-100 rounded-xl transition-colors shadow-sm border border-red-100"
                    title="מחק תג"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default TagTable;