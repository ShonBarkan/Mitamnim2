import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { WorkoutContext } from '../contexts/WorkoutContext';
import { ExerciseContext } from '../contexts/ExerciseContext';
import { useToast } from '../hooks/useToast';
import api from '../services/api';

// Sub-components
import WorkoutHeader from '../components/ActiveWorkoutPage/WorkoutHeader';
import ExerciseActiveCard from '../components/ActiveWorkoutPage/ExerciseActiveCard';
import AddExerciseModal from '../components/ActiveWorkoutPage/AddExerciseModal';

const ActiveWorkoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { saveWorkoutSession, isSaving } = useContext(WorkoutContext);
  const { exercises, getAllLeafDescendants } = useContext(ExerciseContext);
  const { showToast } = useToast();

  // The template selected from the previous screen
  const template = location.state?.template;

  const [workoutData, setWorkoutData] = useState([]);
  const [startTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState("");

  // Initialize workout from template
  useEffect(() => {
    if (!template) {
      navigate('/templates');
      return;
    }

    const initialExercises = template.exercises_config.map((ex, idx) => ({
      ...ex,
      instanceId: `ex-${idx}-${Date.now()}`, // Unique ID for live session
      isDone: false,
      // Create sets based on num_of_sets in template
      actualSets: Array.from({ length: ex.num_of_sets }, (_, i) => ({
        setNum: i + 1,
        values: ex.params.reduce((acc, p) => ({ ...acc, [p.parameter_name]: p.value }), {})
      }))
    }));

    setWorkoutData(initialExercises);
  }, [template, navigate]);

  // Logic to add a new exercise on-the-fly
  const addNewExercise = async (exercise) => {
    try {
      const res = await api.get(`/exercises/${exercise.id}/active-params`);
      const newEntry = {
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        instanceId: `ex-new-${Date.now()}`,
        isDone: false,
        params: res.data,
        actualSets: [{
          setNum: 1,
          values: res.data.reduce((acc, p) => ({ ...acc, [p.parameter_name]: p.default_value || "" }), {})
        }]
      };
      setWorkoutData(prev => [...prev, newEntry]);
      setIsModalOpen(false);
      showToast(`${exercise.name} added`, "success");
    } catch (err) {
      showToast("Failed to add exercise", "error");
    }
  };

  const updateSetValue = (exIdx, setIdx, paramName, value) => {
    const newData = [...workoutData];
    newData[exIdx].actualSets[setIdx].values[paramName] = value;
    setWorkoutData(newData);
  };

  const addSetToExercise = (exIdx) => {
    const newData = [...workoutData];
    const lastSet = newData[exIdx].actualSets[newData[exIdx].actualSets.length - 1];
    newData[exIdx].actualSets.push({
      setNum: newData[exIdx].actualSets.length + 1,
      values: { ...lastSet.values }
    });
    setWorkoutData(newData);
  };

  const toggleDone = (exIdx) => {
    const newData = [...workoutData];
    newData[exIdx].isDone = !newData[exIdx].isDone;
    setWorkoutData(newData);
  };

  const handleFinish = async () => {
    const doneExercises = workoutData.filter(ex => ex.isDone);
    
    if (doneExercises.length === 0) {
      showToast("Please mark at least one exercise as done", "warning");
      return;
    }

    const endTime = new Date();
    const durationMinutes = Math.floor((endTime - startTime) / 60000);

    const sessionPayload = {
      template_id: template.id,
      start_time: startTime.toISOString(),
      workout_summary: workoutSummary,
      actual_duration: `${durationMinutes} min`,
      performed_exercises: doneExercises.map(ex => {
        // We take the values from the last set performed
        const lastSetValues = ex.actualSets[ex.actualSets.length - 1].values;
        return {
          exercise_id: ex.exercise_id,
          performance_data: lastSetValues
        };
      })
    };

    try {
      await saveWorkoutSession(sessionPayload);
      showToast("Workout saved successfully!", "success");
      navigate('/history');
    } catch (err) {
      showToast("Error saving workout", "error");
    }
  };

  // Get available exercises to add (filtered by template's parent category)
  const availableToAdd = useMemo(() => {
    return getAllLeafDescendants(exercises, template?.parent_exercise_id);
  }, [exercises, template, getAllLeafDescendants]);

  return (
    <div style={{ paddingBottom: '80px', direction: 'rtl' }}>
      <WorkoutHeader 
        name={template?.name} 
        description={template?.description}
        parentName={template?.parent_exercise?.name || "General"}
        onSave={handleFinish}
        isSaving={isSaving}
      />

      <div style={{ padding: '15px' }}>
        {workoutData.map((ex, idx) => (
          <ExerciseActiveCard 
            key={ex.instanceId}
            exercise={ex}
            onUpdateValue={(setIdx, pName, val) => updateSetValue(idx, setIdx, pName, val)}
            onAddSet={() => addSetToExercise(idx)}
            onToggleDone={() => toggleDone(idx)}
          />
        ))}

        <button 
          onClick={() => setIsModalOpen(true)}
          style={styles.addExBtn}
        >
          + הוסף תרגיל לאימון
        </button>

        <textarea 
          placeholder="סיכום אימון (איך הרגשת?)..."
          value={workoutSummary}
          onChange={(e) => setWorkoutSummary(e.target.value)}
          style={styles.summaryArea}
        />
      </div>

      <AddExerciseModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        exercises={availableToAdd}
        onSelect={addNewExercise}
      />
    </div>
  );
};

const styles = {
  addExBtn: { width: '100%', padding: '15px', backgroundColor: '#f8f9fa', border: '2px dashed #ddd', borderRadius: '12px', cursor: 'pointer', marginTop: '20px', fontWeight: 'bold' },
  summaryArea: { width: '100%', marginTop: '20px', padding: '15px', borderRadius: '12px', border: '1px solid #ddd', minHeight: '100px', outline: 'none' }
};

export default ActiveWorkoutPage;