import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSession } from '../contexts/SessionContext';
import { useTemplate } from '../contexts/TemplateContext';
import { useExercise } from '../contexts/ExerciseContext';
import ExerciseBank from '../components/common/Exercise/ExerciseBank';

// Internal Sortable Component to keep it in one file
const SortableExerciseCard = ({ log, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: index });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-white p-4 border border-zinc-200 rounded-2xl shadow-sm flex items-center gap-4">
      <div {...attributes} {...listeners} className="cursor-grab text-zinc-400">☰</div>
      <div className="flex-1">
        <h4 className="font-black text-zinc-900">{log.exercise_name}</h4>
        <div className="flex gap-2 mt-2">
          {log.params.map((p, i) => (
            <input
              key={i}
              type="number"
              placeholder={p.parameter_name}
              className="w-20 p-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-bold"
              value={p.value || ''}
              onChange={(e) => { /* Update log params logic */ }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const ActiveWorkoutPage = () => {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template_id');
  const navigate = useNavigate();
  
  const { templates } = useTemplate();
  const { exercises } = useExercise();
  const { submitSession, saveDraft, loadDraft } = useSession();
  
  const [activeWorkout, setActiveWorkout] = useState({ name: 'אימון חדש', note: '', logs: [] });

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setActiveWorkout(draft);
    } else if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setActiveWorkout({
          name: template.name,
          note: '',
          logs: template.exercises.map(ex => ({
            exercise_id: ex.exercise_id,
            exercise_name: ex.name,
            sets: ex.sets,
            params: ex.parameters.map(p => ({ parameter_name: p.name, parameter_unit: p.unit, value: 0 }))
          }))
        });
      }
    }
  }, [templateId, templates, loadDraft]);

  useEffect(() => { saveDraft(activeWorkout); }, [activeWorkout, saveDraft]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setActiveWorkout(prev => ({ ...prev, logs: arrayMove(prev.logs, active.id, over.id) }));
    }
  };

  const handleAddExercise = (ex) => {
    setActiveWorkout(prev => ({
      ...prev,
      logs: [...prev.logs, {
        exercise_id: ex.id,
        exercise_name: ex.name,
        sets: 3,
        params: ex.parameters.map(p => ({ parameter_name: p.name, parameter_unit: p.unit, value: 0 }))
      }]
    }));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 pb-24">
      <input 
        className="text-2xl font-black w-full bg-transparent border-b-2 border-zinc-200 outline-none focus:border-zinc-900"
        value={activeWorkout.name}
        onChange={e => setActiveWorkout(prev => ({...prev, name: e.target.value}))}
      />

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={activeWorkout.logs.map((_, i) => i)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {activeWorkout.logs.map((log, idx) => (
              <SortableExerciseCard key={idx} log={log} index={idx} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <ExerciseBank exercises={exercises} onSelect={handleAddExercise} className="mt-8 border-t pt-8" />

      <button 
        onClick={async () => {
           await submitSession({ ...activeWorkout, started_at: new Date().toISOString(), finished_at: new Date().toISOString() });
           navigate('/workout-history');
        }}
        className="fixed bottom-6 left-6 right-6 py-4 bg-zinc-900 text-white font-black rounded-2xl shadow-xl"
      >
        סיום ושמירת אימון
      </button>
    </div>
  );
};

export default ActiveWorkoutPage;