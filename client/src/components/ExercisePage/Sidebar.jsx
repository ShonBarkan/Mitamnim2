import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ exercises, selectedExId, onExerciseClick, isCollapsed }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedIds, setCollapsedIds] = useState(new Set());

  // --- Helper to get Initials for Collapsed View ---
  const getInitials = (name) => {
    if (!name) return '';
    const words = name.split(' ');
    if (words.length > 1) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // --- Search Logic ---
  const filteredExercises = useMemo(() => {
    if (!searchTerm.trim()) return exercises;
    
    const term = searchTerm.toLowerCase();
    const matches = new Set();

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

  // --- Toggle Collapse for Tree Nodes ---
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
        const isCollapsedNode = collapsedIds.has(ex.id);
        
        const shouldShowChildren = hasChildren && (!isCollapsedNode || searchTerm.trim() !== '');

        return (
          <div key={ex.id} className={`${depth > 0 && !isCollapsed ? 'mr-3 border-r border-zinc-100' : ''}`}>
            <div className="flex items-center group relative">
              <button 
                onClick={() => onExerciseClick(ex)}
                title={ex.name} // Native tooltip for better UX
                className={`flex-1 text-right my-0.5 rounded-xl transition-all duration-300 flex items-center ${
                  isCollapsed ? 'justify-center px-0 h-10 w-10' : 'px-3 py-2 gap-2'
                } ${
                  isSelected 
                    ? 'bg-zinc-900 text-white font-bold shadow-lg shadow-zinc-200' 
                    : 'text-zinc-500 hover:text-zinc-900 hover:bg-white'
                }`}
              >
                {isCollapsed ? (
                  <span className={`text-[10px] font-black tracking-tighter ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-900'}`}>
                    {getInitials(ex.name)}
                  </span>
                ) : (
                  <span className="text-sm truncate">{ex.name}</span>
                )}
              </button>

              {hasChildren && !isCollapsed && (
                <button 
                  onClick={(e) => toggleCollapse(ex.id, e)}
                  className={`p-2 transition-transform duration-300 ${isCollapsedNode ? '' : 'rotate-180'}`}
                >
                  <span className="text-[10px] text-zinc-300 group-hover:text-zinc-500">▼</span>
                </button>
              )}
            </div>
            
            {shouldShowChildren && !isCollapsed && (
              <div className="overflow-hidden transition-all">
                {renderSidebarTree(ex.id, depth + 1)}
              </div>
            )}
          </div>
        );
      });
  };

  return (
    <div className={`flex flex-col h-full w-full transition-all duration-500 ${isCollapsed ? 'items-center pt-4' : ''}`}>
      
      {/* Navigation Button */}
      <div className="w-full px-4 mb-4">
        <button 
          onClick={() => navigate('/exercises')}
          title="ניהול עץ תרגילים"
          className={`flex items-center justify-center gap-2 bg-zinc-900 text-white rounded-2xl transition-all hover:bg-zinc-800 active:scale-95 shadow-xl shadow-zinc-200 ${
            isCollapsed ? 'w-12 h-12 p-0' : 'w-full p-4'
          }`}
        >
          <span className={isCollapsed ? 'text-lg' : 'text-sm'}>←</span>
          {!isCollapsed && (
            <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
              ניהול עץ תרגילים
            </span>
          )}
        </button>
      </div>

      {/* Search - Hidden when collapsed */}
      {!isCollapsed && (
        <div className="px-4 w-full relative mb-6 animate-in fade-in duration-500">
          <input 
            type="text"
            placeholder="חיפוש מהיר..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-zinc-900/5 transition-all placeholder:text-zinc-300"
          />
          <span className="absolute left-7 top-1/2 -translate-y-1/2 text-xs opacity-20">🔍</span>
        </div>
      )}

      {/* Directory Label - Hidden when collapsed */}
      {!isCollapsed && (
        <div className="px-6 mb-4 flex items-center gap-3 animate-in fade-in">
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-400 whitespace-nowrap">
            Directory
          </span>
          <div className="h-px w-full bg-zinc-100" />
        </div>
      )}

      {/* Tree Area */}
      <div className={`flex-1 overflow-y-auto scrollbar-hide w-full px-4 ${isCollapsed ? 'flex flex-col items-center space-y-1' : ''}`}>
        {filteredExercises.length > 0 ? (
          renderSidebarTree(null)
        ) : (
          !isCollapsed && (
            <div className="text-center py-10">
              <p className="text-xs font-bold text-zinc-300 italic">לא נמצאו תוצאות</p>
            </div>
          )
        )}
      </div>

      {/* Bottom Visual Detail */}
      {!isCollapsed && (
        <div className="h-12 bg-gradient-to-t from-white to-transparent pointer-events-none sticky bottom-0 w-full" />
      )}
    </div>
  );
};

export default Sidebar;