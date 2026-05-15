import React, { useContext, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ParameterContext } from '../../../contexts/ParameterContext';

const TemplateExerciseItem = ({ item, index, onUpdateSets, onUpdateExerciseParams, onRemove }) => {
  const { parameters } = useContext(ParameterContext);
  const isInitialMount = useRef(true);

  const metaMap = useMemo(() => {
    const map = new Map();
    parameters.forEach(p => map.set(Number(p.id), p));
    return map;
  }, [parameters]);

  useEffect(() => {
    const getSnapshot = () => item.params.map(p => {
      const meta = metaMap.get(Number(p.parameter_id));
      return { name: p.parameter_name, value: p.value, type: meta?.is_virtual ? 'VIRTUAL' : 'RAW' };
    });
    if (isInitialMount.current) {
      console.log(`%c[MOUNT] ${item.exercise_name}`, 'color: #4CAF50; font-weight: bold;', getSnapshot());
      isInitialMount.current = false;
    } else {
      console.log(`%c[UPDATE] ${item.exercise_name}`, 'color: #2196F3; font-weight: bold;', getSnapshot());
    }
    return () => console.log(`%c[EXIT] ${item.exercise_name}`, 'color: #f44336; font-weight: bold;');
  }, [item.params, item.exercise_name, metaMap]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `item-${index}-${item.exercise_id}` });

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

  const handleValueChange = (pIdx, newValue) => {
    const updatedParams = item.params.map((p, i) => 
      i === pIdx ? { ...p, value: newValue } : { ...p }
    );

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
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes}
      className={`bg-white border ${isDragging ? 'border-zinc-300 shadow-xl opacity-80' : 'border-zinc-200 shadow-sm'} rounded-2xl p-4 flex flex-col gap-4`}
      dir="rtl"
    >
      <div className="flex items-center gap-4 border-b border-zinc-100 pb-3">
        <div {...listeners} className="cursor-grab text-zinc-400 hover:text-zinc-600 text-xl px-1">⠿</div>
        
        <div className="flex-1 font-black text-zinc-900 text-lg">
          {item.exercise_name}
        </div>

        <div className="flex items-center gap-2 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200">
          <label className="text-xs font-bold text-zinc-600">סטים:</label>
          <input 
            type="number"
            value={item.num_of_sets}
            onChange={(e) => onUpdateSets(index, parseInt(e.target.value) || 1)}
            className="w-10 bg-transparent border-none text-center font-bold text-zinc-900 outline-none"
          />
        </div>

        <button 
          onClick={() => onRemove(index)} 
          className="text-zinc-400 hover:text-rose-500 hover:bg-rose-50 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
          title="הסר תרגיל"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {item.params.map((param, pIdx) => {
          const meta = metaMap.get(Number(param.parameter_id));
          const isVirtual = meta?.is_virtual;

          return (
            <div 
              key={`${param.parameter_id}-${pIdx}`}
              className={`flex items-center justify-between p-3 rounded-xl border ${isVirtual ? 'bg-blue-50/50 border-blue-100' : 'bg-zinc-50 border-zinc-100'}`}
            >
              <div className="flex flex-col">
                <span className={`text-sm font-bold ${isVirtual ? 'text-blue-800' : 'text-zinc-700'}`}>
                  {param.parameter_name} ({param.parameter_unit || 'ערך'}):
                </span>
                {isVirtual && <span className="text-[10px] font-black tracking-tight text-blue-400 uppercase">חישוב אוטומטי</span>}
              </div>
              
              {isVirtual ? (
                <div className="font-bold text-blue-700 bg-blue-100 px-4 py-1.5 rounded-lg min-w-[60px] text-center shadow-inner">
                  {param.value || "0"}
                </div>
              ) : (
                <input 
                  type="number"
                  value={param.value}
                  onChange={(e) => handleValueChange(pIdx, e.target.value)}
                  className="w-20 px-2 py-1.5 rounded-lg border border-zinc-200 text-center font-medium focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none shadow-inner"
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