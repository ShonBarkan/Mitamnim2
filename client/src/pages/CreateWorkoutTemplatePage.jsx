import React, { useState, useEffect, useContext, useMemo } from 'react';
import { ExerciseContext } from '../contexts/ExerciseContext';
import { TemplateContext } from '../contexts/TemplateContext';
import { ParameterContext } from '../contexts/ParameterContext';
import { useToast } from '../hooks/useToast';
import api from '../services/api';
import { arrayMove } from '@dnd-kit/sortable';
import { useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';

// Sub-components
import TemplateGeneralInfo from '../components/Templates/CreateWorkoutTemplatePage/TemplateGeneralInfo';
import TemplateExerciseBank from '../components/Templates/CreateWorkoutTemplatePage/TemplateExerciseBank';
import TemplateExerciseConfig from '../components/Templates/CreateWorkoutTemplatePage/TemplateExerciseConfig';
import TemplateFooter from '../components/Templates/CreateWorkoutTemplatePage/TemplateFooter';
import UserSelectionGrid from '../components/Templates/CreateWorkoutTemplatePage/UserSelectionGrid';
import TemplateScheduling from '../components/Templates/CreateWorkoutTemplatePage/TemplateScheduling';

const CreateWorkoutTemplatePage = ({ initialData = null, onSave, onCancel }) => {
  const { exercises, fetchExercises, getCategoryTree, getAllLeafDescendants } = useContext(ExerciseContext);
  const { addTemplate, editTemplate } = useContext(TemplateContext);
  const { parameters, fetchParameters } = useContext(ParameterContext);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_exercise_id: '',
    expected_duration_time: '45',
    scheduled_hour: '',
    exercises_config: [],
    for_users: [],
    scheduled_days: []
  });

  const [availableExercises, setAvailableExercises] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  useEffect(() => {
    if (exercises.length === 0) fetchExercises();
    if (parameters.length === 0) fetchParameters();
  }, [fetchExercises, fetchParameters, exercises.length, parameters.length]);

  const categoryOptions = useMemo(() => getCategoryTree(exercises), [exercises, getCategoryTree]);

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  useEffect(() => {
    if (!formData.parent_exercise_id) {
      setAvailableExercises([]);
      return;
    }
    const leaves = getAllLeafDescendants(exercises, parseInt(formData.parent_exercise_id));
    setAvailableExercises(leaves);
  }, [formData.parent_exercise_id, exercises, getAllLeafDescendants]);

  const addExerciseToConfig = async (exercise) => {
    setLoadingAvailable(true);
    try {
      const res = await api.get(`/exercises/${exercise.id}/active-params`);
      
      const newExerciseEntry = {
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        num_of_sets: 3,
        params: res.data.map(p => ({
          parameter_id: p.parameter_id,
          parameter_name: p.parameter_name,
          parameter_unit: p.parameter_unit,
          value: p.default_value || '0'
        }))
      };

      setFormData(prev => ({
        ...prev,
        exercises_config: [...prev.exercises_config, newExerciseEntry]
      }));
    } catch (err) {
      showToast("שגיאה בטעינת פרמטרי התרגיל", "error");
    } finally {
      setLoadingAvailable(false);
    }
  };

  const updateSets = (index, val) => {
    setFormData(prev => {
      const newConfig = [...prev.exercises_config];
      newConfig[index] = { ...newConfig[index], num_of_sets: val };
      return { ...prev, exercises_config: newConfig };
    });
  };

  const onUpdateExerciseParams = (exerciseIdx, updatedParams) => {
    setFormData(prev => {
      const newConfig = [...prev.exercises_config];
      newConfig[exerciseIdx] = { 
        ...newConfig[exerciseIdx], 
        params: updatedParams 
      };
      return { ...prev, exercises_config: newConfig };
    });
  };

  const removeExercise = (index) => {
    setFormData(prev => ({
      ...prev,
      exercises_config: prev.exercises_config.filter((_, i) => i !== index)
    }));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setFormData(prev => {
        const oldIndex = prev.exercises_config.findIndex((_, i) => `item-${i}-${prev.exercises_config[i].exercise_id}` === active.id);
        const newIndex = prev.exercises_config.findIndex((_, i) => `item-${i}-${prev.exercises_config[i].exercise_id}` === over.id);
        
        if (oldIndex !== -1 && newIndex !== -1) {
          return {
            ...prev,
            exercises_config: arrayMove(prev.exercises_config, oldIndex, newIndex)
          };
        }
        return prev;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.exercises_config.length === 0) {
      showToast("יש להוסיף לפחות תרגיל אחד", "error");
      return;
    }

    const payload = {
      ...formData,
      exercises_config: formData.exercises_config.map(ex => ({
        ...ex,
        params: ex.params.map(p => ({
          parameter_id: p.parameter_id,
          value: p.value
        }))
      }))
    };

    try {
      if (initialData?.id) {
        await editTemplate(initialData.id, payload);
        showToast("השבלונה עודכנה בהצלחה!", "success");
      } else {
        await addTemplate(payload);
        showToast("השבלונה נשמרה בהצלחה!", "success");
      }
      if (onSave) onSave();
    } catch (err) {
      showToast("שגיאה בשמירת השבלונה", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 pt-8" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <TemplateGeneralInfo 
            formData={formData} 
            setFormData={setFormData} 
            categoryOptions={categoryOptions} 
          />

          <section className="bg-white/30 p-6 rounded-2xl border border-zinc-100 shadow-sm backdrop-blur-md">
            <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
              <span className="text-xl">🏋️</span> מבנה האימון
            </h3>
            
            <TemplateExerciseBank 
              parentId={formData.parent_exercise_id} 
              loading={loadingAvailable}
              availableExercises={availableExercises} 
              onAdd={addExerciseToConfig} 
            />

            <div className="mt-6">
              <TemplateExerciseConfig 
                exercisesConfig={formData.exercises_config} 
                sensors={sensors}
                updateSets={updateSets}
                onUpdateExerciseParams={onUpdateExerciseParams}
                removeExercise={removeExercise}
                handleDragEnd={handleDragEnd}
              />
            </div>
          </section>

          <section className="bg-white/30 p-6 rounded-2xl border border-zinc-100 shadow-sm backdrop-blur-md">
            <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
              <span className="text-xl">⏰</span> תזמון וזמן
            </h3>
            <TemplateScheduling 
              scheduledDays={formData.scheduled_days} 
              expectedDurationTime={formData.expected_duration_time}
              scheduledHour={formData.scheduled_hour}
              onDaysChange={(days) => setFormData({...formData, scheduled_days: days})}
              onDurationChange={(time) => setFormData({...formData, expected_duration_time: time})}
              onHourChange={(hour) => setFormData({...formData, scheduled_hour: hour})}
            />
          </section>

          <section className="bg-white/30 p-6 rounded-2xl border border-zinc-100 shadow-sm backdrop-blur-md">
            <h3 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
              <span className="text-xl">👥</span> משויך למתאמנים
            </h3>
            <UserSelectionGrid 
              selectedUserIds={formData.for_users}
              onChange={(users) => setFormData({...formData, for_users: users})}
            />
          </section>

          <TemplateFooter onCancel={onCancel} />
        </form>
      </div>
    </div>
  );
};

export default CreateWorkoutTemplatePage;