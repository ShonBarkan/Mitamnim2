import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ExerciseContext } from '../contexts/ExerciseContext';
import { TemplateContext } from '../contexts/TemplateContext';
import { ParameterContext } from '../contexts/ParameterContext';
import { UserContext } from '../contexts/UserContext';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { arrayMove } from '@dnd-kit/sortable';
import { useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';

// Sub-components re-mapped to support flat category parameters
import TemplateGeneralInfo from '../components/Templates/CreateWorkoutTemplatePage/TemplateGeneralInfo';
import TemplateExerciseBank from '../components/Templates/CreateWorkoutTemplatePage/TemplateExerciseBank';
import TemplateExerciseConfig from '../components/Templates/CreateWorkoutTemplatePage/TemplateExerciseConfig';
import TemplateFooter from '../components/Templates/CreateWorkoutTemplatePage/TemplateFooter';
import UserSelectionGrid from '../components/Templates/CreateWorkoutTemplatePage/UserSelectionGrid';
import TemplateScheduling from '../components/Templates/CreateWorkoutTemplatePage/TemplateScheduling';

/**
 * CreateWorkoutTemplatePage Component - Advanced workout template architecture studio.
 * Refactored to drop hierarchical trees in favor of a performant Flat Registry model.
 * Implements high-end Arctic Mirror glassmorphic panels and English code commentary.
 */
const CreateWorkoutTemplatePage = ({ initialData = null, onSave, onCancel }) => {
  const { user: currentUser } = useAuth();
  const { exercises, fetchExercises } = useContext(ExerciseContext);
  const { addTemplate, editTemplate } = useContext(TemplateContext);
  const { parameters, fetchParameters } = useContext(ParameterContext);
  const { users, refreshUsers } = useContext(UserContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '', 
    expected_duration_time: '45',
    scheduled_hour: '',
    exercises_config: [],
    for_users: [], 
    scheduled_days: []
  });

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false); // Fixed: Re-declared missing state configuration

  // Initialize advanced cursor sensors with constraints to avoid conflicts during scroll actions
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  // Sync state data caches on mount layer
  useEffect(() => {
    if (exercises.length === 0) fetchExercises();
    if (parameters.length === 0) fetchParameters();
    if (currentUser?.group_id) refreshUsers(currentUser.group_id);
  }, [exercises.length, parameters.length, currentUser, fetchExercises, fetchParameters, refreshUsers]);

  // Hook up incoming edit payload targets smoothly if passed down by router historical states
  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  /**
   * Flat Registry Processing Memo: Extracts unique category tag tokens 
   * directly from the flat collection pool, eliminating tree recursion errors.
   */
  const availableCategories = useMemo(() => {
    if (!exercises || exercises.length === 0) return [];
    const tags = exercises.map(ex => ex.category || 'General');
    return [...new Set(tags)];
  }, [exercises]);

  /**
   * Performance Filter Memo: Resolves exercises assigned to the current active 
   * category synchronously out of cached client states, omitting backend trips.
   */
  const filteredAvailableExercises = useMemo(() => {
    if (!formData.category) return [];
    return exercises.filter(ex => ex.category === formData.category);
  }, [formData.category, exercises]);

  /**
   * AI Prompt Generator Logic:
   * Isolates raw parameters from calculated virtual metrics to build strict LLM JSON constraints.
   */
  const copyAiPrompt = () => {
    const rawParams = parameters
      .filter(p => !p.is_virtual)
      .map(p => `${p.name} (${p.unit || 'units'})`)
      .join(', ');

    const prompt = `You are an elite athletic coach. Generate a JSON workout template document based on this narrative: "[INSERT WORKOUT DESCRIPTION HERE]".
    Available strict parameter tags to associate for metric logging entries: [${rawParams}].
    Return ONLY a stringified valid JSON object containing no markdown wrapping following this exact structure:
    {
      "name": "Target Session Name",
      "description": "Short instructional narrative summary",
      "exercises_config": [
        {
          "exercise_name": "Exact Name found in registry match",
          "num_of_sets": 3,
          "params": [{ "parameter_name": "Matched parameter name string from list", "value": "12" }]
        }
      ]
    }`;

    navigator.clipboard.writeText(prompt);
    showToast("הפרומפט הועתק! הדבק אותו ב-AI והחזר לכאן את ה-JSON שנוצר", "success");
  };

  /**
   * Applies validated AI engine text outputs directly into the component state.
   */
  const handleAiJsonInput = (jsonString) => {
    if (!jsonString.trim()) return;
    try {
      const parsed = JSON.parse(jsonString);
      setFormData(prev => ({
        ...prev,
        ...parsed,
        exercises_config: (parsed.exercises_config || []).map(ex => {
          const matched = exercises.find(e => e.name.toLowerCase() === ex.exercise_name.toLowerCase());
          return { 
            ...ex, 
            exercise_id: matched?.id || null,
            params: (ex.params || []).map(p => {
              const pMeta = parameters.find(pm => pm.name.toLowerCase() === p.parameter_name.toLowerCase());
              return {
                ...p,
                parameter_id: pMeta?.id || null,
                parameter_unit: pMeta?.unit || ''
              };
            })
          };
        })
      }));
      setIsAiModalOpen(false);
      showToast("הנתונים הוזנו בהצלחה - ניתן לערוך לפני שמירה", "success");
    } catch (e) {
      showToast("פורמט JSON לא תקין", "error");
    }
  };

  /**
   * Injects an exercise from the structural registry library bank synchronously.
   * Maps active non-calculated properties directly from the configuration cache.
   */
  const addExerciseToConfig = (exercise) => {
    setLoadingAvailable(true);
    const activeParamIds = exercise.active_parameter_ids || [];
    
    const configuredParams = activeParamIds.map(pId => {
      const meta = parameters.find(m => Number(m.id) === Number(pId));
      return {
        parameter_id: pId,
        parameter_name: meta?.name || `Param ${pId}`,
        parameter_unit: meta?.unit || '',
        value: meta?.default_value || '0'
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
    showToast(`${exercise.name} נוסף לשבלונה`, "success");
  };

  /**
   * Drag-and-Drop Sort Handler: Manages template configuration lists order layout.
   */
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setFormData(prev => {
        const oldIndex = prev.exercises_config.findIndex((_, i) => i === active.id);
        const newIndex = prev.exercises_config.findIndex((_, i) => i === over.id);
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
   * Compiles the form states payload context and fires persist commands down to handlers.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.exercises_config.length === 0) {
      showToast("יש להוסיף לפחות תרגיל אחד למבנה האימונים", "error");
      return;
    }

    const trainees = users.filter(u => u.role === 'trainee');
    const finalUsersList = formData.for_users.length > 0 
      ? formData.for_users 
      : trainees.map(u => u.id);

    const payload = {
      ...formData,
      for_users: finalUsersList,
      exercises_config: formData.exercises_config.map(ex => ({
        exercise_id: ex.exercise_id,
        num_of_sets: ex.num_of_sets,
        params: ex.params.map(p => ({
          parameter_id: p.parameter_id,
          value: String(p.value || "0")
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
      navigate('/workout-templates');
    } catch (err) {
      showToast("שגיאה בתהליך שמירת הנתונים", "error");
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8 font-sans" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* --- DYNAMIC HEADER & INTELLIGENT COACH ACTION CODES --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/60 shadow-xl">
          <div className="space-y-1.5">
            <h1 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase">יצירת שבלונת אימון</h1>
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
              categoryOptions={availableCategories} 
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
              parentId={formData.category} 
              loading={loadingAvailable}
              availableExercises={filteredAvailableExercises} 
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             
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
                  <span className="text-[9px] font-black text-zinc-400 bg-white/60 px-3 py-1 rounded-lg border border-white border-spacing-1 uppercase tracking-widest shadow-sm">
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
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-500">
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
                  סגור ועדכן
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