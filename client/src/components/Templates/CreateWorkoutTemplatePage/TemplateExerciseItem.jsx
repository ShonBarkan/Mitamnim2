import React, { useContext, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ParameterContext } from '../../../contexts/ParameterContext';

/**
 * Represents a single Exercise in the workout template with dynamic calculations.
 * Handles internal calculation logic for virtual parameters to ensure state consistency.
 */
const TemplateExerciseItem = ({ item, index, onUpdateSets, onUpdateExerciseParams, onRemove }) => {
  const { parameters } = useContext(ParameterContext);
  const isInitialMount = useRef(true);

  // 1. Memoized Metadata Map for O(1) parameter lookup
  const metaMap = useMemo(() => {
    const map = new Map();
    parameters.forEach(p => map.set(Number(p.id), p));
    return map;
  }, [parameters]);

  // 2. Lifecycle & State Snapshot Logger
  useEffect(() => {
    const getSnapshot = () => item.params.map(p => {
      const meta = metaMap.get(Number(p.parameter_id));
      return {
        name: p.parameter_name,
        value: p.value,
        type: meta?.is_virtual ? 'VIRTUAL' : 'RAW'
      };
    });

    if (isInitialMount.current) {
      console.log(`%c[MOUNT] ${item.exercise_name}`, 'color: #4CAF50; font-weight: bold;', getSnapshot());
      isInitialMount.current = false;
    } else {
      console.log(`%c[UPDATE] ${item.exercise_name}`, 'color: #2196F3; font-weight: bold;', getSnapshot());
    }

    return () => {
      console.log(`%c[EXIT] ${item.exercise_name}`, 'color: #f44336; font-weight: bold;');
    };
  }, [item.params, item.exercise_name, metaMap]);

  // 3. DnD-Kit Setup
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `item-${index}-${item.exercise_id}` });

  // 4. Arithmetic Engine
  const runMath = useCallback((type, values, multiplier) => {
    const nums = values.map(v => parseFloat(v) || 0);
    switch (type) {
      case 'sum': return nums.reduce((a, b) => a + b, 0);
      case 'subtract': return nums[0] - (nums[1] || 0);
      case 'multiply': return nums.reduce((a, b) => a * b, 1);
      case 'divide': return nums[1] !== 0 ? nums[0] / nums[1] : 0;
      case 'percentage': return nums[1] !== 0 ? (nums[0] / nums[1]) * 100 : 0;
      case 'conversion': return nums[0] * (multiplier || 1);
      default: return 0;
    }
  }, []);

  // 5. Change Handler with Bulk Update
  const handleValueChange = (pIdx, newValue) => {
    const updatedParams = item.params.map((p, i) => 
      i === pIdx ? { ...p, value: newValue } : { ...p }
    );

    // Re-calculate all virtual parameters in the array
    updatedParams.forEach((p, idx) => {
      const meta = metaMap.get(Number(p.parameter_id));
      if (meta?.is_virtual) {
        const sourceValues = (meta.source_parameter_ids || []).map(sId => {
          const source = updatedParams.find(up => Number(up.parameter_id) === Number(sId));
          return source ? source.value : 0;
        });

        const result = runMath(meta.calculation_type, sourceValues, meta.multiplier);
        updatedParams[idx].value = result.toFixed(2).replace(/\.00$/, "");
      }
    });

    onUpdateExerciseParams(index, updatedParams);
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.6 : 1,
    backgroundColor: '#fff',
    border: '1px solid #dee2e6',
    borderRadius: '16px',
    padding: '16px',
    marginBottom: '15px',
    boxShadow: isDragging ? '0 8px 25px rgba(0,0,0,0.15)' : '0 2px 4px rgba(0,0,0,0.02)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    direction: 'rtl'
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #f8f9fa', paddingBottom: '10px' }}>
        <div {...listeners} style={{ cursor: 'grab', color: '#adb5bd', fontSize: '20px' }}>⠿</div>
        
        <div style={{ flex: 1, fontWeight: '800', color: '#212529', fontSize: '1.1rem' }}>
          {item.exercise_name}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f3f5', padding: '5px 12px', borderRadius: '10px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>סטים:</label>
          <input 
            type="number"
            value={item.num_of_sets}
            onChange={(e) => onUpdateSets(index, parseInt(e.target.value) || 1)}
            style={{ width: '40px', border: 'none', background: 'transparent', textAlign: 'center', fontWeight: 'bold' }}
          />
        </div>

        <button onClick={() => onRemove(index)} style={{ background: 'none', border: 'none', color: '#adb5bd', cursor: 'pointer', fontSize: '18px' }}>✕</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {item.params.map((param, pIdx) => {
          const meta = metaMap.get(Number(param.parameter_id));
          const isVirtual = meta?.is_virtual;

          return (
            <div 
              key={`${param.parameter_id}-${pIdx}`}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: '10px 14px', 
                backgroundColor: isVirtual ? '#f0f7ff' : '#fafafa', 
                borderRadius: '12px',
                border: isVirtual ? '1px solid #d1dbff' : '1px solid #f1f3f5'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', color: isVirtual ? '#0050b3' : '#6c757d', fontWeight: '600' }}>
                  {param.parameter_name} ({param.parameter_unit || 'ערך'}):
                </span>
                {isVirtual && <span style={{ fontSize: '10px', color: '#69c0ff' }}>חישוב אוטומטי</span>}
              </div>
              
              {isVirtual ? (
                <div style={{ fontWeight: 'bold', color: '#0050b3', background: '#e6f7ff', padding: '4px 12px', borderRadius: '6px', minWidth: '60px', textAlign: 'center' }}>
                  {param.value || "0"}
                </div>
              ) : (
                <input 
                  type="number"
                  value={param.value}
                  onChange={(e) => handleValueChange(pIdx, e.target.value)}
                  style={{ width: '80px', padding: '6px', borderRadius: '8px', border: '1px solid #d9d9d9', textAlign: 'center' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateExerciseItem;