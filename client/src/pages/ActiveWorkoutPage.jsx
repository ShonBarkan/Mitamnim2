import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSession } from '../contexts/SessionContext';
import { useTemplate } from '../contexts/TemplateContext';
import { useExercise } from '../contexts/ExerciseContext';
import { useParameter } from '../contexts/ParameterContext';
import { useToast } from '../contexts/ToastContext';

// Components
import IntervalTimer from '../components/common/IntervalTimer/IntervalTimer';
import SortableExerciseRow from '../components/ActiveWorkoutPage/SortableExerciseRow';
import WorkoutHeader from '../components/ActiveWorkoutPage/WorkoutHeader';
import ExerciseModal from '../components/ActiveWorkoutPage/ExerciseModal';
import MobileTimerModal from '../components/ActiveWorkoutPage/MobileTimerModal';
import StickyFooter from '../components/ActiveWorkoutPage/StickyFooter';

/**
 * Generates a localized unique identifier for duplicated row mapping (Sets)
 */
const generateUniqueId = () => Math.random().toString(36).substring(2, 11);

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
    started_at: new Date().toISOString(), // Initialize with current time
    logs: [] 
  });
  
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
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
            started_at: new Date().toISOString(),
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

    // Determine timestamps: use the user-defined started_at to calculate finished_at
    const durationMs = (activeWorkout.duration_minutes || 60) * 60000;
    const startedAt = activeWorkout.started_at ? new Date(activeWorkout.started_at) : new Date();
    const finishedAt = new Date(startedAt.getTime() + durationMs);

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
    <div className="relative min-h-screen pb-48 bg-zinc-50/50">
      
      {/* Main Layout Wrapper */}
      <div className={`p-4 md:p-8 mx-auto flex flex-col lg:flex-row gap-6 items-start transition-all duration-300 ${isTimerOpen ? 'max-w-7xl' : 'max-w-4xl'}`}>
        
        {/* Left Column: Exercises & Info */}
        <div className="flex-1 space-y-6 w-full animate-in fade-in duration-500">
          
          <WorkoutHeader 
            activeWorkout={activeWorkout} 
            setActiveWorkout={setActiveWorkout} 
          />

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
        </div>

        {/* Right Column (Desktop Only): Sticky Timer */}
        {isTimerOpen && (
          <div className="hidden lg:block w-[450px] shrink-0 sticky top-24 z-10 animate-in slide-in-from-right-8 fade-in duration-300">
            <IntervalTimer />
          </div>
        )}

      </div>

      <ExerciseModal 
        isOpen={isExerciseModalOpen} 
        onClose={() => setIsExerciseModalOpen(false)} 
        exercises={exercises} 
        onSelect={handleAddExercise} 
      />

      <MobileTimerModal 
        isOpen={isTimerOpen} 
        onClose={() => setIsTimerOpen(false)} 
      />

      <StickyFooter 
        isTimerOpen={isTimerOpen}
        setIsTimerOpen={setIsTimerOpen}
        handleCancelWorkout={handleCancelWorkout}
        toggleAllStatus={toggleAllStatus}
        hasLogs={activeWorkout.logs.length > 0}
        setIsExerciseModalOpen={setIsExerciseModalOpen}
        handleFinishWorkout={handleFinishWorkout}
        completedCount={completedCount}
      />
    </div>
  );
};

export default ActiveWorkoutPage;