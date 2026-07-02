import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableExerciseRow = ({ log, updateLog, removeLog, calculateVirtualValue }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: log.log_id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  // Re-evaluate virtual parameters when inputs change
  const handleParamChange = (pIdx, newValue) => {
    let newParams = [...log.params];
    newParams[pIdx].value = newValue;

    const performanceData = newParams.reduce((acc, p) => {
      acc[p.parameter_id || p.id] = p.value;
      return acc;
    }, {});

    newParams = newParams.map(p => {
      if (p.is_virtual) {
        const calcVal = calculateVirtualValue(p, performanceData);
        return { ...p, value: calcVal !== null ? calcVal : 0 };
      }
      return p;
    });

    updateLog(log.log_id, { params: newParams });
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`p-3 md:p-4 border rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 transition-all duration-300 shadow-sm ${
        log.completed 
          ? 'bg-emerald-50/70 border-emerald-300' 
          : 'bg-white border-zinc-200 hover:border-zinc-300'
      }`}
    >
      <div className="flex w-full md:w-auto items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div {...attributes} {...listeners} className="cursor-grab text-zinc-300 hover:text-zinc-500 active:cursor-grabbing px-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          </div>
          <div className="flex flex-col">
            <h4 className={`font-black text-sm ${log.completed ? 'text-emerald-900' : 'text-zinc-900'}`}>
              {log.exercise_name}
            </h4>
            <span className={`text-[10px] font-black uppercase tracking-widest ${log.completed ? 'text-emerald-600' : 'text-blue-500'}`}>
              סט {log.set_number}
            </span>
          </div>
        </div>

        {/* Mobile-only Action Buttons */}
        <div className="flex md:hidden items-center gap-2">
           <button onClick={() => removeLog(log.log_id)} className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl">
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
           </button>
           <button 
             onClick={() => updateLog(log.log_id, { completed: !log.completed })}
             className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${log.completed ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30' : 'bg-zinc-100 text-zinc-400 border border-zinc-200'}`}
           >
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
           </button>
        </div>
      </div>
      
      {/* Parameter Inputs Matrix */}
      <div className="flex-1 flex gap-2 overflow-x-auto pb-1 md:pb-0 w-full snap-x">
        {log.params.map((p, pIdx) => (
          <div key={pIdx} className={`flex flex-col min-w-[65px] flex-1 p-1.5 rounded-xl border shadow-sm snap-center ${p.is_virtual ? 'bg-zinc-50 border-zinc-100' : 'bg-white border-zinc-200'}`}>
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider mb-1 truncate text-center">
              {p.parameter_name}
            </label>
            <input
              type="number"
              dir="ltr"
              readOnly={p.is_virtual}
              className={`w-full bg-transparent text-center text-sm font-black outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${p.is_virtual ? 'text-zinc-400 cursor-not-allowed' : 'text-zinc-900 focus:text-blue-600'}`}
              value={p.value === 0 ? '' : p.value}
              placeholder="0"
              onChange={(e) => {
                const val = e.target.value;
                handleParamChange(pIdx, val === '' ? 0 : parseFloat(val));
              }}
            />
          </div>
        ))}
      </div>

      {/* Desktop Action Buttons */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        <button 
          onClick={() => removeLog(log.log_id)} 
          className="p-2.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          title="מחק סט"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
        </button>
        <button 
          onClick={() => updateLog(log.log_id, { completed: !log.completed })}
          className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${log.completed ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 border border-zinc-200'}`}
        >
          {log.completed ? (
             <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> בוצע</>
          ) : (
             'לא בוצע'
          )}
        </button>
      </div>
    </div>
  );
};

export default SortableExerciseRow;