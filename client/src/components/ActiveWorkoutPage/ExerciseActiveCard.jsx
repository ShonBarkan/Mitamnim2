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

/**
 * Sub-component for a single Sortable Set Row.
 * Displays parameters (manual or virtual), completion toggle, and delete action.
 */
const SortableSetRow = ({ 
  set, 
  sIdx, 
  paramsMetadata, 
  onUpdateValue, 
  onDeleteSet, 
  onToggleSetDone 
}) => {
  // Setup sortable hook for drag-and-drop stability using set.id
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
    ...styles.setRow,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: set.isDone ? '#f0fff4' : 'transparent',
    zIndex: isDragging ? 10 : 1
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag Handle - Restricted to the icon area */}
      <div {...attributes} {...listeners} style={styles.dragHandle}>
        ⣿
      </div>

      <span style={styles.setNum}>{sIdx + 1}</span>

      <div style={styles.paramsInputs}>
        {paramsMetadata.map((p) => {
          const isVirtual = p.is_virtual;
          const currentValue = set.values[p.parameter_id] || '';

          return (
            <div key={p.parameter_id} style={styles.inputGroup}>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 'bold', 
                color: isVirtual ? '#0050b3' : '#555',
                marginBottom: '2px'
              }}>
                {p.parameter_name}
              </span>
              
              {isVirtual ? (
                /* Calculated Virtual Parameter - Read Only */
                <div style={styles.virtualDisplay}>
                  {currentValue || '0'}
                </div>
              ) : (
                /* Manual Input Parameter */
                <input
                  type="number"
                  value={currentValue}
                  onChange={(e) => onUpdateValue(sIdx, p.parameter_id, e.target.value)}
                  style={styles.input}
                  disabled={set.isDone}
                  placeholder="0"
                />
              )}
            </div>
          );
        })}
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

/**
 * Main Card Component for an Active Exercise.
 * Manages the collection of sets and drag-and-drop reordering logic.
 */
const ExerciseActiveCard = ({ 
  exercise, 
  onUpdateValue, 
  onAddSet, 
  onDeleteSet, 
  onReorderSets, 
  onToggleSetDone 
}) => {
  // Configure sensors for pointer (distance-based for scroll) and keyboard reordering
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /**
   * Finalizes the reordering of sets when dragging ends.
   */
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
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>{exercise.exercise_name}</h3>
        <small style={{ color: '#666', background: '#f0f0f0', padding: '2px 8px', borderRadius: '10px' }}>
          {exercise.actualSets.length} סטים
        </small>
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
  card: { border: '1px solid #eee', borderRadius: '15px', padding: '15px', marginBottom: '15px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', direction: 'rtl' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #f5f5f5', paddingBottom: '10px' },
  setsTable: { display: 'flex', flexDirection: 'column', gap: '8px' },
  setRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px', border: '1px solid #f0f0f0', transition: 'background-color 0.2s' },
  dragHandle: { cursor: 'grab', color: '#ccc', padding: '0 5px', fontSize: '18px', userSelect: 'none' },
  setNum: { fontWeight: 'bold', backgroundColor: '#f0f0f0', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '10px', color: '#666' },
  paramsInputs: { display: 'flex', gap: '15px', flex: 1, justifyContent: 'flex-start', overflowX: 'auto', padding: '2px' },
  inputGroup: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', minWidth: 'fit-content' },
  input: { width: '50px', padding: '6px', border: '1px solid #e0e0e0', borderRadius: '8px', textAlign: 'center', fontSize: '14px', outline: 'none', background: '#fff' },
  virtualDisplay: { width: '50px', padding: '6px', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', color: '#0050b3', background: '#e6f7ff', border: '1px solid #bae7ff' },
  rowActions: { display: 'flex', alignItems: 'center', gap: '10px' },
  checkbox: { width: '22px', height: '22px', cursor: 'pointer', accentColor: '#28a745' },
  deleteBtn: { background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '16px', padding: '5px' },
  addSetBtn: { marginTop: '15px', width: '100%', padding: '10px', background: '#f8f9fa', border: '1px dashed #d9d9d9', borderRadius: '10px', color: '#007bff', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', transition: 'background 0.2s' }
};

export default ExerciseActiveCard;