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

// --- Sub-component for a single Sortable Set Row ---
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
  } = useSortable({ id: set.id || sIdx }); // Use set.id for stability

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...styles.setRow,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: set.isDone ? '#f0fff4' : 'transparent',
    zIndex: isDragging ? 10 : 1
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag Handle */}
      <div {...attributes} {...listeners} style={styles.dragHandle}>
        ⣿
      </div>

      <span style={styles.setNum}>{sIdx + 1}</span>

      <div style={styles.paramsInputs}>
        {paramsMetadata.map((p) => (
          <div key={p.parameter_id} style={styles.inputGroup}>
            <small>{p.parameter_name}</small>
            <input
              type="text"
              value={set.values[p.parameter_name] || ''}
              onChange={(e) => onUpdateValue(sIdx, p.parameter_name, e.target.value)}
              style={styles.input}
              disabled={set.isDone}
            />
          </div>
        ))}
      </div>

      {/* Action Buttons: Toggle Done & Delete */}
      <div style={styles.rowActions}>
        <input
          type="checkbox"
          checked={set.isDone || false}
          onChange={() => onToggleSetDone(sIdx)}
          style={styles.checkbox}
        />
        <button 
          onClick={() => onDeleteSet(sIdx)} 
          style={styles.deleteBtn}
          title="Delete Set"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// --- Main Card Component ---
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
    if (active.id !== over.id) {
      const oldIndex = exercise.actualSets.findIndex(s => (s.id || exercise.actualSets.indexOf(s)) === active.id);
      const newIndex = exercise.actualSets.findIndex(s => (s.id || exercise.actualSets.indexOf(s)) === over.id);
      onReorderSets(arrayMove(exercise.actualSets, oldIndex, newIndex));
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={{ margin: 0 }}>{exercise.exercise_name}</h3>
        <small style={{ color: '#666' }}>{exercise.actualSets.length} סטים</small>
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
          <div style={styles.setsTable}>
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

      <button onClick={onAddSet} style={styles.addSetBtn}>
        + הוסף סט
      </button>
    </div>
  );
};

const styles = {
  card: { border: '1px solid #eee', borderRadius: '15px', padding: '15px', marginBottom: '15px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #f5f5f5', paddingBottom: '10px' },
  setsTable: { display: 'flex', flexDirection: 'column', gap: '8px' },
  setRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', border: '1px solid #f0f0f0', transition: 'background-color 0.2s' },
  dragHandle: { cursor: 'grab', color: '#ccc', padding: '0 5px', fontSize: '18px', userSelect: 'none' },
  setNum: { fontWeight: 'bold', backgroundColor: '#f0f0f0', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '11px' },
  paramsInputs: { display: 'flex', gap: '12px', flex: 1, justifyContent: 'center' },
  inputGroup: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' },
  input: { width: '55px', padding: '6px', border: '1px solid #e0e0e0', borderRadius: '6px', textAlign: 'center', fontSize: '14px' },
  rowActions: { display: 'flex', alignItems: 'center', gap: '12px' },
  checkbox: { width: '20px', height: '20px', cursor: 'pointer', accentColor: '#28a745' },
  deleteBtn: { background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '16px', padding: '5px' },
  addSetBtn: { marginTop: '15px', width: '100%', padding: '10px', background: '#f8f9fa', border: '1px dashed #d9d9d9', borderRadius: '8px', color: '#007bff', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }
};

export default ExerciseActiveCard;