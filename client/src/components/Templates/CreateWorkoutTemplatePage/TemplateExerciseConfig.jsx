import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TemplateExerciseItem from './TemplateExerciseItem';

/**
 * Handles the sortable list of selected exercises in the workout template.
 * Manages the DND context and passes configuration handlers to each item.
 */
const TemplateExerciseConfig = ({ 
  exercisesConfig, 
  sensors, 
  handleDragEnd, 
  updateSets, 
  updateParamValue, 
  removeExercise, 
  styles 
}) => {
  return (
    <>
      <h4 style={styles.bankHeader}>Workout Exercise Order (Drag to reorder):</h4>
      
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={exercisesConfig.map((_, i) => `item-${i}-${exercisesConfig[i].exercise_id}`)} 
          strategy={verticalListSortingStrategy}
        >
          <div style={{ minHeight: '50px' }}>
            {exercisesConfig.map((item, index) => (
              <TemplateExerciseItem 
                key={`item-${index}-${item.exercise_id}`}
                item={item} 
                index={index}
                onUpdateSets={updateSets}
                onUpdateParamValue={updateParamValue}
                onRemove={removeExercise}
              />
            ))}
            
            {exercisesConfig.length === 0 && (
              <div style={styles.emptyConfig}>
                Add exercises from the bank above to build your workout
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </>
  );
};

export default TemplateExerciseConfig;