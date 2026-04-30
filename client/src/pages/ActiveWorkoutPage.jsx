import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useWorkoutSessions } from '../hooks/useWorkoutSessions';
import { ExerciseContext } from '../contexts/ExerciseContext';
import { ParameterContext } from '../contexts/ParameterContext';
import { TemplateContext } from '../contexts/TemplateContext';
import { useToast } from '../hooks/useToast';
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
  const { templateId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { submitWorkout, loading: isSaving } = useWorkoutSessions();
  const { exercises, getAllLeafDescendants, fetchExercises } = useContext(ExerciseContext);
  const { parameters, fetchParameters } = useContext(ParameterContext);
  const { fetchTemplateById } = useContext(TemplateContext);
  const { showToast } = useToast();

  const [template, setTemplate] = useState(location.state?.template || null);
  const [workoutData, setWorkoutData] = useState([]);
  const [startTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState("");
  const [actualDuration, setActualDuration] = useState("");
  const [isFetchingTemplate, setIsFetchingTemplate] = useState(false);

  // Load metadata and template if missing (e.g., page refresh)
  useEffect(() => {
    if (exercises.length === 0) fetchExercises();
    if (parameters.length === 0) fetchParameters();
    
    const loadTemplate = async () => {
      if (templateId && !template) {
        setIsFetchingTemplate(true);
        try {
          const data = await fetchTemplateById(parseInt(templateId));
          setTemplate(data);
        } catch (err) {
          showToast("Failed to load workout template", "error");
          navigate('/workout-templates');
        } finally {
          setIsFetchingTemplate(false);
        }
      }
    };
    loadTemplate();
  }, [templateId, template, fetchTemplateById, navigate, showToast, exercises.length, parameters.length, fetchExercises, fetchParameters]);

  /**
   * Frontend Math Engine for Virtual Parameters.
   * Calculates values based on source parameters in real-time.
   */
  const runMath = useCallback((type, values, multiplier) => {
    const nums = values.map(v => parseFloat(v) || 0);
    switch (type) {
      case 'sum': return nums.reduce((a, b) => a + b, 0);
      case 'subtract': return nums[0] - (nums[1] || 0);
      case 'multiply': return nums.reduce((a, b) => a * b, 1);
      case 'divide': return nums[1] !== 0 ? nums[0] / nums[1] : 0;
      case 'percentage': return nums[1] !== 0 ? (nums[0] / nums[1]) * 100 : 0;
      case 'conversion': return nums[0] * (multiplier || 1);
      default: return 0;
    }
  }, []);

  // Initialize workout state based on template config and parameter metadata
  useEffect(() => {
    if (template && parameters.length > 0 && workoutData.length === 0) {
      const initialExercises = template.exercises_config.map((ex, idx) => {
        const initialValues = {};
        ex.params.forEach(p => {
          initialValues[p.parameter_id] = p.value;
        });

        return {
          ...ex,
          instanceId: `ex-${idx}-${Date.now()}`, 
          isDone: false,
          paramsMetadata: ex.params.map(p => {
            const meta = parameters.find(m => Number(m.id) === Number(p.parameter_id));
            return { ...p, ...meta };
          }),
          actualSets: Array.from({ length: ex.num_of_sets }, (_, i) => ({
            id: `set-${idx}-${i}-${Date.now()}`,
            setNum: i + 1,
            isDone: false,
            values: { ...initialValues }
          }))
        };
      });
      setWorkoutData(initialExercises);
    }
  }, [template, parameters, workoutData.length]);

  /**
   * Updates a parameter value in a specific set and triggers virtual calculations.
   */
  const updateSetValue = (exIdx, setIdx, parameterId, newValue) => {
    const newData = [...workoutData];
    const exercise = newData[exIdx];
    const set = exercise.actualSets[setIdx];

    set.values[parameterId] = newValue;

    // Recalculate all virtual parameters for this specific set
    exercise.paramsMetadata.forEach(pMeta => {
      if (pMeta.is_virtual) {
        const sourceIds = pMeta.source_parameter_ids || [];
        const sourceValues = sourceIds.map(sId => set.values[sId] || 0);
        const result = runMath(pMeta.calculation_type, sourceValues, pMeta.multiplier);
        // Format result to remove unnecessary trailing zeros
        set.values[pMeta.id] = result.toFixed(2).replace(/\.00$/, "");
      }
    });

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

  /**
   * Adds a new exercise dynamically during the workout.
   */
  const addNewExercise = async (exercise) => {
    try {
      const res = await exerciseService.getActiveParams(exercise.id);
      const enrichedParams = res.data.map(ap => {
        const meta = parameters.find(m => Number(m.id) === Number(ap.parameter_id));
        return { ...ap, ...meta };
      });

      const initialValues = {};
      enrichedParams.forEach(p => {
        initialValues[p.parameter_id] = p.default_value || "0";
      });

      const newEntry = {
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        instanceId: `ex-new-${Date.now()}`,
        isDone: false,
        paramsMetadata: enrichedParams,
        actualSets: [{
          id: `set-init-${Date.now()}`,
          setNum: 1,
          isDone: false,
          values: initialValues
        }]
      };
      setWorkoutData(prev => [...prev, newEntry]);
      setIsModalOpen(false);
      showToast(`${exercise.name} נוסף לאימון`, "success");
    } catch (err) {
      showToast("Failed to add exercise", "error");
    }
  };

  /**
   * Finalizes the workout session and builds the bulk payload for the server.
   */
  const handleFinish = async () => {
    // Structure: Each exercise contains performance_data as a List of Lists (sets)
    const performedExercisesPayload = workoutData
      .map(ex => {
        const completedSets = ex.actualSets.filter(s => s.isDone);
        if (completedSets.length === 0) return null;

        return {
          exercise_id: ex.exercise_id,
          // List of Lists structure: each set is a list of parameters
          performance_data: completedSets.map(set => (
            ex.paramsMetadata.map(p => ({
              parameter_id: p.parameter_id,
              value: String(set.values[p.parameter_id] || "0")
            }))
          ))
        };
      })
      .filter(Boolean);

    if (performedExercisesPayload.length === 0) {
      showToast("יש לסמן לפחות סט אחד כבוצע", "warning");
      return;
    }

    const sessionPayload = {
      template_id: template?.id || null,
      start_time: startTime.toISOString(),
      workout_summary: workoutSummary,
      actual_duration: actualDuration ? `${actualDuration} min` : null,
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

  // UI Helpers
  const parentExerciseName = useMemo(() => {
    if (!template?.parent_exercise_id || exercises.length === 0) return "כללי";
    const parent = exercises.find(ex => Number(ex.id) === Number(template.parent_exercise_id));
    return parent ? parent.name : "כללי";
  }, [exercises, template]);

  const availableToAdd = useMemo(() => {
    return getAllLeafDescendants(exercises, template?.parent_exercise_id);
  }, [exercises, template, getAllLeafDescendants]);

  if (isFetchingTemplate || !template) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>טוען נתוני אימון...</div>;
  }

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
            onUpdateValue={(sIdx, pId, val) => updateSetValue(idx, sIdx, pId, val)}
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
  container: { marginTop: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '15px', border: '1px solid #eee', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
  title: { margin: '0 0 20px', color: '#333', fontSize: '1.2rem' },
  inputGroup: { marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 'bold', color: '#555' },
  durationInput: { padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  summaryArea: { padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '16px', minHeight: '100px', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },
  finishBtn: { width: '100%', padding: '16px', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(40, 167, 69, 0.2)', transition: 'transform 0.1s' }
};

const styles = {
  addExBtn: { width: '100%', padding: '15px', backgroundColor: '#f8f9fa', border: '2px dashed #ddd', borderRadius: '12px', cursor: 'pointer', marginTop: '20px', marginBottom: '10px', fontWeight: 'bold', color: '#555' }
};

export default ActiveWorkoutPage;