import React from 'react';
import ExerciseForm from '../common/Exercise/ExerciseForm';
import { useExercise } from '../../contexts/ExerciseContext';

const AddExerciseModal = ({ isOpen, onClose }) => {
  const { fetchExercises } = useExercise();

  if (!isOpen) return null;

  const handleSuccess = () => {
    fetchExercises();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-3xl w-full max-w-lg shadow-2xl">
        <h3 className="font-black text-lg mb-6">הוספת תרגיל חדש למאגר</h3>
        
        <ExerciseForm onSuccess={handleSuccess} />
        
        <button 
          onClick={onClose} 
          className="mt-6 w-full py-3 font-bold text-zinc-500"
        >
          סגור
        </button>
      </div>
    </div>
  );
};

export default AddExerciseModal;