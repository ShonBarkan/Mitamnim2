import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TemplateExerciseItem from './TemplateExerciseItem';

const TemplateExerciseConfig = ({ 
  exercisesConfig, 
  sensors, 
  handleDragEnd, 
  updateSets, 
  onUpdateExerciseParams, 
  removeExercise
}) => {
  return (
    <>
      <h4 className="text-sm font-bold text-zinc-600 mb-3 mt-6">סדר תרגילים באימון (גרור לשינוי סדר):</h4>
      
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={exercisesConfig.map((_, i) => `item-${i}-${exercisesConfig[i].exercise_id}`)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="min-h-[50px] space-y-4">
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
              <div className="text-center py-10 border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-400 font-medium">
                יש להוסיף תרגילים מהבנק למעלה כדי לבנות את האימון
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
};

export default TemplateExerciseConfig;