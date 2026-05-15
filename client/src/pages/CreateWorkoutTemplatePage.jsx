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

  // Initial data loading
  useEffect(() => {
    if (exercises.length === 0) fetchExercises();
    if (parameters.length === 0) fetchParameters();
  }, [fetchExercises, fetchParameters, exercises.length, parameters.length]);

  const categoryOptions = useMemo(() => getCategoryTree(exercises), [exercises, getCategoryTree]);

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  // Update exercise bank when the parent category is selected
  useEffect(() => {
    if (!formData.parent_exercise_id) {
      setAvailableExercises([]);
      return;
    }
    const leaves = getAllLeafDescendants(exercises, parseInt(formData.parent_exercise_id));
    setAvailableExercises(leaves);
  }, [formData.parent_exercise_id, exercises, getAllLeafDescendants]);

  /**
   * Adds an exercise to the configuration.
   * Fetches the active parameters for the selected exercise from the server.
   */
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

  /**
   * Updates the number of sets for a specific exercise.
   */
  const updateSets = (index, val) => {
    setFormData(prev => {
      const newConfig = [...prev.exercises_config];
      newConfig[index] = { ...newConfig[index], num_of_sets: val };
      return { ...prev, exercises_config: newConfig };
    });
  };

  /**
   * Bulk updates the parameters for a specific exercise.
   * This is called by TemplateExerciseItem after it performs calculations.
   */
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

  /**
   * Removes an exercise from the workout configuration.
   */
  const removeExercise = (index) => {
    setFormData(prev => ({
      ...prev,
      exercises_config: prev.exercises_config.filter((_, i) => i !== index)
    }));
  };

  /**
   * Handles reordering of exercises via drag and drop.
   */
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

  /**
   * Submits the form data to the server.
   * Strips extra metadata from params to send only id and value as required by the backend.
   */
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
    <div style={{ direction: 'rtl', padding: '10px', maxWidth: '800px', margin: '0 auto' }}>
      <form onSubmit={handleSubmit}>
        <TemplateGeneralInfo 
          formData={formData} 
          setFormData={setFormData} 
          categoryOptions={categoryOptions} 
          styles={styles} 
        />

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>🏋️ מבנה האימון</h3>
          
          <TemplateExerciseBank 
            parentId={formData.parent_exercise_id} 
            loading={loadingAvailable}
            availableExercises={availableExercises} 
            onAdd={addExerciseToConfig} 
            styles={styles}
          />

          <TemplateExerciseConfig 
            exercisesConfig={formData.exercises_config} 
            sensors={sensors}
            updateSets={updateSets}
            onUpdateExerciseParams={onUpdateExerciseParams}
            removeExercise={removeExercise}
            handleDragEnd={handleDragEnd}
            styles={styles}
          />
        </section>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>⏰ תזמון וזמן</h3>
          <TemplateScheduling 
            scheduledDays={formData.scheduled_days} 
            expectedDurationTime={formData.expected_duration_time}
            scheduledHour={formData.scheduled_hour}
            onDaysChange={(days) => setFormData({...formData, scheduled_days: days})}
            onDurationChange={(time) => setFormData({...formData, expected_duration_time: time})}
            onHourChange={(hour) => setFormData({...formData, scheduled_hour: hour})}
          />
        </section>

        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>👥 משויך למתאמנים</h3>
          <UserSelectionGrid 
            selectedUserIds={formData.for_users}
            onChange={(users) => setFormData({...formData, for_users: users})}
          />
        </section>

        <TemplateFooter onCancel={onCancel} styles={styles} />
      </form>
    </div>
  );
};

const styles = {
  section: { background: '#fff', padding: '20px', borderRadius: '15px', border: '1px solid #f0f0f0', marginBottom: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' },
  sectionTitle: { margin: '0 0 15px 0', fontSize: '18px', color: '#495057' },
  input: { width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', outline: 'none' },
  label: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold', color: '#666' },
  bankContainer: { marginBottom: '25px', backgroundColor: '#fcfcfc', padding: '15px', borderRadius: '12px', border: '1px solid #f0f0f0' },
  bankHeader: { fontSize: '14px', margin: '0 0 10px 0', color: '#6c757d' },
  bankScroll: { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'thin' },
  bankItem: { flex: '0 0 auto', padding: '10px 15px', backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '30px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', transition: 'all 0.2s' },
  bankEmpty: { fontSize: '13px', color: '#999', fontStyle: 'italic' },
  emptyConfig: { textAlign: 'center', padding: '30px', border: '2px dashed #eee', borderRadius: '15px', color: '#ccc' },
  footer: { marginTop: '30px', display: 'flex', gap: '15px', position: 'sticky', bottom: '20px', zIndex: 10 },
  submitBtn: { flex: 2, padding: '15px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,123,255,0.3)' },
  cancelBtn: { flex: 1, padding: '15px', backgroundColor: '#fff', color: '#666', border: '1px solid #ddd', borderRadius: '12px', cursor: 'pointer' },
};

export default CreateWorkoutTemplatePage;