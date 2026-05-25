import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableExerciseItem = ({ exercise, onUpdateParam, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: exercise.position.toString() });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div {...attributes} {...listeners} className="flex items-center gap-3 cursor-grab active:cursor-grabbing">
          <span className="text-zinc-300 font-black text-lg">⠿</span>
          <span className="font-black text-sm text-zinc-900">{exercise.name}</span>
        </div>
        <button type="button" onClick={() => onRemove(exercise.position)} className="text-red-500 text-[10px] font-bold uppercase hover:underline">
          מחק
        </button>
      </div>

      {Array.isArray(exercise.parameters) && exercise.parameters.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-zinc-100 pt-3">
          {exercise.parameters.map((param, idx) => {
            const paramId = param.parameter_id || param.id;
            return (
              <div key={`${paramId}-${idx}`} className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{param.name || 'ערך'} {param.unit ? `(${param.unit})` : ''}</span>
                <input 
                  type="number"
                  className={`p-2 rounded-lg border text-xs font-bold w-full outline-none transition-colors ${param.is_virtual ? 'bg-zinc-100 border-zinc-200 text-zinc-500 cursor-not-allowed' : 'bg-zinc-50 border-zinc-300 focus:border-zinc-900'}`}
                  value={param.default_value || 0}
                  onChange={(e) => onUpdateParam(exercise.position, paramId, parseFloat(e.target.value) || 0)}
                  readOnly={param.is_virtual}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TemplateSelectedExercises = ({ exercises, handleUpdateParam, handleRemoveExercise, handleDragEnd }) => (
  <div className="mt-8 border-t border-zinc-100 pt-8 min-h-[100px]">
    <h3 className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">התרגילים שנבחרו לאימון</h3>
    {!Array.isArray(exercises) || exercises.length === 0 ? (
      <div className="text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl p-8">
        <p className="text-zinc-400 text-sm font-bold">טרם נוספו תרגילים לאימון זה.</p>
        <p className="text-zinc-400 text-xs mt-1">בחר תרגילים מהמאגר למעלה כדי להתחיל.</p>
      </div>
    ) : (
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={exercises.map(e => e.position.toString())} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {exercises.map(ex => (
              <SortableExerciseItem 
                key={ex.position.toString()} 
                exercise={ex} 
                onUpdateParam={handleUpdateParam} 
                onRemove={handleRemoveExercise} 
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    )}
  </div>
);

export default TemplateSelectedExercises;
