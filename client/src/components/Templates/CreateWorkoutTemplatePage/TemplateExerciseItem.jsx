import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * Represents a single Exercise in the workout template.
 * Each exercise contains a list of parameters (active_params) that can be configured.
 */
const TemplateExerciseItem = ({ item, index, onUpdateSets, onUpdateParamValue, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `item-${index}-${item.exercise_id}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.8 : 1,
    backgroundColor: '#fff',
    border: '1px solid #dee2e6',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '15px',
    boxShadow: isDragging ? '0 8px 20px rgba(0,0,0,0.12)' : '0 2px 4px rgba(0,0,0,0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    cursor: 'default'
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      
      {/* Header Section: Drag handle, Name and Global Sets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #f8f9fa', paddingBottom: '10px' }}>
        
        {/* Drag Handle */}
        <div {...listeners} style={{ cursor: 'grab', color: '#adb5bd', fontSize: '20px', padding: '0 5px' }}>
          ⠿
        </div>

        {/* Exercise Name */}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', color: '#212529', fontSize: '1.05rem' }}>
            {item.exercise_name}
          </div>
        </div>

        {/* Global Sets Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f3f5', padding: '5px 10px', borderRadius: '8px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#495057' }}>Sets:</label>
          <input 
            type="number"
            min="1"
            value={item.num_of_sets}
            onChange={(e) => onUpdateSets(index, parseInt(e.target.value) || 1)}
            style={{ 
              width: '45px', 
              padding: '4px', 
              textAlign: 'center', 
              borderRadius: '6px', 
              border: '1px solid #ced4da',
              fontWeight: 'bold'
            }}
          />
        </div>

        {/* Remove Button */}
        <button 
          type="button"
          onClick={() => onRemove(index)}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#adb5bd', 
            cursor: 'pointer', 
            fontSize: '18px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#dc3545'}
          onMouseLeave={(e) => e.target.style.color = '#adb5bd'}
        >
          ✕
        </button>
      </div>

      {/* Parameters Configuration List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {item.params && item.params.length > 0 ? (
          item.params.map((param, pIdx) => (
            <div 
              key={`${param.parameter_id}-${pIdx}`}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '6px 12px', 
                backgroundColor: '#fcfcfc', 
                borderRadius: '8px',
                border: '1px solid #f1f3f5'
              }}
            >
              <span style={{ fontSize: '13px', color: '#6c757d' }}>
                {param.parameter_name} ({param.parameter_unit || 'val'}):
              </span>
              
              <input 
                type="number"
                placeholder="Default value"
                value={param.value}
                onChange={(e) => onUpdateParamValue(index, pIdx, e.target.value)}
                style={{ 
                  width: '100px', 
                  padding: '4px 8px', 
                  fontSize: '13px', 
                  borderRadius: '4px', 
                  border: '1px solid #e9ecef',
                  outline: 'none',
                  textAlign: 'right'
                }}
              />
            </div>
          ))
        ) : (
          <div style={{ fontSize: '12px', color: '#adb5bd', fontStyle: 'italic', textAlign: 'center' }}>
            No specific parameters found for this exercise.
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateExerciseItem;