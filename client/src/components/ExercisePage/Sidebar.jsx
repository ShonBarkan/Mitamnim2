import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ exercises, selectedExId, onExerciseClick }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedIds, setCollapsedIds] = useState(new Set());

  // --- Search Logic ---
  const filteredExercises = useMemo(() => {
    if (!searchTerm.trim()) return exercises;
    
    const term = searchTerm.toLowerCase();
    const matches = new Set();

    // Find direct matches and their ancestors
    exercises.forEach(ex => {
      if (ex.name.toLowerCase().includes(term)) {
        matches.add(ex.id);
        let parentId = ex.parent_id;
        while (parentId) {
          matches.add(parentId);
          const parent = exercises.find(p => p.id === parentId);
          parentId = parent ? parent.parent_id : null;
        }
      }
    });

    return exercises.filter(ex => matches.has(ex.id));
  }, [exercises, searchTerm]);

  // --- Toggle Collapse ---
  const toggleCollapse = (id, e) => {
    e.stopPropagation();
    const newCollapsed = new Set(collapsedIds);
    if (newCollapsed.has(id)) {
      newCollapsed.delete(id);
    } else {
      newCollapsed.add(id);
    }
    setCollapsedIds(newCollapsed);
  };

  const renderSidebarTree = (parentId = null, depth = 0) => {
    return filteredExercises
      .filter(ex => ex.parent_id === parentId)
      .map(ex => {
        const isSelected = selectedExId === ex.id;
        const hasChildren = exercises.some(child => child.parent_id === ex.id);
        const isCollapsed = collapsedIds.has(ex.id);
        
        // Auto-expand during search
        const shouldShowChildren = hasChildren && (!isCollapsed || searchTerm.trim() !== '');

        return (
          <div key={ex.id} className={`${depth > 0 ? 'mr-3 border-r border-zinc-100' : ''}`}>
            <div className="flex items-center group">
              <button 
                onClick={() => onExerciseClick(ex)}
                className={`flex-1 text-right px-3 py-2 my-0.5 rounded-xl text-sm transition-all duration-300 flex items-center gap-2 ${
                  isSelected 
                    ? 'bg-zinc-900 text-white font-bold shadow-lg shadow-zinc-200' 
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-white'
                }`}
              >
                <span className="truncate">{ex.name}</span>
              </button>

              {hasChildren && (
                <button 
                  onClick={(e) => toggleCollapse(ex.id, e)}
                  className={`p-2 transition-transform duration-300 ${isCollapsed ? '' : 'rotate-180'}`}
                >
                  <span className="text-[10px] text-zinc-300 group-hover:text-zinc-500">▼</span>
                </button>
              )}
            </div>
            
            {shouldShowChildren && (
              <div className="overflow-hidden transition-all">
                {renderSidebarTree(ex.id, depth + 1)}
              </div>
            )}
          </div>
        );
      });
  };

  return (
    <aside className="w-72 shrink-0 h-screen sticky top-0 flex flex-col p-4 bg-slate-50/50" dir="rtl">
      {/* Navigation */}
      <button 
        onClick={() => navigate('/exercises')}
        className="w-full flex items-center justify-center gap-2 mb-6 p-4 rounded-2xl bg-zinc-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all active:scale-95 shadow-xl shadow-zinc-200"
      >
        <span>←</span>
        ניהול עץ תרגילים
      </button>

      {/* Modern Search Input */}
      <div className="relative mb-6">
        <input 
          type="text"
          placeholder="חיפוש מהיר..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-400 transition-all placeholder:text-zinc-300"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs opacity-20">🔍</span>
      </div>

      {/* Label */}
      <div className="px-2 mb-4 flex items-center gap-3">
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 whitespace-nowrap">
          Directory
        </span>
        <div className="h-px w-full bg-zinc-200/50" />
      </div>

      {/* Tree Area */}
      <div className="flex-1 overflow-y-auto pr-1 pl-2 scrollbar-hide">
        {filteredExercises.length > 0 ? (
          renderSidebarTree(null)
        ) : (
          <div className="text-center py-10">
            <p className="text-xs font-bold text-zinc-300 italic">לא נמצאו תוצאות</p>
          </div>
        )}
      </div>

      {/* Visual luxury finish */}
      <div className="h-12 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none sticky bottom-0" />
    </aside>
  );
};

export default Sidebar;