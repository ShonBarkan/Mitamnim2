import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSession } from '../contexts/SessionContext';
import { useTemplate } from '../contexts/TemplateContext';
import { useExercise } from '../contexts/ExerciseContext';
import { useParameter } from '../contexts/ParameterContext';
import { useToast } from '../contexts/ToastContext';
import ExerciseBank from '../components/common/Exercise/ExerciseBank';

/**
 * Generates a localized unique identifier for duplicated row mapping (Sets)
 */
const generateUniqueId = () => Math.random().toString(36).substring(2, 11);

// --- COMPACT ROW COMPONENT ---
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


// --- MAIN PAGE COMPONENT ---
const ActiveWorkoutPage = () => {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template_id');
  const navigate = useNavigate();
  
  const { templates } = useTemplate();
  const { exercises } = useExercise();
  const { calculateVirtualValue } = useParameter();
  const { submitSession, saveDraft, loadDraft, clearDraft } = useSession();
  const { showToast } = useToast();
  
  const [activeWorkout, setActiveWorkout] = useState({ 
    template_id: null, 
    name: 'אימון חדש', 
    note: '', 
    duration_minutes: 60, 
    logs: [] 
  });
  
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const isInitialized = useRef(false);

  // Initialize data correctly based on Template JSON OR Local Draft
  useEffect(() => {
    if (isInitialized.current) return;

    const draft = loadDraft();

    if (templateId) {
      if (templates && templates.length > 0) {
        const template = templates.find(t => t.id === templateId);
        
        if (draft && draft.template_id === templateId) {
          setActiveWorkout(draft);
        } else if (template) {
          // Explode the exercises array: 1 exercise with 3 sets -> 3 individual logs
          const expandedLogs = template.exercises.flatMap((ex) => {
            const numSets = ex.sets > 0 ? ex.sets : 1;
            return Array.from({ length: numSets }).map((_, setIndex) => ({
              log_id: generateUniqueId(),
              exercise_id: ex.exercise_id,
              exercise_name: ex.name,
              set_number: setIndex + 1,
              completed: false,
              params: ex.parameters.map(p => ({ 
                parameter_id: p.parameter_id,
                parameter_name: p.name, 
                parameter_unit: p.unit, 
                value: parseFloat(p.default_value) || 0,
                is_virtual: p.is_virtual,
                calculation_type: p.calculation_type,
                source_parameter_ids: p.source_parameter_ids,
                multiplier: p.multiplier
              }))
            }));
          });

          setActiveWorkout({
            template_id: templateId,
            name: template.name || 'אימון ללא שם',
            note: '',
            duration_minutes: template.estimated_duration || 60,
            logs: expandedLogs
          });
        }
        isInitialized.current = true;
      }
    } else {
      if (draft) setActiveWorkout(draft);
      isInitialized.current = true;
    }
  }, [templateId, templates, loadDraft]);

  // Continuously save to draft state
  useEffect(() => { 
    if (isInitialized.current) saveDraft(activeWorkout); 
  }, [activeWorkout, saveDraft]);

  // Logic Handlers
  const updateLog = (logId, updates) => {
    setActiveWorkout(prev => ({
      ...prev,
      logs: prev.logs.map(l => l.log_id === logId ? { ...l, ...updates } : l)
    }));
  };

  const removeLog = (logId) => {
    setActiveWorkout(prev => ({ 
      ...prev, 
      logs: prev.logs.filter(l => l.log_id !== logId) 
    }));
    showToast('הסט הוסר מהאימון', 'info');
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setActiveWorkout(prev => {
        const oldIndex = prev.logs.findIndex(l => l.log_id === active.id);
        const newIndex = prev.logs.findIndex(l => l.log_id === over.id);
        return { ...prev, logs: arrayMove(prev.logs, oldIndex, newIndex) };
      });
    }
  };

  const handleAddExercise = (ex) => {
    setActiveWorkout(prev => ({
      ...prev,
      logs: [...prev.logs, {
        log_id: generateUniqueId(),
        exercise_id: ex.id,
        exercise_name: ex.name,
        set_number: 1, // Freshly added standalone exercise
        completed: false,
        params: ex.parameters.map(p => ({ 
          parameter_id: p.id,
          parameter_name: p.name, 
          parameter_unit: p.unit, 
          value: parseFloat(p.default_value) || 0,
          is_virtual: p.is_virtual,
          calculation_type: p.calculation_type,
          source_parameter_ids: p.source_parameter_ids,
          multiplier: p.multiplier
        }))
      }]
    }));
    showToast(`'${ex.name}' נוסף לאימון`, 'success');
  };

  const toggleAllStatus = () => {
    const allCompleted = activeWorkout.logs.length > 0 && activeWorkout.logs.every(l => l.completed);
    setActiveWorkout(prev => ({
      ...prev,
      logs: prev.logs.map(l => ({ ...l, completed: !allCompleted }))
    }));
    showToast(allCompleted ? 'כל הסטים בוטלו' : 'כל הסטים סומנו כבוצעו', 'info');
  };

  const handleCancelWorkout = () => {
    if (window.confirm('האם אתה בטוח שברצונך לבטל את האימון? הנתונים לא יישמרו.')) {
      clearDraft();
      showToast('האימון בוטל ונמחק בהצלחה', 'info');
      navigate('/templates'); // Fallback navigation to safety
    }
  };

  const handleFinishWorkout = async () => {
    const completedLogs = activeWorkout.logs.filter(l => l.completed).map((l, index) => ({
       ...l,
       position: index // Enforce final database order
    }));

    if (completedLogs.length === 0) {
      showToast('לא ניתן לסיים אימון ריק. אנא סמן "בוצע" על הסטים שסיימת.', 'error');
      return;
    }

    // Determine absolute timestamps based on user duration input
    const durationMs = (activeWorkout.duration_minutes || 60) * 60000;
    const finishedAt = new Date();
    const startedAt = new Date(finishedAt.getTime() - durationMs);

    await submitSession({ 
      ...activeWorkout, 
      logs: completedLogs, 
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString() 
    });
    
    navigate('/log-diary');
    showToast('האימון נשמר בהצלחה, כל הכבוד!', 'success');
  };

  const completedCount = activeWorkout.logs.filter(l => l.completed).length;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6 pb-48 animate-in fade-in duration-500 relative min-h-screen">
      
      {/* Header Panel */}
      <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <input 
            className="text-2xl md:text-3xl font-black w-full bg-transparent outline-none text-zinc-900 placeholder:text-zinc-300"
            value={activeWorkout.name}
            placeholder="שם האימון..."
            onChange={e => setActiveWorkout(prev => ({...prev, name: e.target.value}))}
          />
          
          {/* Duration Input */}
          <div className="flex items-center gap-2 bg-zinc-50 px-4 py-2 rounded-xl border border-zinc-200 shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <input 
              type="number"
              min="1"
              dir="ltr"
              className="w-12 bg-transparent text-center font-black text-zinc-900 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              value={activeWorkout.duration_minutes || ''}
              onChange={e => setActiveWorkout(prev => ({...prev, duration_minutes: parseInt(e.target.value) || 0}))}
            />
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">דקות</span>
          </div>
        </div>

        <textarea
          className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-zinc-900 resize-none"
          placeholder="הערות לאימון (איך הרגשת, דגשים לפעם הבאה...)"
          rows="2"
          value={activeWorkout.note || ''}
          onChange={e => setActiveWorkout(prev => ({...prev, note: e.target.value}))}
        />
      </div>

      {/* Draggable Exercises List */}
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={activeWorkout.logs.map(l => l.log_id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {activeWorkout.logs.map((log) => (
              <SortableExerciseRow 
                key={log.log_id} 
                log={log} 
                updateLog={updateLog} 
                removeLog={removeLog} 
                calculateVirtualValue={calculateVirtualValue}
              />
            ))}
            
            {activeWorkout.logs.length === 0 && (
              <div className="p-10 border-2 border-dashed border-zinc-200 rounded-3xl text-center flex flex-col items-center justify-center bg-white/50">
                <span className="text-4xl mb-4">🏋️‍♂️</span>
                <h3 className="font-black text-zinc-400 text-lg">האימון שלך ריק</h3>
                <p className="text-zinc-400 text-sm font-medium mt-1">הוסף תרגילים למטה כדי להתחיל</p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Exercise Bank Modal */}
      {isExerciseModalOpen && (
        <div className="fixed inset-0 z-[150] bg-zinc-900/60 backdrop-blur-sm flex justify-center items-center p-4 md:p-6" onClick={() => setIsExerciseModalOpen(false)}>
          <div 
            className="bg-white rounded-3xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()} 
          >
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 shrink-0">
              <div>
                <h3 className="text-xl font-black text-zinc-900">מאגר תרגילים</h3>
                <p className="text-xs font-bold text-zinc-500 mt-1">בחר תרגילים להוספה לאימון</p>
              </div>
              <button 
                onClick={() => setIsExerciseModalOpen(false)} 
                className="w-10 h-10 flex items-center justify-center bg-zinc-200 hover:bg-zinc-300 text-zinc-600 rounded-full transition-colors font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <ExerciseBank exercises={exercises} onSelect={handleAddExercise} />
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50 shrink-0">
              <button 
                onClick={() => setIsExerciseModalOpen(false)} 
                className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-black shadow-lg transition-colors active:scale-95"
              >
                סיימתי להוסיף
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Footer: Actions Interface */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-zinc-200/60 z-30 flex flex-col gap-3">
        <div className="max-w-4xl mx-auto w-full">
          
          {/* Top Actions Row: Cancel & Toggle All */}
          <div className="flex justify-between items-center px-2 mb-3">
            <button 
              onClick={handleCancelWorkout}
              className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 transition-colors bg-rose-50/50 hover:bg-rose-100 px-3 py-1.5 rounded-lg"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
              ביטול אימון
            </button>
            
            {activeWorkout.logs.length > 0 && (
              <button 
                onClick={toggleAllStatus}
                className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors bg-zinc-100 hover:bg-zinc-200 px-3 py-1.5 rounded-lg"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                סמן / בטל הכל
              </button>
            )}
          </div>

          {/* Bottom Actions Row: Add & Finish */}
          <div className="flex gap-3">
            <button 
              onClick={() => setIsExerciseModalOpen(true)}
              className="flex-1 py-4 md:py-5 bg-zinc-100 text-zinc-900 font-black text-sm md:text-base rounded-2xl shadow-sm hover:bg-zinc-200 transition-all active:scale-95 border border-zinc-200 flex items-center justify-center gap-2"
            >
              הוסף תרגיל <span>+</span>
            </button>
            
            <button 
              onClick={handleFinishWorkout}
              className="flex-[2] py-4 md:py-5 bg-zinc-900 text-white font-black text-sm md:text-base rounded-2xl shadow-xl hover:bg-zinc-800 transition-all active:scale-95 flex justify-between px-6 md:px-8"
            >
              <span>סיום ושמירה</span>
              <span className="text-zinc-400">({completedCount} סטים בוצעו)</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ActiveWorkoutPage;