import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useExercise } from '../contexts/ExerciseContext';
import { useTag } from '../contexts/TagContext';
import { useParameter } from '../contexts/ParameterContext';
import { useToast } from '../contexts/ToastContext';
import FrontendLogger from '../utils/logger';

import ExerciseForm from '../components/common/Exercise/ExerciseForm';
import ExerciseTable from '../components/ExerciseManagerPage/ExerciseTable';

const ExerciseManagerPage = () => {
  const { user } = useContext(AuthContext);
  const { exercises, loading, fetchExercises, addExercise, editExercise, removeExercise, addBulkExercises } = useExercise();
  const { tags, fetchTags } = useTag();
  const { parameters, fetchParameters } = useParameter();
  const { showToast } = useToast();

  const [editingId, setEditingId] = useState(null);
  
  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  useEffect(() => {
    FrontendLogger.info('EXERCISE_MANAGER', 'Initializing exercise domain page');
    fetchExercises();
    fetchTags();
    fetchParameters();
  }, [fetchExercises, fetchTags, fetchParameters]);

  const handleCreateOrUpdate = async (data) => {
    try {
      if (editingId) {
        await editExercise(editingId, data);
        showToast("התרגיל עודכן בהצלחה", "success");
      } else {
        await addExercise(data);
        showToast("התרגיל נוסף בהצלחה", "success");
      }
      setEditingId(null);
    } catch (e) {
      showToast("שגיאה בפעולה", "error");
    }
  };

  return (
    <div className="space-y-10 p-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-zinc-900">ניהול ספריית תרגילים</h1>
      </div>

      {isTrainer && (
        <ExerciseForm 
          editingId={editingId}
          initialData={editingId ? exercises.find(e => e.id === editingId) : null}
          onSubmit={handleCreateOrUpdate}
          onCancel={() => setEditingId(null)}
          existingExercises={exercises}
          existingTags={tags}
          existingParams={parameters}
          onImportBulk={addBulkExercises}
        />
      )}

      <ExerciseTable 
        exercises={exercises} 
        loading={loading}
        onEdit={isTrainer ? setEditingId : null}
        onDelete={isTrainer ? removeExercise : null}
      />
    </div>
  );
};

export default ExerciseManagerPage;