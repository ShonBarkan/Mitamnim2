import React, { useContext, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ParameterContext } from '../../../contexts/ParameterContext';

/**
 * TemplateExerciseItem Component - The logical unit of a workout template.
 * Features an integrated Arithmetic Engine for real-time virtual parameter calculations.
 */
const TemplateExerciseItem = ({ item, index, onUpdateSets, onUpdateExerciseParams, onRemove }) => {
  const { parameters } = useContext(ParameterContext);
  const isInitialMount = useRef(true);

  // O(1) lookup map for parameter metadata
  const metaMap = useMemo(() => {
    const map = new Map();
    parameters.forEach(p => map.set(Number(p.id), p));
    return map;
  }, [parameters]);

  // Lifecycle logger for debugging calculation flows
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
    }
  }, [item.params]);

  // DnD-Kit sortable hook configuration
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `item-${index}-${item.exercise_id}` });

  /**
   * Arithmetic Engine: Processes raw values into virtual results based on registry logic.
   */
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

  /**
   * Value Change Handler: Triggered when a user edits a Raw parameter.
   * Automatically re-calculates all Virtual parameters linked to this exercise.
   */
  const handleValueChange = (pIdx, newValue) => {
    const updatedParams = item.params.map((p, i) => 
      i === pIdx ? { ...p, value: newValue } : { ...p }
    );

    // Iteratively update all virtual dependencies in the set
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

  // DnD styling combined with Arctic Mirror aesthetics
  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={sortableStyle} 
      className={`relative bg-white/40 backdrop-blur-2xl border rounded-[2.5rem] p-8 flex flex-col gap-6 transition-all duration-300 ${
        isDragging ? 'border-zinc-900/20 shadow-2xl scale-[1.02]' : 'border-white/60 shadow-sm'
      }`}
      dir="rtl"
    >
      {/* Header Section: Exercise Title & Set Management */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/40">
        <div className="flex items-center gap-4">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab text-zinc-300 hover:text-zinc-900 transition-colors p-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
              <circle cx="9" cy="5" r="1" /> <circle cx="9" cy="12" r="1" /> <circle cx="9" cy="19" r="1" />
              <circle cx="15" cy="5" r="1" /> <circle cx="15" cy="12" r="1" /> <circle cx="15" cy="19" r="1" />
            </svg>
          </div>
          <h4 className="text-xl font-black text-zinc-900 tracking-tighter uppercase">
            {item.exercise_name}
          </h4>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md px-5 py-2 rounded-2xl border border-white/60 shadow-inner">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sets:</span>
            <input 
              type="number"
              min="1"
              value={item.num_of_sets}
              onChange={(e) => onUpdateSets(index, parseInt(e.target.value) || 1)}
              className="w-10 bg-transparent text-center font-black text-zinc-900 outline-none"
            />
          </div>
          <button 
            onClick={() => onRemove(index)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all duration-300"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Parameters Logic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {item.params.map((param, pIdx) => {
          const meta = metaMap.get(Number(param.parameter_id));
          const isVirtual = meta?.is_virtual;

          return (
            <div 
              key={`${param.parameter_id}-${pIdx}`}
              className={`flex items-center justify-between p-5 rounded-[1.5rem] border transition-all duration-500 ${
                isVirtual 
                  ? 'bg-blue-600/5 border-blue-200/40 shadow-inner' 
                  : 'bg-white/40 border-white/60'
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <span className={`text-[11px] font-black uppercase tracking-tight ${
                  isVirtual ? 'text-blue-600' : 'text-zinc-500'
                }`}>
                  {param.parameter_name} ({param.parameter_unit || 'Value'})
                </span>
                {isVirtual && (
                  <span className="text-[9px] font-bold text-blue-400/70 uppercase tracking-widest">
                    Auto-Calculated
                  </span>
                )}
              </div>
              
              {isVirtual ? (
                <div className="text-lg font-black text-blue-600 bg-white/80 px-4 py-1.5 rounded-xl min-w-[70px] text-center shadow-sm">
                  {param.value || "0"}
                </div>
              ) : (
                <input 
                  type="number"
                  value={param.value}
                  onChange={(e) => handleValueChange(pIdx, e.target.value)}
                  className="w-20 p-2.5 rounded-xl bg-white border border-zinc-100 text-center font-black text-zinc-900 outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all"
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