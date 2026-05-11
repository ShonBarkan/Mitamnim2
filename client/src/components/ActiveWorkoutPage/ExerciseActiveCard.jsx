import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableSetRow = ({ 
  set, 
  sIdx, 
  paramsMetadata, 
  onUpdateValue, 
  onDeleteSet, 
  onToggleSetDone 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: set.id || sIdx });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${set.isDone ? 'bg-green-50/50 border-green-100' : 'bg-white border-zinc-100'} hover:border-zinc-200`}>
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab text-zinc-300 hover:text-zinc-500 px-1 font-bold user-select-none active:cursor-grabbing">
        ⣿
      </div>

      <span className="font-black bg-zinc-100 w-8 h-8 flex items-center justify-center rounded-full text-xs text-zinc-600 shrink-0">{sIdx + 1}</span>

      <div className="flex gap-4 flex-1 overflow-x-auto py-1 px-1 scrollbar-hide">
        {paramsMetadata.map((p) => {
          const isVirtual = p.is_virtual;
          const currentValue = set.values[p.parameter_id] || '';

          return (
            <div key={p.parameter_id} className="flex items-center gap-2 min-w-fit">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isVirtual ? 'text-blue-500' : 'text-zinc-500'} shrink-0`}>
                {p.parameter_name}
              </span>
              
              {isVirtual ? (
                <div className="w-14 py-1.5 rounded-xl text-center text-sm font-black text-blue-600 bg-blue-50 border border-blue-100">
                  {currentValue || '0'}
                </div>
              ) : (
                <input
                  type="number"
                  value={currentValue}
                  onChange={(e) => onUpdateValue(sIdx, p.parameter_id, e.target.value)}
                  disabled={set.isDone}
                  placeholder="0"
                  className="w-14 py-1.5 border border-zinc-200 rounded-xl text-center text-sm font-black text-zinc-900 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 bg-white transition-all disabled:opacity-50 disabled:bg-zinc-50"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button 
          onClick={() => onToggleSetDone(sIdx)}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all border ${set.isDone ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-zinc-200 text-transparent hover:border-green-500'}`}
        >
          ✓
        </button>
        <button 
          onClick={() => onDeleteSet(sIdx)} 
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all border border-transparent"
          title="Delete Set"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

const ExerciseActiveCard = ({ 
  exercise, 
  onUpdateValue, 
  onAddSet, 
  onDeleteSet, 
  onReorderSets, 
  onToggleSetDone 
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = exercise.actualSets.findIndex(s => (s.id || exercise.actualSets.indexOf(s)) === active.id);
      const newIndex = exercise.actualSets.findIndex(s => (s.id || exercise.actualSets.indexOf(s)) === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderSets(arrayMove(exercise.actualSets, oldIndex, newIndex));
      }
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 mb-6 border border-zinc-100 shadow-sm font-sans" dir="rtl">
      <div className="flex justify-between items-center mb-6 border-b border-zinc-50 pb-4">
        <h3 className="m-0 text-xl font-black text-zinc-900 tracking-tighter">{exercise.exercise_name}</h3>
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-100 px-3 py-1 rounded-lg">
          {exercise.actualSets.length} סטים
        </span>
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={exercise.actualSets.map((s, i) => s.id || i)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-3">
            {exercise.actualSets.map((set, sIdx) => (
              <SortableSetRow
                key={set.id || sIdx}
                set={set}
                sIdx={sIdx}
                paramsMetadata={exercise.paramsMetadata || []}
                onUpdateValue={onUpdateValue}
                onDeleteSet={onDeleteSet}
                onToggleSetDone={onToggleSetDone}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button 
        onClick={onAddSet} 
        className="mt-6 w-full py-3 bg-zinc-50 hover:bg-zinc-100 border border-dashed border-zinc-300 rounded-2xl text-zinc-600 font-bold text-sm transition-all"
      >
        + הוסף סט
      </button>
    </div>
  );
};

export default ExerciseActiveCard;
