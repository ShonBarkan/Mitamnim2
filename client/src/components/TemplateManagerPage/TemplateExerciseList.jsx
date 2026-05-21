import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import FrontendLogger from '../../utils/logger';

const SortableExerciseItem = ({ exercise, onRemove, onUpdateParam }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: exercise.position });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm space-y-3">
      {/* Header with Drag Handle */}
      <div className="flex justify-between items-center">
        <div {...attributes} {...listeners} className="flex items-center gap-2 cursor-grab active:cursor-grabbing">
          <span className="text-[10px] text-zinc-300 font-black">⠿</span>
          <span className="font-black text-sm text-zinc-900">{exercise.name}</span>
        </div>
        <button type="button" onClick={() => onRemove(exercise.position)} className="text-red-500 font-bold text-[10px] hover:underline uppercase">מחק</button>
      </div>

      {/* Parameter Inputs */}
      {exercise.parameters && exercise.parameters.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-100">
          {exercise.parameters.map((param, idx) => (
            <div key={`${exercise.position}-${param.parameter_id}-${idx}`} className="flex flex-col">
              <span className="text-[9px] font-bold text-zinc-400 uppercase">{param.name || 'ערך'}</span>
              <input 
                type="number"
                className="p-2 bg-zinc-50 rounded-lg border border-zinc-200 text-xs font-bold w-full"
                value={param.default_value}
                onChange={(e) => onUpdateParam(exercise.position, param.parameter_id, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TemplateExerciseList = ({ exercises, setExercises }) => {
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      FrontendLogger.info('TEMPLATE_EXERCISE_LIST', `Reordering exercise from ${active.id} to ${over.id}`);
      setExercises((items) => {
        const oldIndex = items.findIndex(i => i.position === active.id);
        const newIndex = items.findIndex(i => i.position === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        return reordered.map((item, idx) => ({ ...item, position: idx }));
      });
    }
  };

  const handleUpdateParam = (position, paramId, value) => {
    setExercises(prev => prev.map(ex => {
      if (ex.position === position) {
        return {
          ...ex,
          parameters: ex.parameters.map(p => 
            p.parameter_id === paramId ? { ...p, default_value: parseFloat(value) || 0 } : p
          )
        };
      }
      return ex;
    }));
  };

  const handleRemove = (position) => {
    FrontendLogger.info('TEMPLATE_EXERCISE_LIST', `Removing exercise at position ${position}`);
    setExercises(prev => prev.filter(ex => ex.position !== position).map((ex, idx) => ({ ...ex, position: idx })));
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={exercises.map(e => e.position)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {exercises.map((ex) => (
            <SortableExerciseItem 
              key={`${ex.exercise_id}-${ex.position}`} // Key יציב יותר
              exercise={ex} 
              onRemove={handleRemove}
              onUpdateParam={handleUpdateParam}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default TemplateExerciseList;