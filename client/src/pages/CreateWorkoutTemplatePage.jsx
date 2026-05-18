import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExerciseContext } from '../contexts/ExerciseContext';
import { TemplateContext } from '../contexts/TemplateContext';
import { ParameterContext } from '../contexts/ParameterContext';
import { UserContext } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { arrayMove } from '@dnd-kit/sortable';
import { useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';

// Sub-components mapped from the flat component registry folder path
import TemplateGeneralInfo from '../components/CreateWorkoutTemplatePage/TemplateGeneralInfo';
import TemplateExerciseBank from '../components/CreateWorkoutTemplatePage/TemplateExerciseBank';
import TemplateExerciseConfig from '../components/CreateWorkoutTemplatePage/TemplateExerciseConfig';
import TemplateScheduling from '../components/CreateWorkoutTemplatePage/TemplateScheduling';
import UserSelectionGrid from '../components/CreateWorkoutTemplatePage/UserSelectionGrid';
import TemplateFooter from '../components/CreateWorkoutTemplatePage/TemplateFooter';
import FrontendLogger from '../utils/logger';

/**
 * CreateWorkoutTemplatePage Component - Advanced workout template architecture studio.
 * Refactored: Completely flat structure without obsolete tree categorizations.
 * Intercepts temporary inline custom exercises and saves them to the global registry pool 
 * atomically ONLY when the final template document form is submitted successfully.
 */
const CreateWorkoutTemplatePage = ({ initialData = null, onSave, onCancel }) => {
  const { user: currentUser } = useAuth();
  const { exercises, fetchExercises, addExercise } = useContext(ExerciseContext);
  const { addTemplate, editTemplate } = useContext(TemplateContext);
  const { parameters, fetchParameters } = useContext(ParameterContext);
  const { users, refreshUsers } = useContext(UserContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    expected_duration_time: '45',
    scheduled_hour: '',
    exercises_config: [],
    for_users: [], 
    scheduled_days: []
  });

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  // Advanced cursor tracking parameters constraint metrics
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  // Synchronize state contexts tables cache maps on mount
  useEffect(() => {
    FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'Synchronizing studio workspace system dependencies');
    if (exercises.length === 0) fetchExercises();
    if (parameters.length === 0) fetchParameters();
    if (currentUser?.group_id) refreshUsers(currentUser.group_id);
  }, [exercises.length, parameters.length, currentUser, fetchExercises, fetchParameters, refreshUsers]);

  // Handle runtime hot payload injections on component edit boots
  useEffect(() => {
    if (initialData) {
      FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'Hydrating workspace form with incoming editing blueprint record', initialData);
      setFormData(initialData);
    }
  }, [initialData]);

  /**
   * AI Prompt Generator Logic:
   * Maps out unique parameters attributes list definitions to direct external LLM models.
   * Strictly filters out virtual/calculated parameters to enforce dry parameter usage only.
   */
  const copyAiPrompt = () => {
    FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'Compiling dry parameter models to export contextual AI prompt rule');
    
    const dryParams = parameters
      .filter(p => !p.is_virtual)
      .map(p => `- "${p.name}" (Unit: ${p.unit || 'units'})`)
      .join('\n');

    const existingExercises = exercises
      .map(e => `- ${e.exercise_name}`)
      .join('\n');

    const prompt = `You are an elite athletic coach and data scientist inside the Mitamnim2 ecosystem.
Generate a valid JSON workout template document based on this narrative: "[INSERT WORKOUT DESCRIPTION OR ROUTINE TARGETS HERE]".

CRITICAL DATA ARCHITECTURE RULES:
1. Use ONLY the existing flat exercise names from the registry provided below where applicable. You may invent new clean string values if a custom exercise is strictly missing.
2. Use ONLY the allowed system raw measurement parameter names provided below. DO NOT use virtual, calculated, combo, or ratio metrics (such as Volume, Intensity Index, or calculated totals) as those are processed automatically by the server pipeline.
3. Output strictly valid raw JSON without any markdown formatting tags, headers, or backticks.

[SQUAD FLAT EXERCISE REGISTRY REFERENCE]
${existingExercises}

[ALLOWED TRACKING MEASUREMENT METRICS REFERENCE - DRY / RAW ONLY]
${dryParams}

[EXPECTED JSON TARGET DOCUMENT SCHEMA LAYER]
{
  "name": "Target Session Name (e.g., Reactive Power Phase A)",
  "description": "Short instructional narrative summary for the athletes",
  "exercises_config": [
    {
      "exercise_name": "Exact Name found in registry match or new custom string",
      "num_of_sets": 3,
      "params": [
        { "parameter_name": "Matched parameter name string from raw list above", "value": "12" }
      ]
    }
  ]
}`;

    navigator.clipboard.writeText(prompt);
    showToast("הפרומפט המנורמל הועתק! הדבק אותו ב-AI והחזר לכאן את ה-JSON שנוצר", "success");
  };

  /**
   * Translates incoming AI raw JSON objects map into localized client template arrays state.
   * Explicitly strips out calculated metrics to protect data normalization schemas.
   */
  const handleAiJsonInput = (jsonString) => {
    if (!jsonString.trim()) return;
    FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'Parsing injected AI JSON structural string token payload');
    
    try {
      const sanitizedString = jsonString.trim().replace(/^```json|```$/g, '');
      const parsed = JSON.parse(sanitizedString);
      
      setFormData(prev => ({
        ...prev,
        ...parsed,
        exercises_config: (parsed.exercises_config || []).map(ex => {
          const matched = exercises.find(e => e.exercise_name.toLowerCase() === ex.exercise_name.toLowerCase());
          
          return { 
            ...ex, 
            exercise_id: matched?.id || `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
            params: (ex.params || [])
              .map(p => {
                const pMeta = parameters.find(pm => pm.name.toLowerCase() === p.parameter_name.toLowerCase());
                return {
                  ...p,
                  parameter_id: pMeta?.id || null,
                  parameter_unit: pMeta?.unit || '',
                  is_virtual: pMeta?.is_virtual || false
                };
              })
              .filter(p => !p.is_virtual)
          };
        })
      }));
      
      setIsAiModalOpen(false);
      showToast("הנתונים הוזנו בהצלחה - ניתן לבצע התאמות ועריכה לפני שמירה", "success");
    } catch (e) {
      FrontendLogger.error('CREATE_TEMPLATE_PAGE', 'Structural anomaly detected while parsing AI JSON payload input', e);
      showToast("פורמט JSON לא תקין או מכיל שגיאות מבניות", "error");
    }
  };

  /**
   * Appends selected exercise configuration tracks into form workspace states cache.
   */
  const addExerciseToConfig = (exercise) => {
    setLoadingAvailable(true);
    FrontendLogger.info('CREATE_TEMPLATE_PAGE', `Appending exercise asset token into template form bounds: '${exercise.name}'`);
    
    let configuredParams = [];
    const activeParamIds = exercise.active_parameter_ids || [];
    
    configuredParams = activeParamIds.map(pId => {
      const meta = parameters.find(m => Number(m.id) === Number(pId));
      return {
        parameter_id: pId,
        parameter_name: meta?.name || `Param ${pId}`,
        parameter_unit: meta?.unit || '',
        value: meta?.default_value || '0',
        is_virtual: meta?.is_virtual || false
      };
    }).filter(p => !p.is_virtual);

    const newExerciseEntry = {
      exercise_id: exercise.id, 
      exercise_name: exercise.name,
      num_of_sets: 3,
      params: configuredParams
    };

    setFormData(prev => ({
      ...prev,
      exercises_config: [...prev.exercises_config, newExerciseEntry]
    }));
    
    setLoadingAvailable(false);
    showToast(`${exercise.name} נוסף למבנה האימונים`, "success");
  };

  /**
   * Sort ordering list coordinator handler.
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
   * Compiles data payload metrics and processes execution saves.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'Triggered structural program blueprint submission chain');

    if (formData.exercises_config.length === 0) {
      showToast("יש להוסיף לפחות תרגיל אחד למבנה האימונים", "error");
      return;
    }

    setLoadingAvailable(true);
    try {
      // 🚀 STEP 1: Process and persist custom inline exercises dynamically before completing template actions
      const resolvedExercisesConfig = await Promise.all(
        formData.exercises_config.map(async (ex) => {
          if (String(ex.exercise_id).startsWith('custom-')) {
            FrontendLogger.info('CREATE_TEMPLATE_PAGE', `Inline custom exercise match identified. Persisting target record row: '${ex.exercise_name}'`);
            const creationPayload = {
              exercise_name: ex.exercise_name,
              active_parameter_ids: ex.params.map(p => Number(p.parameter_id)),
            };
            
            const createdRegistryItem = await addExercise(creationPayload);
            return {
              ...ex,
              exercise_id: createdRegistryItem.id
            };
          }
          return ex;
        })
      );

      const trainees = users.filter(u => u.role === 'trainee');
      const finalUsersList = formData.for_users.length > 0 
        ? formData.for_users 
        : trainees.map(u => u.id);

      // 🚀 STEP 2: Structure final payload layout maps document
      const payload = {
        name: formData.name,
        description: formData.description,
        expected_duration_time: parseInt(formData.expected_duration_time) || 45,
        scheduled_hour: formData.scheduled_hour || null,
        scheduled_days: formData.scheduled_days || [],
        for_users: finalUsersList,
        exercises_config: resolvedExercisesConfig.map(ex => ({
          exercise_id: ex.exercise_id,
          num_of_sets: parseInt(ex.num_of_sets) || 3,
          params: ex.params.map(p => ({
            parameter_id: p.parameter_id,
            value: String(p.value || "0")
          }))
        }))
      };

      // 🚀 STEP 3: Complete target workflow transaction execution over networks
      if (initialData?.id) {
        await editTemplate(initialData.id, payload);
        showToast("התוכנית עודכנה בהצלחה במערכת", "success");
      } else {
        await addTemplate(payload);
        showToast("תוכנית אימון חדשה נשמרה ואושררה בהצלחה", "success");
      }
      
      if (onSave) onSave();
      navigate('/workouts');
    } catch (err) {
      FrontendLogger.error('CREATE_TEMPLATE_PAGE', 'Operational exception caught while saving template framework boundaries', err);
      showToast("שגיאה בתהליך שמירת הנתונים והתרגילים החדשים", "error");
    } finally {
      setLoadingAvailable(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8 font-sans" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* --- DYNAMIC HEADER & INTELLIGENT COACH ACTION CODES --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/60 shadow-xl">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase">
              {initialData ? 'עריכת תתוכנית אימון' : 'בניית תוכנית אימון'}
            </h1>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Workout Architecture Studio</p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <button 
              type="button"
              onClick={copyAiPrompt}
              className="flex-1 sm:flex-none px-6 py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-zinc-900/10 transition-all active:scale-95 hover:bg-zinc-800"
            >
              🪄 העתק פרומפט ל-AI
            </button>
            <button 
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="flex-1 sm:flex-none px-6 py-4 bg-white/60 text-zinc-900 rounded-2xl font-black text-xs uppercase tracking-wider border border-white/80 transition-all active:scale-95 shadow-sm hover:bg-white"
            >
              📥 הדבק JSON מ-AI
            </button>
          </div>
        </header>

        {/* --- MAIN ARCHITECTURE DESIGN FORM SETUP --- */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section: General Meta Specifications Card */}
          <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/60 shadow-xl">
            <TemplateGeneralInfo 
              formData={formData} 
              setFormData={setFormData} 
            />
          </div>

          {/* Section: Interactive Exercise Track Customizer */}
          <section className="bg-white/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/60 shadow-xl space-y-8">
            <div className="space-y-1 mr-2">
              <h3 className="text-2xl font-black tracking-tight text-zinc-900 uppercase flex items-center gap-3">
                <span className="w-8 h-8 bg-zinc-900 text-white rounded-xl flex items-center justify-center text-xs font-black">1</span>
                מבנה והרכב האימון
              </h3>
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Configure Track Progression & Sets</p>
            </div>
            
            <TemplateExerciseBank 
              loading={loadingAvailable}
              availableExercises={exercises} 
              onAdd={addExerciseToConfig} 
            />

            <TemplateExerciseConfig 
              exercisesConfig={formData.exercises_config} 
              sensors={sensors}
              updateSets={(idx, val) => {
                const newConfig = [...formData.exercises_config];
                newConfig[idx].num_of_sets = val;
                setFormData({...formData, exercises_config: newConfig});
              }}
              onUpdateExerciseParams={(idx, params) => {
                const newConfig = [...formData.exercises_config];
                newConfig[idx].params = params;
                setFormData({...formData, exercises_config: newConfig});
              }}
              removeExercise={(idx) => {
                setFormData({
                  ...formData,
                  exercises_config: formData.exercises_config.filter((_, i) => i !== idx)
                });
              }}
              handleDragEnd={handleDragEnd}
            />
          </section>

          {/* Dual Column Assignment & Timing Sub-grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             
             {/* Component Box: Scheduling Specifications */}
             <section className="bg-white/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/60 shadow-xl space-y-6">
                <h3 className="text-2xl font-black tracking-tight text-zinc-900 uppercase flex items-center gap-3 mr-2">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xs font-black shadow-sm">2</span>
                  תזמון ומשך הזמן
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

             {/* Component Box: Trainee Distribution Vectors */}
             <section className="bg-white/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/60 shadow-xl space-y-6">
                <div className="flex justify-between items-center px-2">
                  <h3 className="text-2xl font-black tracking-tight text-zinc-900 uppercase flex items-center gap-3">
                    <span className="w-8 h-8 bg-emerald-500 text-white rounded-xl flex items-center justify-center text-xs font-black shadow-sm">3</span>
                    שיוך למתאמנים
                  </h3>
                  <span className="text-[9px] font-black text-zinc-400 bg-white/60 px-3 py-1 rounded-lg border border-white uppercase tracking-widest shadow-sm">
                    {formData.for_users.length === 0 ? 'כולם (דיפולט)' : `${formData.for_users.length} נבחרו`}
                  </span>
                </div>
                <UserSelectionGrid 
                  selectedUserIds={formData.for_users}
                  onChange={(usersList) => setFormData({...formData, for_users: usersList})}
                />
             </section>
          </div>

          {/* Action Submission Footer Control Layer */}
          <TemplateFooter onCancel={onCancel} />
        </form>

        {/* --- MODAL DIALOG: AI TEXT INJECTOR PORTAL --- */}
        {isAiModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-400">
            <div className="absolute inset-0" onClick={() => setIsAiModalOpen(false)} />
            <div className="relative w-full max-w-xl bg-white/40 backdrop-blur-3xl p-10 rounded-[3rem] shadow-2xl border border-white/60 animate-in zoom-in-95 duration-500 space-y-6">
              <header className="space-y-1 mr-2">
                <h3 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">ייבוא נתונים מ-AI</h3>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Feed Generated JSON Node Structures</p>
              </header>
              
              <textarea 
                className="w-full h-64 bg-white/60 border border-white rounded-2xl p-6 font-mono text-xs text-zinc-800 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all shadow-inner resize-none placeholder:text-zinc-300"
                placeholder='{ "name": "Hypertrophy A", "exercises_config": [...] }'
                onBlur={(e) => handleAiJsonInput(e.target.value)}
              />
              
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-zinc-900/10 transition-all active:scale-[0.98] hover:bg-zinc-800"
                >
                  סגור חלון
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateWorkoutTemplatePage;