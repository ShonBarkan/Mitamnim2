import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ExerciseContext } from '../contexts/ExerciseContext';
import { TemplateContext } from '../contexts/TemplateContext';
import { ParameterContext } from '../contexts/ParameterContext';
import { UserContext } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { arrayMove } from '@dnd-kit/sortable';
import { useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';

import TemplateGeneralInfo from '../components/CreateWorkoutTemplatePage/TemplateGeneralInfo';
import TemplateExerciseBank from '../components/CreateWorkoutTemplatePage/TemplateExerciseBank';
import TemplateExerciseConfig from '../components/CreateWorkoutTemplatePage/TemplateExerciseConfig';
import TemplateScheduling from '../components/CreateWorkoutTemplatePage/TemplateScheduling';
import UserSelectionGrid from '../components/CreateWorkoutTemplatePage/UserSelectionGrid';
import TemplateFooter from '../components/CreateWorkoutTemplatePage/TemplateFooter';
import FrontendLogger from '../utils/logger';

/**
 * CreateWorkoutTemplatePage - Advanced workout template architecture studio.
 * Fully optimized to handle dynamic incoming context states for seamless editing boots.
 * Enforces strict English-only code commentary and total Hebrew UI localization.
 */
const CreateWorkoutTemplatePage = ({ onSave, onCancel }) => {
  const { user: currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const { exercises, fetchExercises } = useContext(ExerciseContext);
  const { addTemplate, editTemplate } = useContext(TemplateContext);
  const { parameters, fetchParameters } = useContext(ParameterContext);
  const { users, refreshUsers } = useContext(UserContext);

  // Capture incoming state routing parameters if navigated via edit command workflows
  const editingTemplate = location.state?.template || null;

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

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } })
  );

  useEffect(() => {
    FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'Synchronizing studio workspace system dependencies');
    if (exercises.length === 0) fetchExercises();
    if (parameters.length === 0) fetchParameters();
    if (currentUser?.group_id) refreshUsers(currentUser.group_id);
  }, [exercises.length, parameters.length, currentUser, fetchExercises, fetchParameters, refreshUsers]);

  // Intercept and hydrate state variables context map dynamically if editing parameters exist
  useEffect(() => {
    if (editingTemplate) {
      FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'Hydrating workspace studio with incoming editing template payload');
      
      // FIXED: Safely targeted 'template_exercises' schema property to fix the empty edit list bug
      const remappedExercises = (editingTemplate.template_exercises || []).map(te => ({
        exercise_id: te.exercise_id,
        // FIXED: Maps from physical table column name layout 'name' to prevent empty titles
        exercise_name: te.exercise?.name || te.exercise?.exercise_name || 'תרגיל נבחר',
        num_of_sets: te.num_of_sets || 3,
        params: (te.parameter_values || []).map(pv => ({
          parameter_id: pv.parameter_id,
          parameter_name: pv.parameter?.name || 'מדד',
          parameter_unit: pv.parameter?.unit || '',
          value: pv.target_value || '0',
          is_virtual: pv.parameter?.is_virtual || false
        }))
      }));

      setFormData({
        name: editingTemplate.name || '',
        description: editingTemplate.description || '',
        expected_duration_time: String(editingTemplate.expected_duration_time || '45'),
        scheduled_hour: editingTemplate.scheduled_hour || '',
        exercises_config: remappedExercises,
        for_users: (editingTemplate.assignments || []).map(a => a.user_id),
        scheduled_days: editingTemplate.scheduled_days || []
      });
    }
  }, [editingTemplate]);

  const copyAiPrompt = () => {
    FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'Compiling dry parameter models to export contextual AI prompt rule');
    
    const dryParams = parameters
      .filter(p => !p.is_virtual)
      .map(p => `- "${p.name}" (יחידת מידה: ${p.unit || 'יחידות'})`)
      .join('\n');

    const existingExercises = exercises
      .map(e => `- ${e.name || e.exercise_name}`)
      .join('\n');

    const prompt = `אתה מאמן ספורט עילית ומדען נתונים בכיר במערכת Mitamnim2.
עליך לייצר מסמך JSON תקין עבור שבלונת אימון בהתבסס על התיאור הבא: "[הכנס תיאור אימון, מטרות או דגשים כאן]".

חוקי ארכיטקטורת נתונים קריטיים:
1. שים לב! כל שדות המלל (שם האימון, תיאור, ושמות תרגילים מותאמים) חייבים להיות בעברית בלבד!
2. השתמש אך ורק בשמות התרגילים הקיימים מהרשימה המוצגת למטה במידה ויש התאמה. אם חסר תרגיל, המצא שם נקי ומקצועי בעברית.
3. השתמש אך ורק במדדי המעקב הגולמיים המותרים המוצגים למטה. אל תשתמש במדדים מחושבים או וירטואליים (כמו נפח עבודה כולל או אינדקס עצימות) שכן השרת מריץ אותם אוטומטית.
4. הפלט חייב להיות קוד JSON נקי בלבד, ללא סימוני מרקאדאון, ללא גרשיים הפוכים (\`\`\`) וללא כותרות.

[רשימת תרגילים קיימים במערכת]
${existingExercises}

[מדדי מעקב גולמיים מותרים לשימוש]
${dryParams}

[מבנה ה-JSON הנדרש]
{
  "name": "שם תוכנית האימון (לדוגמה: פיתוח כוח מתפרץ שלב א)",
  "description": "הנחיות קצרות ודגשים מקצועיים עבור הספורטאים",
  "exercises_config": [
    {
      "exercise_name": "שם התרגיל המדויק מהרשימה למעלה או שם תרגיל חדש בעברית",
      "num_of_sets": 3,
      "params": [
        { "parameter_name": "שם המדד הגולמי מתוך הרשימה המותרת למעלה", "value": "12" }
      ]
    }
  ]
}`;

    navigator.clipboard.writeText(prompt);
    showToast("הפרומפט המנורמל הועתק! הדבק אותו ב-AI והחזר לכאן את ה-JSON שנוצר", "success");
  };

  const handleAiJsonInput = (jsonString) => {
    if (!jsonString.trim()) return;
    
    try {
      const sanitizedString = jsonString.trim().replace(/^```json|```$/g, '');
      const parsed = JSON.parse(sanitizedString);
      
      setFormData(prev => ({
        ...prev,
        ...parsed,
        exercises_config: (parsed.exercises_config || []).map(ex => {
          const matched = exercises.find(e => (e.name || e.exercise_name || '').toLowerCase() === ex.exercise_name.toLowerCase());
          return { 
            ...ex, 
            exercise_id: matched?.id || `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
            exercise_name: ex.exercise_name,
            params: (ex.params || [])
              .map(p => {
                const pMeta = parameters.find(pm => pm.name.toLowerCase() === p.parameter_name.toLowerCase());
                return {
                  ...p,
                  parameter_id: pMeta?.id || null,
                  parameter_name: pMeta?.name || p.parameter_name,
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
      showToast("פורמט JSON לא תקין או מכיל שגיאות מבניות", "error");
    }
  };

  const addExerciseToConfig = (exercise) => {
    setLoadingAvailable(true);
    let activeParamIds = (exercise.active_parameter_ids || []).map(id => Number(id));
    
    // FIXED: Auto-hydration blueprint fallback rules enforced.
    // If the selected exercise lacks critical metrics (like reps or weight) but has calculations 
    // depending on them, we dynamically push the missing dependencies to ensure the virtual values load correctly.
    parameters.forEach(p => {
      if (p.is_virtual && p.depends_on_ids) {
        const depIds = p.depends_on_ids.map(id => Number(id));
        const missingDeps = depIds.filter(id => !activeParamIds.includes(id));
        // If it shares at least one baseline metric context, hydrate the missing pair
        if (depIds.some(id => activeParamIds.includes(id)) && missingDeps.length > 0) {
          activeParamIds = [...activeParamIds, ...missingDeps];
        }
      }
    });

    const configuredParams = activeParamIds.map(pId => {
      const meta = parameters.find(m => Number(m.id) === pId);
      return {
        parameter_id: pId,
        parameter_name: meta?.name || `מדד ${pId}`,
        parameter_unit: meta?.unit || '',
        value: meta?.default_value || '0',
        is_virtual: meta?.is_virtual || false
      };
    });

    const exerciseNameResolved = exercise.name || exercise.exercise_name || 'תרגיל נבחר';

    setFormData(prev => ({
      ...prev,
      exercises_config: [...prev.exercises_config, {
        exercise_id: exercise.id, 
        exercise_name: exerciseNameResolved,
        num_of_sets: 3,
        params: configuredParams
      }]
    }));
    
    setLoadingAvailable(false);
    showToast(`${exerciseNameResolved} נוסף למבנה האימונים`, "success");
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
      showToast("יש להוסיף לפחות תרגיל אחד למבנה האימונים", "error");
      return;
    }

    setLoadingAvailable(true);
    try {
      const trainees = users.filter(u => u.role === 'trainee');
      const finalUsersList = formData.for_users.length > 0 ? formData.for_users : trainees.map(u => u.id);

      const payload = {
        name: formData.name,
        description: formData.description,
        expected_duration_time: String(formData.expected_duration_time || "45"),
        scheduled_hour: formData.scheduled_hour || null,
        scheduled_days: formData.scheduled_days || [],
        for_users: finalUsersList,
        exercises: formData.exercises_config.map(ex => {
          const isCustom = String(ex.exercise_id).startsWith('custom-');
          return {
            exercise_id: isCustom ? null : Number(ex.exercise_id),
            exercise_name: isCustom ? ex.exercise_name : null,
            num_of_sets: parseInt(ex.num_of_sets) || 3,
            params: ex.params.filter(p => !p.is_virtual).map(p => ({
              parameter_id: Number(p.parameter_id),
              target_value: String(p.value || "0")
            }))
          };
        })
      };

      if (editingTemplate?.id) {
        await editTemplate(editingTemplate.id, payload);
        showToast("התוכנית עודכנה בהצלחה במערכת", "success");
      } else {
        await addTemplate(payload);
        showToast("תוכנית אימון חדשה נשמרה ואושררה בהצלחה", "success");
      }
      
      if (onSave) onSave();
      navigate('/workouts');
    } catch (err) {
      showToast("שגיאה בתהליך שמירת הנתונים והתרגילים החדשים", "error");
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleCancelAction = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/workouts');
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8 font-sans" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* --- כותרת דף ופקודות עבודה --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/60 shadow-xl">
          <div className="space-y-1.5 select-none">
            <h1 className="text-4xl font-black tracking-tighter text-zinc-900 uppercase">
              {editingTemplate ? 'עריכת תוכנית אימון' : 'בניית תוכנית אימון'}
            </h1>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">סטודיו ארכיטקטורת אימון</p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full sm:w-auto">
            <button 
              type="button"
              onClick={copyAiPrompt}
              className="flex-1 sm:flex-none px-6 py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-zinc-900/10 transition-all active:scale-95 hover:bg-zinc-800"
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

        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="bg-white/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/60 shadow-xl">
            <TemplateGeneralInfo 
              formData={formData} 
              setFormData={setFormData} 
            />
          </div>

          <section className="bg-white/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/60 shadow-xl space-y-8">
            <div className="space-y-1 mr-2 select-none">
              <h3 className="text-2xl font-black tracking-tight text-zinc-900 uppercase flex items-center gap-3">
                <span className="w-8 h-8 bg-zinc-900 text-white rounded-xl flex items-center justify-center text-xs font-black">1</span>
                מבנה והרכב האימון
              </h3>
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">הגדרת סדר תרגילים, סטים ומדדי מעקב</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <section className="bg-white/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/60 shadow-xl space-y-6">
                <h3 className="text-2xl font-black tracking-tight text-zinc-900 uppercase flex items-center gap-3 mr-2 select-none">
                  <span className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xs font-black shadow-sm">2</span>
                  תזמון ומשך האימון
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

             <section className="bg-white/40 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/60 shadow-xl space-y-6">
                <div className="flex justify-between items-center px-2 select-none">
                  <h3 className="text-2xl font-black tracking-tight text-zinc-900 uppercase flex items-center gap-3">
                    <span className="w-8 h-8 bg-emerald-500 text-white rounded-xl flex items-center justify-center text-xs font-black shadow-sm">3</span>
                    שיוך למתאמנים
                  </h3>
                  <span className="text-[9px] font-black text-zinc-400 bg-white/60 px-3 py-1 rounded-lg border border-white uppercase tracking-widest shadow-sm">
                    {formData.for_users.length === 0 ? 'כל המתאמנים (ברירת מחדל)' : `${formData.for_users.length} נבחרו`}
                  </span>
                </div>
                <UserSelectionGrid 
                  selectedUserIds={formData.for_users}
                  onChange={(usersList) => setFormData({...formData, for_users: usersList})}
                />
             </section>
          </div>

          <TemplateFooter onCancel={handleCancelAction} />
        </form>

        {isAiModalOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-400">
            <div className="absolute inset-0" onClick={() => setIsAiModalOpen(false)} />
            <div className="relative w-full max-w-xl bg-white/40 backdrop-blur-3xl p-10 rounded-[3rem] shadow-2xl border border-white/60 animate-in zoom-in-95 duration-500 space-y-6">
              <header className="space-y-1 mr-2 select-none">
                <h3 className="text-3xl font-black tracking-tighter text-zinc-900 uppercase">ייבוא נתונים מ-AI</h3>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">הזנת מבנה ה-JSON שנוצר</p>
              </header>
              
              <textarea 
                className="w-full h-64 bg-white/60 border border-white rounded-2xl p-6 font-mono text-xs text-zinc-800 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all shadow-inner resize-none placeholder:text-zinc-300"
                placeholder='{ "name": "אימון היפרטרופיה א", "exercises_config": [...] }'
                onBlur={(e) => handleAiJsonInput(e.target.value)}
              />
              
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="w-full py-5 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-zinc-900/10 transition-all active:scale-[0.98] hover:bg-zinc-800"
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