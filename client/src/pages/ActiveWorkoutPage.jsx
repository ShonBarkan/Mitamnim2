import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ExerciseContext } from '../contexts/ExerciseContext';
import { ParameterContext } from '../contexts/ParameterContext';
import { TemplateContext } from '../contexts/TemplateContext';
import { WorkoutContext } from '../contexts/WorkoutContext';
import { useToast } from '../contexts/ToastContext';

// Sub-components mapped to premium architecture standards inside components/ActiveWorkoutPage/
import WorkoutHeader from '../components/ActiveWorkoutPage/WorkoutHeader';
import ExerciseActiveCard from '../components/ActiveWorkoutPage/ExerciseActiveCard';
import AddExerciseModal from '../components/ActiveWorkoutPage/AddExerciseModal';
import WorkoutFooterSection from '../components/ActiveWorkoutPage/WorkoutFooterSection';
import FrontendLogger from '../utils/logger';

/**
 * ActiveWorkoutPage Component - Tracks live performance execution parameters in real-time.
 * Rewritten to consume WorkoutContext and fully support unified data streams.
 */
const ActiveWorkoutPage = () => {
  const { templateId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
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

  // Sync structural core definitions tables cache maps on mount
  useEffect(() => {
    if (exercises.length === 0) fetchExercises();
    if (parameters.length === 0) fetchParameters();
    
    const loadTemplate = async () => {
      if (templateId && !template) {
        setIsFetchingTemplate(true);
        FrontendLogger.info('ACTIVE_WORKOUT', `Hydrating template program state from network endpoint ID: ${templateId}`);
        try {
          const data = await fetchTemplateById(parseInt(templateId));
          setTemplate(data);
        } catch (err) {
          FrontendLogger.error('ACTIVE_WORKOUT', 'Failed to retrieve blueprint framework context metadata rules', err);
          showToast("Failed to load workout template", "error");
          navigate('/workouts');
        } finally {
          setIsFetchingTemplate(false);
        }
      }
    };
    loadTemplate();
  }, [templateId, template, fetchTemplateById, navigate, showToast, exercises.length, parameters.length, fetchExercises, fetchParameters]);

  /**
   * Arithmetic Engine: Processes raw metrics streams into calculated values.
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

  // Initialize tracking node cards dynamically based on active configurations
  useEffect(() => {
    if (template && parameters.length > 0 && workoutData.length === 0) {
      FrontendLogger.info('ACTIVE_WORKOUT', 'Mapping template metadata rules to generate tracking session matrices');
      const configSource = template.exercises_config || [];
      
      const initialExercises = configSource.map((ex, idx) => {
        const initialValues = {};
        const paramSource = ex.params || [];
        
        paramSource.forEach(p => {
          initialValues[p.parameter_id] = p.value;
        });

        return {
          ...ex,
          instanceId: `ex-${idx}-${Date.now()}`, 
          isDone: false,
          paramsMetadata: paramSource.map(p => {
            const meta = parameters.find(m => Number(m.id) === Number(p.parameter_id));
            return {
              ...p,
              ...meta,
              parameter_name: meta?.name || p.parameter_name || `Param ${p.parameter_id}`,
            };
          }),
          actualSets: Array.from({ length: ex.num_of_sets || 3 }, (_, i) => ({
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
   * Dispatches internal cell updates and triggers cascade math formula updates.
   */
  const updateSetValue = (exIdx, setIdx, parameterId, newValue) => {
    const newData = [...workoutData];
    const exercise = newData[exIdx];
    const set = exercise.actualSets[setIdx];

    set.values[parameterId] = newValue;

    // Recalculate linked virtual dependencies row-by-row
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
    FrontendLogger.info('ACTIVE_WORKOUT', `Appending new performance set row index to exercise card node index: ${exIdx}`);
    const newData = [...workoutData];
    const sets = newData[exIdx].actualSets;
    const lastSet = sets[sets.length - 1];
    
    sets.push({
      id: `set-new-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      setNum: sets.length + 1,
      isDone: false,
      values: lastSet ? { ...lastSet.values } : {}
    });
    setWorkoutData(newData);
  };

  const deleteSet = (exIdx, setIdx) => {
    FrontendLogger.info('ACTIVE_WORKOUT', `Dropping set card row index: ${setIdx} from exercise node index: ${exIdx}`);
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
    const currentStatus = newData[exIdx].actualSets[setIdx].isDone;
    FrontendLogger.info('ACTIVE_WORKOUT', `Toggling set tracking checkpoint cell state status parameter to: ${!currentStatus}`);
    newData[exIdx].actualSets[setIdx].isDone = !currentStatus;
    setWorkoutData(newData);
  };

  const reorderSets = (exIdx, newSets) => {
    const newData = [...workoutData];
    newData[exIdx].actualSets = newSets;
    setWorkoutData(newData);
  };

  /**
   * Injects a selected exercise dynamically from the flat pool straight into the session workspace.
   */
  const addNewExercise = (exercise) => {
    FrontendLogger.info('ACTIVE_WORKOUT', `Injecting flat registry exercise node item straight to tracker grid: '${exercise.exercise_name}'`);
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
      exercise_name: exercise.exercise_name,
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
    showToast(`${exercise.exercise_name} נוסף לאימון הנוכחי`, "success");
  };

  /**
   * Bundles compiled dataset blocks into an export tracking blueprint submission package.
   */
  const handleFinish = async () => {
    FrontendLogger.info('ACTIVE_WORKOUT', 'Assembling final live athletic session scorecard packet');
    
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
      showToast("יש לסמן לפחות סט אחד כבוצע כדי לחתום את האימון", "warning");
      return;
    }

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
      logs: flattenedMockLogs 
    };

    try {
      await saveWorkoutSession(sessionPayload);
      showToast("האימון נחתם ונשמר בהצלחה!", "success");
      navigate('/activity');
    } catch (err) {
      FrontendLogger.error('ACTIVE_WORKOUT', 'Transaction failure observed while committing workout history payload', err);
      showToast("שגיאה בשמירת נתוני האימון", "error");
    }
  };

  // Expose full flat pool directly to comply with categorical removal rules
  const availableToAdd = exercises;

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
        parentName="אימון קבוצה"
        onSave={handleFinish}
        onCancel={() => {
          if (window.confirm("בטוח שברצונך לצאת? הנתונים שהזנת באימון זה יימחקו.")) {
            navigate('/workouts');
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