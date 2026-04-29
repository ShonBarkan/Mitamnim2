import React, { useState, useEffect, useContext, useMemo } from 'react';
import { ExerciseContext } from '../contexts/ExerciseContext';
import { TemplateContext } from '../contexts/TemplateContext';
import { useToast } from '../hooks/useToast';
import api from '../services/api';
import { arrayMove } from '@dnd-kit/sortable';
import { useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';

// Sub-components - Updated paths and naming consistency
import TemplateGeneralInfo from '../components/Templates/CreateWorkoutTemplatePage/TemplateGeneralInfo';
import TemplateExerciseBank from '../components/Templates/CreateWorkoutTemplatePage/TemplateExerciseBank';
import TemplateExerciseConfig from '../components/Templates/CreateWorkoutTemplatePage/TemplateExerciseConfig';
import TemplateFooter from '../components/Templates/CreateWorkoutTemplatePage/TemplateFooter';
import UserSelectionGrid from '../components/Templates/CreateWorkoutTemplatePage/UserSelectionGrid';
import TemplateScheduling from '../components/Templates/CreateWorkoutTemplatePage/TemplateScheduling';

const CreateWorkoutTemplatePage = ({ initialData = null, onSave, onCancel }) => {
  const { exercises, fetchExercises, getCategoryTree, getAllLeafDescendants } = useContext(ExerciseContext);
  const { addTemplate, editTemplate } = useContext(TemplateContext);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_exercise_id: '',
    expected_duration_time: '45', // Renamed from expected_time
    scheduled_hour: '',           // Renamed from cron_expression
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

  // Sync exercises from context on mount
  useEffect(() => {
    if (exercises.length === 0) fetchExercises();
  }, [fetchExercises, exercises.length]);

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

  // --- Handlers ---

  const addExerciseToConfig = async (exercise) => {
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
          value: p.default_value || '' 
        }))
      };

      setFormData(prev => ({
        ...prev,
        exercises_config: [...prev.exercises_config, newExerciseEntry]
      }));
    } catch (err) {
      showToast("Failed to fetch exercise parameters", "error");
    }
  };

  const updateSets = (index, val) => {
    setFormData(prev => {
      const newConfig = [...prev.exercises_config];
      newConfig[index] = { ...newConfig[index], num_of_sets: val };
      return { ...prev, exercises_config: newConfig };
    });
  };

  const updateParamValue = (exerciseIdx, paramIdx, value) => {
    setFormData(prev => {
      const newConfig = [...prev.exercises_config];
      const updatedExercise = { ...newConfig[exerciseIdx] };
      
      updatedExercise.params = [...updatedExercise.params];
      updatedExercise.params[paramIdx] = { 
        ...updatedExercise.params[paramIdx], 
        value: value 
      };
      
      newConfig[exerciseIdx] = updatedExercise;
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
    if (active.id !== over.id) {
      setFormData(prev => {
        const oldIndex = prev.exercises_config.findIndex((_, i) => `item-${i}-${prev.exercises_config[i].exercise_id}` === active.id);
        const newIndex = prev.exercises_config.findIndex((_, i) => `item-${i}-${prev.exercises_config[i].exercise_id}` === over.id);
        return {
          ...prev,
          exercises_config: arrayMove(prev.exercises_config, oldIndex, newIndex)
        };
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.exercises_config.length === 0) {
      showToast("Please add at least one exercise", "error");
      return;
    }
    try {
      if (initialData?.id) {
        await editTemplate(initialData.id, formData);
        showToast("Template updated successfully!", "success");
      } else {
        await addTemplate(formData);
        showToast("Saved!", "success");
      }
      if (onSave) onSave();
    } catch (err) {
      showToast("Error saving template", "error");
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
            updateParamValue={updateParamValue}
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