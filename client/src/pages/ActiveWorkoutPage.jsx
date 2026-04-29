import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useWorkoutSessions } from '../hooks/useWorkoutSessions';
import { ExerciseContext } from '../contexts/ExerciseContext';
import { useToast } from '../hooks/useToast';
import { workoutSessionService } from '../services/workoutSessionService';
import { exerciseService } from '../services/exerciseService';

// Sub-components
import WorkoutHeader from '../components/ActiveWorkoutPage/WorkoutHeader';
import ExerciseActiveCard from '../components/ActiveWorkoutPage/ExerciseActiveCard';
import AddExerciseModal from '../components/ActiveWorkoutPage/AddExerciseModal';

/**
 * Internal component for the workout summary and final actions.
 */
const WorkoutFooterSection = ({ 
  summary, 
  setSummary, 
  duration, 
  setDuration, 
  onFinish, 
  isSaving 
}) => {
  return (
    <div style={footerStyles.container}>
      <h3 style={footerStyles.title}>סיכום וסיום אימון</h3>
      
      <div style={footerStyles.inputGroup}>
        <label style={footerStyles.label}>כמה זמן לקח האימון? (בדקות - אופציונלי)</label>
        <input 
          type="number"
          placeholder="למשל: 45"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          style={footerStyles.durationInput}
        />
      </div>

      <div style={footerStyles.inputGroup}>
        <label style={footerStyles.label}>איך היה האימון? (סיכום קצר)</label>
        <textarea 
          placeholder="כתוב כאן הערות, תחושות או דגשים..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          style={footerStyles.summaryArea}
        />
      </div>

      <button 
        onClick={onFinish}
        disabled={isSaving}
        style={{
          ...footerStyles.finishBtn,
          backgroundColor: isSaving ? '#94d3a2' : '#28a745'
        }}
      >
        {isSaving ? "שומר נתונים..." : "✅ סיום ושמירת אימון"}
      </button>
    </div>
  );
};

const ActiveWorkoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { submitWorkout, loading: isSaving } = useWorkoutSessions();
  const { exercises, getAllLeafDescendants, fetchExercises } = useContext(ExerciseContext);
  const { showToast } = useToast();

  const template = location.state?.template;

  const [workoutData, setWorkoutData] = useState([]);
  const [startTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState("");
  const [actualDuration, setActualDuration] = useState("");

  useEffect(() => {
    if (exercises.length === 0) {
      fetchExercises();
    }
  }, [exercises.length, fetchExercises]);

  const parentExerciseName = useMemo(() => {
    if (!template?.parent_exercise_id || exercises.length === 0) return "כללי";
    const parent = exercises.find(ex => ex.id == template.parent_exercise_id);
    return parent ? parent.name : "כללי";
  }, [exercises, template]);

  useEffect(() => {
    if (!template) {
      navigate('/workout-templates');
      return;
    }

    const initialExercises = template.exercises_config.map((ex, idx) => ({
      ...ex,
      instanceId: `ex-${idx}-${Date.now()}`, 
      isDone: false,
      paramsMetadata: ex.params, 
      actualSets: Array.from({ length: ex.num_of_sets }, (_, i) => ({
        id: `set-${idx}-${i}-${Date.now()}`,
        setNum: i + 1,
        isDone: false,
        values: ex.params.reduce((acc, p) => ({ ...acc, [p.parameter_name]: p.value }), {})
      }))
    }));

    setWorkoutData(initialExercises);
  }, [template, navigate]);

  const updateSetValue = (exIdx, setIdx, paramName, value) => {
    const newData = [...workoutData];
    newData[exIdx].actualSets[setIdx].values[paramName] = value;
    setWorkoutData(newData);
  };

  const addSetToExercise = (exIdx) => {
    const newData = [...workoutData];
    const sets = newData[exIdx].actualSets;
    const lastSet = sets[sets.length - 1];
    
    sets.push({
      id: `set-new-${Date.now()}`,
      setNum: sets.length + 1,
      isDone: false,
      values: lastSet ? { ...lastSet.values } : {}
    });
    setWorkoutData(newData);
  };

  const deleteSet = (exIdx, setIdx) => {
    const newData = [...workoutData];
    newData[exIdx].actualSets.splice(setIdx, 1);
    newData[exIdx].actualSets = newData[exIdx].actualSets.map((s, i) => ({ 
      ...s, 
      setNum: i + 1 
    }));
    setWorkoutData(newData);
  };

  const toggleSetDone = (exIdx, setIdx) => {
    const newData = [...workoutData];
    newData[exIdx].actualSets[setIdx].isDone = !newData[exIdx].actualSets[setIdx].isDone;
    setWorkoutData(newData);
  };

  const reorderSets = (exIdx, newSets) => {
    const newData = [...workoutData];
    newData[exIdx].actualSets = newSets;
    setWorkoutData(newData);
  };

  const addNewExercise = async (exercise) => {
    try {
      const res = await exerciseService.getActiveParams(exercise.id);
      const params = res.data;

      const newEntry = {
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        instanceId: `ex-new-${Date.now()}`,
        isDone: false,
        paramsMetadata: params,
        actualSets: [{
          id: `set-init-${Date.now()}`,
          setNum: 1,
          isDone: false,
          values: params.reduce((acc, p) => ({ ...acc, [p.parameter_name]: "" }), {})
        }]
      };
      setWorkoutData(prev => [...prev, newEntry]);
      setIsModalOpen(false);
      showToast(`${exercise.name} נוסף לאימון`, "success");
    } catch (err) {
      showToast("נכשל בהוספת תרגיל", "error");
    }
  };

  const handleFinish = async () => {
    // 1. Filter only the exercises that have at least one set done
    // 2. Map each DONE set to its own entry in performed_exercises
    const performedExercisesPayload = workoutData.flatMap(ex => {
      const completedSets = ex.actualSets.filter(s => s.isDone);
      
      return completedSets.map(set => ({
        exercise_id: ex.exercise_id,
        performance_data: ex.paramsMetadata.map(p => ({
          parameter_id: p.parameter_id,
          parameter_name: p.parameter_name,
          unit: p.parameter_unit || p.unit, 
          value: String(set.values[p.parameter_name] || "")
        }))
      }));
    });

    if (performedExercisesPayload.length === 0) {
      showToast("יש לסמן לפחות סט אחד כבוצע", "warning");
      return;
    }

    const sessionPayload = {
      template_id: template.id,
      start_time: startTime.toISOString(),
      workout_summary: workoutSummary,
      actual_duration: actualDuration ? `${actualDuration} min` : null, // Backend expects string based on your schema
      performed_exercises: performedExercisesPayload
    };

    try {
      await submitWorkout(sessionPayload);
      showToast("האימון נשמר בהצלחה!", "success");
      navigate('/history');
    } catch (err) {
      showToast("שגיאה בשמירת האימון", "error");
    }
  };

  const availableToAdd = useMemo(() => {
    return getAllLeafDescendants(exercises, template?.parent_exercise_id);
  }, [exercises, template, getAllLeafDescendants]);

  return (
    <div style={{ paddingBottom: '80px', direction: 'rtl' }}>
      <WorkoutHeader 
        name={template?.name} 
        description={template?.description}
        parentName={parentExerciseName}
        onSave={handleFinish}
        onCancel={() => {
          if (window.confirm("בטוח שברצונך לצאת? הנתונים לא יישמרו.")) {
            navigate('/workout-templates');
          }
        }}
        isSaving={isSaving}
      />

      <div style={{ padding: '15px', maxWidth: '800px', margin: '0 auto' }}>
        {workoutData.map((ex, idx) => (
          <ExerciseActiveCard 
            key={ex.instanceId}
            exercise={ex}
            onUpdateValue={(sIdx, pName, val) => updateSetValue(idx, sIdx, pName, val)}
            onAddSet={() => addSetToExercise(idx)}
            onDeleteSet={(sIdx) => deleteSet(idx, sIdx)}
            onToggleSetDone={(sIdx) => toggleSetDone(idx, sIdx)}
            onReorderSets={(newSets) => reorderSets(idx, newSets)}
          />
        ))}

        <button 
          onClick={() => setIsModalOpen(true)}
          style={styles.addExBtn}
        >
          + הוסף תרגיל לאימון
        </button>

        <WorkoutFooterSection 
          summary={workoutSummary}
          setSummary={setWorkoutSummary}
          duration={actualDuration}
          setDuration={setActualDuration}
          onFinish={handleFinish}
          isSaving={isSaving}
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

const footerStyles = {
  container: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '15px',
    border: '1px solid #eee',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
  },
  title: { margin: '0 0 20px', color: '#333', fontSize: '1.2rem' },
  inputGroup: { marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 'bold', color: '#555' },
  durationInput: {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    fontSize: '16px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  },
  summaryArea: {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    fontSize: '16px',
    minHeight: '100px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  finishBtn: {
    width: '100%',
    padding: '16px',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.2)',
    transition: 'transform 0.1s'
  }
};

const styles = {
  addExBtn: { 
    width: '100%', 
    padding: '15px', 
    backgroundColor: '#f8f9fa', 
    border: '2px dashed #ddd', 
    borderRadius: '12px', 
    cursor: 'pointer', 
    marginTop: '20px', 
    marginBottom: '10px',
    fontWeight: 'bold',
    color: '#555'
  }
};

export default ActiveWorkoutPage;