import React from 'react';
import TagDisplay from '../../common/tags/TagDisplay';

/**
 * TagTable Component - Display matrix for all registered group tags.
 * Utilizes TagDisplay for standardized, contrast-aware badge rendering.
 */
const TagTable = ({ loading, tags, onStartEdit, onDelete }) => {
  return (
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
          ) : tags.length === 0 ? (
            <tr>
              <td colSpan="3" className="p-10 text-center text-xs font-bold text-zinc-300 italic">
                לא הוגדרו עדיין תגים מותאמים עבור קבוצה זו
              </td>
            </tr>
          ) : (
            tags.map(tag => (
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
  );
};

export default TagTable;