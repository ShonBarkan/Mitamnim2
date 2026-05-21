import React, { useState } from 'react';
import { useExercise } from '../../contexts/ExerciseContext';
import FrontendLogger from '../../utils/logger';

const AddExerciseModal = ({ isOpen, onClose, onAdd }) => {
  const { exercises } = useExercise();
  const [selectedId, setSelectedId] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    const exercise = exercises.find(e => e.id === parseInt(selectedId));
    if (exercise) {
      FrontendLogger.info('ADD_EXERCISE_MODAL', `Adding exercise to template: ${exercise.name}`);
      // Send the exercise with default structure to the form
      onAdd({
        exercise_id: exercise.id,
        name: exercise.name,
        sets: 3,
        parameters: [] // Here you would map the parameters from the exercise definition
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white p-8 rounded-3xl w-full max-w-sm shadow-2xl space-y-6">
        <h3 className="font-black text-lg text-zinc-900">הוספת תרגיל לשבלונה</h3>
        
        <select 
          className="w-full p-4 bg-zinc-50 rounded-xl font-bold border border-zinc-200"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">בחר תרגיל מהמאגר...</option>
          {exercises.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>

        <div className="flex gap-4">
          <button onClick={onClose} className="px-4 py-3 font-bold text-zinc-500">ביטול</button>
          <button 
            onClick={handleAdd} 
            disabled={!selectedId}
            className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl font-black disabled:opacity-50"
          >
            הוסף תרגיל
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExerciseModal;