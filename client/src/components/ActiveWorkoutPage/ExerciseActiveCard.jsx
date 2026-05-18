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
import FrontendLogger from '../../utils/logger';

/**
 * SortableSetRow Component - An individual performance set row within an exercise tracking matrix.
 * Features bright premium glassmorphism layouts and structural drag-and-drop mechanics.
 */
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
  } = useSortable({ id: set.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex items-center gap-4 p-4 rounded-[1.5rem] border transition-all duration-500 ${
        isDragging ? 'bg-white/90 shadow-2xl scale-[1.02] border-blue-200 z-50' : 
        set.isDone ? 'bg-emerald-500/10 border-emerald-500/30 opacity-60' : 
        'bg-white/40 backdrop-blur-md border-white/60 hover:bg-white/60'
      }`}
    >
      {/* Drag handle with customizable micro-grid elements */}
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab active:cursor-grabbing p-2 text-zinc-300 hover:text-zinc-900 transition-colors shrink-0"
        title="גרור לשינוי סדר הסטים"
      >
        <div className="grid grid-cols-2 gap-0.5 select-none">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-current" />
          ))}
        </div>
      </div>

      {/* Set Sequence Numeric Badge */}
      <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-white text-xs font-black shadow-lg shrink-0 font-mono">
        {sIdx + 1}
      </div>

      {/* Dynamic Performance Metrics Parameter Inputs Grid Area */}
      <div className="flex gap-6 flex-1 overflow-x-auto py-2 px-1 scrollbar-hide items-center">
        {paramsMetadata.map((p) => {
          const isVirtual = p.is_virtual;
          const paramId = p.id || p.parameter_id;
          const currentValue = set.values[paramId] || '';

          return (
            <div key={paramId} className="flex flex-col gap-1.5 min-w-fit">
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-1 select-none ${isVirtual ? 'text-blue-600' : 'text-zinc-400'}`}>
                {p.name || p.parameter_name}
              </span>
              
              {isVirtual ? (
                <div className="w-20 py-3 rounded-2xl text-center text-sm font-black text-blue-600 bg-blue-500/5 border border-blue-200/30 backdrop-blur-sm font-mono shadow-sm">
                  {currentValue || '0'}
                </div>
              ) : (
                <input
                  type="text"
                  value={currentValue}
                  onChange={(e) => onUpdateValue(sIdx, paramId, e.target.value)}
                  disabled={set.isDone}
                  placeholder="0"
                  className="w-20 py-3 bg-white border border-white/80 rounded-2xl text-center text-sm font-black text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all font-mono disabled:opacity-40 shadow-sm"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Row Execution State Actions Checkpoint Layer */}
      <div className="flex items-center gap-2 shrink-0">
        <button 
          type="button"
          onClick={() => onToggleSetDone(sIdx)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all border-2 active:scale-90 ${
            set.isDone 
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
              : 'bg-white border-zinc-100 text-transparent hover:border-emerald-500 hover:text-emerald-500 shadow-sm'
          }`}
          title={set.isDone ? "סמן כלא בוצע" : "סמן כבוצע"}
        >
          <span className="text-lg font-black leading-none select-none">✓</span>
        </button>
        
        <button 
          type="button"
          onClick={() => onDeleteSet(sIdx)} 
          className="w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-100 shadow-sm active:scale-90"
          title="הסר סט"
        >
          <span className="text-sm font-black select-none">✕</span>
        </button>
      </div>
    </div>
  );
};

/**
 * ExerciseActiveCard Component - Manages chronological performance tracking blocks for a single exercise node.
 */
const ExerciseActiveCard = ({ 
  exercise, 
  onUpdateValue, 
  onAddSet, 
  onDeleteSet, 
  onReorderSets, 
  onToggleSetDone 
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      FrontendLogger.info('EXERCISE_ACTIVE_CARD', `Re-ordering execution tracking items for exercise target ID: ${exercise.exercise_id}`);
      
      const oldIndex = exercise.actualSets.findIndex(s => s.id === active.id);
      const newIndex = exercise.actualSets.findIndex(s => s.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderSets(arrayMove(exercise.actualSets, oldIndex, newIndex));
      }
    }
  };

  const actualSetsList = exercise.actualSets || [];

  return (
    <div className="bg-white/40 backdrop-blur-3xl rounded-[3rem] p-8 border border-white/60 shadow-2xl font-sans relative overflow-hidden animate-in fade-in zoom-in-98 duration-500" dir="rtl">
      {/* Decorative bright subtle visual flare element background detail */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Card Header Title Row Section */}
      <div className="flex justify-between items-center mb-8 px-2">
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">
            {exercise.exercise_name}
          </h3>
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] select-none">
            Exercise Execution Tracker
          </p>
        </div>
        <div className="bg-zinc-900 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-zinc-900/20 font-mono select-none">
          {actualSetsList.length} Sets
        </div>
      </div>

      {/* Draggable Active Set Scorecard Framework Rows Stream */}
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={actualSetsList.map(s => s.id)} 
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {actualSetsList.map((set, sIdx) => (
              <SortableSetRow
                key={set.id}
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

      {/* Interactive Command Control Action Button: Appends performance sets rows */}
      <button 
        type="button"
        onClick={onAddSet} 
        className="mt-8 w-full py-5 bg-white/60 hover:bg-white text-zinc-400 hover:text-zinc-900 border-2 border-dashed border-white/80 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all active:scale-[0.99] shadow-sm duration-300"
      >
        ＋ הוצאת סט נוסף (Add New Set)
      </button>
    </div>
  );
};

export default ExerciseActiveCard;