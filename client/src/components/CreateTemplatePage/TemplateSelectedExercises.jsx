import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- INTERNAL COMPONENT ---
const SortableExerciseItem = ({ exercise, onUpdateParam, onUpdateSets, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: exercise.position.toString() });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-4">
      <div className="flex justify-between items-center">
        
        {/* Drag Handle & Name */}
        <div {...attributes} {...listeners} className="flex items-center gap-3 cursor-grab active:cursor-grabbing">
          <span className="text-zinc-300 font-black text-lg">⠿</span>
          <span className="font-black text-sm text-zinc-900">{exercise.name}</span>
        </div>
        
        {/* Actions (Sets & Delete) */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-zinc-50 px-2 py-1 rounded-lg border border-zinc-100">
            <label className="text-[10px] font-bold text-zinc-400 uppercase">סטים:</label>
            <input 
              type="number"
              min="1"
              // Classes added to hide the number input spinners
              className="w-12 p-1 text-center bg-transparent border-none text-xs font-black text-zinc-900 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              value={exercise.sets === 0 ? '' : (exercise.sets || '')}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateSets(exercise.position, val === '' ? 0 : parseInt(val));
              }}
            />
          </div>
          <button type="button" onClick={() => onRemove(exercise.position)} className="text-red-500 text-[10px] font-bold uppercase hover:underline">
            מחק
          </button>
        </div>
      </div>

      {/* Parameters */}
      {Array.isArray(exercise.parameters) && exercise.parameters.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-zinc-100 pt-3">
          {exercise.parameters.map((param, idx) => {
            const paramId = param.parameter_id || param.id;
            return (
              <div key={`${paramId}-${idx}`} className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{param.name || 'ערך'} {param.unit ? `(${param.unit})` : ''}</span>
                <input 
                  type="number"
                  // Classes added to hide the number input spinners
                  className={`p-2 rounded-lg border text-xs font-bold w-full outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${param.is_virtual ? 'bg-zinc-100 border-zinc-200 text-zinc-500 cursor-not-allowed' : 'bg-zinc-50 border-zinc-300 focus:border-zinc-900'}`}
                  // Show empty string if the value is exactly 0
                  value={param.default_value === 0 ? '' : param.default_value}
                  onChange={(e) => {
                    const val = e.target.value;
                    // If the user clears the input, save 0 in the state so math doesn't break, but UI shows empty
                    onUpdateParam(exercise.position, paramId, val === '' ? 0 : parseFloat(val));
                  }}
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

// --- EXPORTED COMPONENT ---
const TemplateSelectedExercises = ({ exercises, handleUpdateParam, handleUpdateSets, handleRemoveExercise, handleDragEnd }) => (
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
                onUpdateSets={handleUpdateSets}
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