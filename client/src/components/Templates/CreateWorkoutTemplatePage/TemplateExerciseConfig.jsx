import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TemplateExerciseItem from './TemplateExerciseItem';

const TemplateExerciseConfig = ({ 
  exercisesConfig, 
  sensors, 
  handleDragEnd, 
  updateSets, 
  onUpdateExerciseParams, // Ensure this name matches
  removeExercise, 
  styles 
}) => {
  return (
    <>
      <h4 style={styles.bankHeader}>סדר תרגילים באימון (גרור לשינוי סדר):</h4>
      
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
                // Pass the function with the NEW name
                onUpdateExerciseParams={onUpdateExerciseParams} 
                onRemove={removeExercise}
              />
            ))}
            
            {exercisesConfig.length === 0 && (
              <div style={styles.emptyConfig}>
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