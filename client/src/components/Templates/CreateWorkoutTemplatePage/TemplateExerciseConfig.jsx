import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TemplateExerciseItem from './TemplateExerciseItem';

/**
 * TemplateExerciseConfig Component - Manages the list and order of exercises in a template.
 * Supports Drag-and-Drop reordering and automatic virtual parameter calculation.
 */
const TemplateExerciseConfig = ({ 
  exercisesConfig, 
  sensors, 
  handleDragEnd, 
  updateSets, 
  onUpdateExerciseParams, 
  removeExercise
}) => {
  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center px-2">
        <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400">
          סדר תרגילים באימון (גרור לשינוי סדר):
        </h4>
        <span className="text-[10px] font-black bg-zinc-900 text-white px-3 py-1 rounded-full uppercase tracking-tighter">
          {exercisesConfig.length} Exercises
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
          <div className="space-y-4 min-h-[100px] p-2 bg-white/10 rounded-[2.5rem] border border-dashed border-white/40">
            {exercisesConfig.map((item, index) => (
              <TemplateExerciseItem 
                key={`item-${index}-${item.exercise_id}`}
                item={item} 
                index={index}
                onUpdateSets={updateSets}
                /* onUpdateExerciseParams handles the injection of virtual parameters 
                   when a source raw parameter value is modified.
                */
                onUpdateExerciseParams={onUpdateExerciseParams} 
                onRemove={removeExercise}
              />
            ))}
            
            {/* Empty State Illustration */}
            {exercisesConfig.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 border border-white/40">
                   <span className="text-2xl opacity-30">🏋️</span>
                </div>
                <p className="text-zinc-400 font-bold text-sm tracking-tight max-w-[200px]">
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