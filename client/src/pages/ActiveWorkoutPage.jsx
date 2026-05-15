import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ExerciseContext } from '../contexts/ExerciseContext';
import { ParameterContext } from '../contexts/ParameterContext';
import { TemplateContext } from '../contexts/TemplateContext';
import { WorkoutContext } from '../contexts/WorkoutContext'; // Hooking up the new context
import { useToast } from '../hooks/useToast';

// Sub-components mapped to premium architecture standards
import WorkoutHeader from '../components/ActiveWorkoutPage/WorkoutHeader';
import ExerciseActiveCard from '../components/ActiveWorkoutPage/ExerciseActiveCard';
import AddExerciseModal from '../components/ActiveWorkoutPage/AddExerciseModal';
import WorkoutFooterSection from '../components/ActiveWorkoutPage/WorkoutFooterSection';

/**
 * ActiveWorkoutPage Component - Tracks live workout performance execution.
 * Rewritten to consume WorkoutContext and fully support local mock-database lifecycles.
 */
const ActiveWorkoutPage = () => {
  const { templateId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Consuming the new custom workout state architecture layer
  const { saveWorkoutSession, isSaving } = useContext(WorkoutContext);
  const { exercises, fetchExercises } = useContext(ExerciseContext);
  const { parameters, fetchParameters } = useContext(ParameterContext);
  const { fetchTemplateById } = useContext(TemplateContext);
  const { showToast } = useToast();

  const [template, setTemplate] = useState(location.state?.template || null);
  const [workoutData, setWorkoutData] = useState([]);
  const [startTime, setStartTime] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [workoutSummary, setWorkoutSummary] = useState("");
  const [actualDuration, setActualDuration] = useState("");
  const [isFetchingTemplate, setIsFetchingTemplate] = useState(false);

  // Sync structural core definitions cache tables on mount
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
   * Real-time calculation engine for synchronous math metrics parameter structures.
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

  // Initialize tracking node cards dynamically based on current configurations
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
            return {
              ...p,
              ...meta,
              parameter_name: meta?.name || p.parameter_name || `Param ${p.parameter_id}`,
            };
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
   * Dispatches internal row input updates and updates dependent math calculations.
   */
  const updateSetValue = (exIdx, setIdx, parameterId, newValue) => {
    const newData = [...workoutData];
    const exercise = newData[exIdx];
    const set = exercise.actualSets[setIdx];

    set.values[parameterId] = newValue;

    exercise.paramsMetadata.forEach(pMeta => {
      if (pMeta.is_virtual) {
        const sourceIds = pMeta.source_parameter_ids || [];
        const sourceValues = sourceIds.map(sId => set.values[sId] || 0);
        const result = runMath(pMeta.calculation_type, sourceValues, pMeta.multiplier);
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
   * Injects an exercise from the Flat Registry directly into the active tracking dashboard.
   */
  const addNewExercise = (exercise) => {
    const activeParamIds = exercise.active_parameter_ids || [];
    const enrichedParams = activeParamIds.map(pId => {
      const meta = parameters.find(m => Number(m.id) === Number(pId));
      return {
        parameter_id: pId,
        ...meta,
        parameter_name: meta?.name || `Param ${pId}`
      };
    }).filter(p => !p.is_virtual);

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
  };

  /**
   * Compiles the performance metrics payload and submits it down to the context layer.
   */
  const handleFinish = async () => {
    const performedExercisesPayload = workoutData
      .map(ex => {
        const completedSets = ex.actualSets.filter(s => s.isDone);
        if (completedSets.length === 0) return null;

        return {
          exercise_id: ex.exercise_id,
          exercise_name: ex.exercise_name,
          performance_data: completedSets.map(set => (
            ex.paramsMetadata.map(p => ({
              parameter_id: p.parameter_id,
              parameter_name: p.parameter_name,
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

    // Map a fallback array to support mock DB standalone logs injection structure
    const flattenedMockLogs = [];
    performedExercisesPayload.forEach(ex => {
      ex.performance_data.forEach(setMetrics => {
        flattenedMockLogs.push({
          exercise_id: ex.exercise_id,
          exercise_name: ex.exercise_name,
          timestamp: startTime.toISOString(),
          performance_data: setMetrics
        });
      });
    });

    const sessionPayload = {
      template_id: template?.id || null,
      start_time: startTime.toISOString(),
      workout_summary: workoutSummary,
      actual_duration: actualDuration ? `${actualDuration} min` : null,
      performed_exercises: performedExercisesPayload,
      logs: flattenedMockLogs // Ensures full compatibility with dev-mode localStorage pipelines
    };

    try {
      await saveWorkoutSession(sessionPayload);
      showToast("האימון נשמר בהצלחה!", "success");
      navigate('/activity');
    } catch (err) {
      showToast("שגיאה בשמירת האימון", "error");
    }
  };

  const parentCategoryName = useMemo(() => {
    return template?.category || "כללי";
  }, [template]);

  const availableToAdd = useMemo(() => {
    if (!template?.category) return exercises;
    return exercises.filter(ex => ex.category === template.category);
  }, [exercises, template]);

  if (isFetchingTemplate || !template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-100 to-zinc-200">
        <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-4" />
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] animate-pulse">Initializing Execution Session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-100 to-zinc-200 font-sans pb-24" dir="rtl">
      <WorkoutHeader 
        name={template?.name} 
        description={template?.description}
        parentName={parentCategoryName}
        onSave={handleFinish}
        onCancel={() => {
          if (window.confirm("בטוח שברצונך לצאת? הנתונים הנוכחיים לא יישמרו.")) {
            navigate('/workout-templates');
          }
        }}
        isSaving={isSaving}
        onAddExercise={() => setIsModalOpen(true)}
        startTime={startTime}
        setStartTime={setStartTime}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
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

export default ActiveWorkoutPage;