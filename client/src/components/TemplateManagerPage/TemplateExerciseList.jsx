import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableExerciseItem = ({ exercise, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: exercise.position });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-zinc-50 p-4 rounded-xl border border-zinc-200 flex justify-between items-center cursor-grab active:cursor-grabbing">
      <span className="font-bold text-sm">{exercise.name}</span>
      <button type="button" onClick={() => onRemove(exercise.position)} className="text-red-500 font-bold text-xs">מחק</button>
    </div>
  );
};

const TemplateExerciseList = ({ exercises, setExercises }) => {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setExercises((items) => {
        const oldIndex = items.findIndex(i => i.position === active.id);
        const newIndex = items.findIndex(i => i.position === over.id);
        return arrayMove(items, oldIndex, newIndex).map((item, idx) => ({ ...item, position: idx }));
      });
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={exercises.map(e => e.position)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {exercises.map((ex) => (
            <SortableExerciseItem key={ex.position} exercise={ex} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default TemplateExerciseList;