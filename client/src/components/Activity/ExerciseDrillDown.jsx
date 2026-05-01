import React, { useState, useContext, useEffect } from 'react';
import { ExerciseContext } from '../../contexts/ExerciseContext';

/**
 * Modern Navigation component for drilling through exercise hierarchies.
 */
const ExerciseDrillDown = ({ onSelect, initialParentId = null }) => {
  const { exercises } = useContext(ExerciseContext);
  const [currentParentId, setCurrentParentId] = useState(initialParentId);

  useEffect(() => {
    setCurrentParentId(initialParentId);
  }, [initialParentId]);

  const visibleExercises = exercises.filter(ex => ex.parent_id === currentParentId);

  const handleBack = () => {
    const currentCategory = exercises.find(ex => ex.id === currentParentId);
    setCurrentParentId(currentCategory ? currentCategory.parent_id : null);
  };

  const handleItemClick = (exercise) => {
    if (exercise.has_children) {
      setCurrentParentId(exercise.id);
    } else {
      onSelect(exercise);
    }
  };

  return (
    <div className="exercise-drill-down font-sans space-y-6" dir="rtl">
      {/* Dynamic Breadcrumb / Navigation Header */}
      <div className="flex items-center justify-between min-h-[40px] px-2">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            {currentParentId ? 'Sub-Category' : 'Main Library'}
          </span>
          <h4 className="text-lg font-black text-zinc-900 tracking-tight">
            {currentParentId 
              ? exercises.find(e => e.id === currentParentId)?.name 
              : 'בחר קטגוריה להתחלה'}
          </h4>
        </div>
        
        {currentParentId !== null && (
          <button 
            onClick={handleBack}
            className="group flex items-center gap-2 bg-white border border-zinc-200 px-4 py-2 rounded-2xl shadow-sm hover:shadow-md hover:border-zinc-300 transition-all active:scale-95"
          >
            <span className="text-zinc-400 group-hover:text-blue-600 transition-colors">←</span>
            <span className="text-xs font-bold text-zinc-600">חזור</span>
          </button>
        )}
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[450px] overflow-y-auto pr-1 pl-2 scrollbar-hide">
        {visibleExercises.map(ex => {
          const isCategory = ex.has_children;
          
          return (
            <button
              key={ex.id}
              onClick={() => handleItemClick(ex)}
              className={`relative flex flex-col items-start p-5 rounded-[2rem] border transition-all duration-300 group ${
                isCategory 
                  ? 'bg-white border-zinc-100 hover:border-zinc-300 hover:shadow-xl hover:shadow-slate-200/50' 
                  : 'bg-blue-600 border-blue-500 shadow-lg shadow-blue-100 hover:bg-blue-700 hover:shadow-blue-200'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-2">
                <span className={`text-[9px] font-black uppercase tracking-widest ${isCategory ? 'text-zinc-400' : 'text-blue-200'}`}>
                  {isCategory ? 'Folder' : 'Exercise'}
                </span>
                {isCategory && (
                  <div className="w-6 h-6 rounded-lg bg-zinc-50 flex items-center justify-center text-[10px] text-zinc-300 group-hover:text-zinc-500">
                    ▼
                  </div>
                )}
              </div>
              
              <span className={`text-lg font-black tracking-tight text-right ${isCategory ? 'text-zinc-900' : 'text-white'}`}>
                {ex.name}
              </span>

              {!isCategory && (
                <div className="mt-4 flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                  <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Start Entry</span>
                  <span className="text-white text-xs">→</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {visibleExercises.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 bg-zinc-50 rounded-[2.5rem] border border-dashed border-zinc-200">
          <div className="text-2xl mb-2 opacity-20">📂</div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest italic">
            No items in this branch
          </p>
        </div>
      )}
    </div>
  );
};

export default ExerciseDrillDown;