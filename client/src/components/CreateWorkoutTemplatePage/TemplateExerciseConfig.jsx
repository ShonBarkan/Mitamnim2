import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TemplateExerciseItem from './TemplateExerciseItem';

/**
 * TemplateExerciseConfig Component - Manages the list and order of exercises in a template.
 * Compressed layout configuration to minimize viewport scroll fatigue.
 * Enforces strict English-only code commentary and total Hebrew UI localization.
 */
const TemplateExerciseConfig = ({ 
  exercisesConfig = [], 
  sensors, 
  handleDragEnd, 
  updateSets, 
  onUpdateExerciseParams, 
  removeExercise
}) => {
  return (
    <div className="space-y-4" dir="rtl">
      <header className="flex justify-between items-center px-2 select-none">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
          סדר תרגילים באימון (גרור לשינוי סדר):
        </h4>
        <span className="text-[10px] font-black bg-zinc-900 text-white px-3 py-1 rounded-full uppercase tracking-tighter">
          {exercisesConfig.length} תרגילים נבחרו
        </span>
      </header>
      
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={exercisesConfig.map((_, i) => `item-${i}-${exercisesConfig[i].exercise_id}`)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2.5 min-h-[80px] p-1.5 bg-white/10 rounded-[1.5rem] border border-dashed border-white/40">
            {exercisesConfig.map((item, index) => (
              <TemplateExerciseItem 
                key={`item-${index}-${item.exercise_id}`}
                item={item} 
                index={index}
                onUpdateSets={updateSets}
                onUpdateExerciseParams={onUpdateExerciseParams} 
                onRemove={removeExercise}
              />
            ))}
            
            {exercisesConfig.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-center select-none pointer-events-none">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2 border border-white/40 shadow-inner">
                   <span className="text-xl opacity-40">🏋️</span>
                </div>
                <p className="text-zinc-400 font-bold text-xs tracking-tight max-w-[200px]">
                  יש להוסיף תרגילים מהבנק למעלה כדי לבנות את האימון
                </p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default TemplateExerciseConfig;