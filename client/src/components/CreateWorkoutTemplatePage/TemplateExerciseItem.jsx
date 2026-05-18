import React, { useContext, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ParameterContext } from '../../contexts/ParameterContext';
import FrontendLogger from '../../utils/logger';

/**
 * TemplateExerciseItem Component - Atomic ultra-compact exercise block node.
 * Features inline parameter mapping arrays and automatic context dependency hydration updates.
 * Enforces strict English-only code commentary and total Hebrew UI localization.
 */
const TemplateExerciseItem = ({ item, index, onUpdateSets, onUpdateExerciseParams, onRemove }) => {
  const { parameters } = useContext(ParameterContext);
  const isInitialMount = useRef(true);

  // O(1) caching map registry framework for structural parameter entities
  const metaMap = useMemo(() => {
    const map = new Map();
    parameters.forEach(p => map.set(Number(p.id), p));
    return map;
  }, [parameters]);

  // Safe fallback to resolve the exercise name text string across variant schemas
  const displayName = item.exercise_name || item.name || 'תרגיל ללא שם';

  /**
   * Arithmetic Engine: Processes raw computation structures dynamically.
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
   * Dynamic Pipeline Injector: Enforces fallback rules and verifies virtual parameters (e.g. Total Volume ID: 3)
   */
  const syncAndCalculateParameters = useCallback((currentParams) => {
    let updated = [...currentParams];
    const presentParamIds = updated.map(p => Number(p.parameter_id));

    // Ensure virtual parameters are forcefully appended if dependencies are verified (Reps 1 & Weight 2 -> Volume 3)
    parameters.forEach(globalParam => {
      if (globalParam.is_virtual && globalParam.depends_on_ids) {
        const dependencyIds = globalParam.depends_on_ids.map(id => Number(id));
        const hasAllDeps = dependencyIds.every(dId => presentParamIds.includes(dId));
        const isAlreadyAppended = presentParamIds.includes(Number(globalParam.id));

        if (hasAllDeps && !isAlreadyAppended) {
          updated.push({
            parameter_id: globalParam.id,
            parameter_name: globalParam.name,
            parameter_unit: globalParam.unit || '',
            value: globalParam.default_value || '0',
            is_virtual: true
          });
        }
      }
    });

    // Run cascade matrix recalculations across all active virtual models inside this list row scope
    updated = updated.map((p, idx) => {
      const meta = metaMap.get(Number(p.parameter_id));
      if (meta?.is_virtual) {
        const sourceValues = (meta.source_parameter_ids || []).map(sId => {
          const source = updated.find(up => Number(up.parameter_id) === Number(sId));
          return source ? source.value : 0;
        });
        const result = runMath(meta.calculation_type, sourceValues, meta.multiplier);
        return { ...p, value: result.toFixed(2).replace(/\.00$/, "") };
      }
      return p;
    });

    return updated;
  }, [parameters, metaMap, runMath]);

  // Handle initialization hydration checks safely on initial layout mount triggers
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      const initialSyncedList = syncAndCalculateParameters(item.params);
      
      if (initialSyncedList.length !== item.params.length || initialSyncedList.some((p, i) => p.value != item.params[i]?.value)) {
        onUpdateExerciseParams(index, initialSyncedList);
      }
    }
  }, [item.params, index, syncAndCalculateParameters, onUpdateExerciseParams]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: `item-${index}-${item.exercise_id}` });

  const handleValueChange = (pIdx, newValue) => {
    const rawUpdated = item.params.map((p, i) => 
      i === pIdx ? { ...p, value: newValue } : { ...p }
    );
    const fullyCalculated = syncAndCalculateParameters(rawUpdated);
    onUpdateExerciseParams(index, fullyCalculated);
  };

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={sortableStyle} 
      className={`relative bg-white/40 backdrop-blur-xl border rounded-[1.5rem] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
        isDragging ? 'border-zinc-900/20 shadow-xl scale-[1.01] bg-white/60' : 'border-white/60 shadow-sm'
      }`}
      dir="rtl"
    >
      {/* Right Grid Section: Drag Anchor + Exercise Identity + Set Allocator Input Box */}
      <div className="flex items-center gap-3 shrink-0">
        <div 
          {...attributes} 
          {...listeners} 
          className="cursor-grab text-zinc-300 hover:text-zinc-900 p-1.5 active:cursor-grabbing"
          title="גרור לשינוי סדר"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
            <circle cx="9" cy="5" r="1" /> <circle cx="9" cy="12" r="1" /> <circle cx="9" cy="19" r="1" />
            <circle cx="15" cy="5" r="1" /> <circle cx="15" cy="12" r="1" /> <circle cx="15" cy="19" r="1" />
          </svg>
        </div>
        
        {/* FIXED fallback validation parameters mapped cleanly here */}
        <h4 className="text-sm font-black text-zinc-900 tracking-tight max-w-[180px] truncate" title={displayName}>
          {displayName}
        </h4>

        <div className="flex items-center gap-1.5 bg-white/60 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/80 shadow-inner mr-2">
          <span className="text-[9px] font-black text-zinc-400 uppercase">סטים:</span>
          <input 
            type="number"
            min="1"
            value={item.num_of_sets || 3}
            onChange={(e) => onUpdateSets(index, parseInt(e.target.value) || 1)}
            className="w-7 bg-transparent text-center font-black text-xs text-zinc-900 outline-none"
          />
        </div>
      </div>

      {/* Left Grid Section: Micro Rows for All Active Metrics + Delete Layout Action Triggers */}
      <div className="flex items-center gap-4 flex-1 justify-end w-full md:w-auto">
        <div className="flex flex-wrap items-center gap-2 justify-end flex-1">
          {item.params.map((param, pIdx) => {
            const meta = metaMap.get(Number(param.parameter_id));
            const isVirtual = meta?.is_virtual;

            return (
              <div 
                key={`${param.parameter_id}-${pIdx}`}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                  isVirtual 
                    ? 'bg-blue-500/5 border-blue-200/30' 
                    : 'bg-white/50 border-white/80 shadow-sm'
                }`}
              >
                <span className={`text-[10px] font-black whitespace-nowrap ${isVirtual ? 'text-blue-600' : 'text-zinc-500'}`}>
                  {param.parameter_name}:
                </span>
                
                {isVirtual ? (
                  <span className="text-xs font-black text-blue-600 font-mono select-none px-1 tabular-nums">
                    {param.value || "0"} <span className="text-[8px] font-normal text-blue-400">{param.parameter_unit}</span>
                  </span>
                ) : (
                  <div className="flex items-center gap-1">
                    <input 
                      type="text"
                      value={param.value}
                      onChange={(e) => handleValueChange(pIdx, e.target.value)}
                      className="w-12 p-0.5 text-center text-xs font-black text-zinc-900 bg-transparent border-b border-zinc-200 focus:border-zinc-900 outline-none font-mono"
                    />
                    <span className="text-[8px] font-bold text-zinc-400 select-none">{param.parameter_unit}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button 
          type="button"
          onClick={() => onRemove(index)}
          className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-200 active:scale-90 text-xs"
          title="הסר תרגיל"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default TemplateExerciseItem;