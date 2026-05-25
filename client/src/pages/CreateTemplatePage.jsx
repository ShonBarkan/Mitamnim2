import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useTemplate } from '../contexts/TemplateContext';
import { useExercise } from '../contexts/ExerciseContext';
import { useUsers } from '../contexts/UserContext';
import { useTag } from '../contexts/TagContext';
import FrontendLogger from '../utils/logger';
import TagDisplay from '../components/common/tags/TagDisplay';

// -----------------------------------------------------------------------------
// INTERNAL COMPONENT: Sortable Exercise Item
// -----------------------------------------------------------------------------
const SortableExerciseItem = ({ exercise, onUpdateParam, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: exercise.position.toString() });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div {...attributes} {...listeners} className="flex items-center gap-3 cursor-grab active:cursor-grabbing">
          <span className="text-zinc-300 font-black text-lg">⠿</span>
          <span className="font-black text-sm text-zinc-900">{exercise.name}</span>
        </div>
        <button type="button" onClick={() => onRemove(exercise.position)} className="text-red-500 text-[10px] font-bold uppercase hover:underline">
          מחק
        </button>
      </div>

      {Array.isArray(exercise.parameters) && exercise.parameters.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-zinc-100 pt-3">
          {exercise.parameters.map((param, idx) => {
            // Safely resolve the parameter ID
            const paramId = param.parameter_id || param.id;
            return (
              <div key={`${paramId}-${idx}`} className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">{param.name || 'ערך'} {param.unit ? `(${param.unit})` : ''}</span>
                <input 
                  type="number"
                  className={`p-2 rounded-lg border text-xs font-bold w-full outline-none transition-colors ${param.is_virtual ? 'bg-zinc-100 border-zinc-200 text-zinc-500 cursor-not-allowed' : 'bg-zinc-50 border-zinc-300 focus:border-zinc-900'}`}
                  value={param.default_value || 0}
                  onChange={(e) => onUpdateParam(exercise.position, paramId, parseFloat(e.target.value) || 0)}
                  readOnly={param.is_virtual}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// MAIN PAGE COMPONENT
// -----------------------------------------------------------------------------
const CreateTemplatePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('id');
  
  const { createTemplate, templates, fetchTemplates } = useTemplate();
  const { exercises, fetchExercises } = useExercise();
  const { users, refreshUsers } = useUsers();
  const { tags, getTagById, fetchTags } = useTag();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimated_duration: 30,
    exercises: [],
    assigned_user_ids: [],
    tag_ids: []
  });

  const [tagSearch, setTagSearch] = useState('');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiJsonInput, setAiJsonInput] = useState('');
  
  const [initializedUsers, setInitializedUsers] = useState(false);
  const isInitialMount = useRef(true);

  // Safely hydrate context data only once on mount to prevent infinite loops
  useEffect(() => {
    if (isInitialMount.current) {
      FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'Executing initial data hydration sequence');
      refreshUsers();
      fetchTags();
      fetchExercises();
      fetchTemplates();
      isInitialMount.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Edit Mode or New Template Default Users
  useEffect(() => {
    if (templateId) {
      if (templates.length > 0 && !initializedUsers) {
        FrontendLogger.info('CREATE_TEMPLATE_PAGE', `Loading existing template data for ID: ${templateId}`);
        const existingTemplate = templates.find(t => t.id === templateId);
        if (existingTemplate) {
          // Normalize existing template parameters safely
          const normalizedExercises = Array.isArray(existingTemplate.exercises) 
            ? existingTemplate.exercises.map(ex => ({
                 ...ex,
                 parameters: Array.isArray(ex.parameters) ? ex.parameters.map(p => ({ ...p, parameter_id: p.parameter_id || p.id })) : []
              }))
            : [];
            
          // Extract just the IDs from the enriched tags array provided by the server
          const mappedTagIds = Array.isArray(existingTemplate.tags) 
            ? existingTemplate.tags.map(tag => tag.id) 
            : (existingTemplate.tag_ids || []);

          setFormData({ 
            ...existingTemplate, 
            exercises: normalizedExercises,
            // Fallbacks in case the server returned null for these arrays
            assigned_user_ids: existingTemplate.assigned_user_ids || [],
            tag_ids: mappedTagIds // Use the extracted IDs here
          });
          setInitializedUsers(true);
        }
      }
    } else {
      // New template mode: Assign all users by default once users are loaded
      if (users.length > 0 && !initializedUsers) {
        FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'Initializing new template with all users assigned by default');
        setFormData(prev => ({ ...prev, assigned_user_ids: users.map(u => u.id) }));
        setInitializedUsers(true);
      }
    }
  }, [templateId, templates, users, initializedUsers]);

  // Memoized Filters
  const filteredTags = useMemo(() => 
    tags?.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase())) || [], 
    [tags, tagSearch]
  );

  const filteredExercises = useMemo(() => {
    if (!exerciseSearch.trim()) return exercises || [];
    const term = exerciseSearch.toLowerCase();
    
    return exercises?.filter(ex => {
      const nameMatch = ex.name.toLowerCase().includes(term);
      const tagMatch = Array.isArray(ex.tag_ids) && ex.tag_ids.some(tagId => {
        const tagObj = getTagById(tagId);
        return tagObj && tagObj.name.toLowerCase().includes(term);
      });
      return nameMatch || tagMatch;
    }) || [];
  }, [exercises, exerciseSearch, getTagById]);

  // Helper: Recalculate virtual parameters dynamically
  const recalculateVirtualParams = (exercisesArray) => {
    FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'Recalculating virtual parameters');
    return exercisesArray.map(ex => {
      const updatedParams = Array.isArray(ex.parameters) ? ex.parameters.map(p => {
        if (p.is_virtual) {
          let calcValue = 0;
          const sourceVals = (p.source_parameter_ids || []).map(sId => {
            const sourceParam = ex.parameters.find(src => (src.parameter_id || src.id) === sId);
            return sourceParam ? (sourceParam.default_value || 0) : 0;
          });

          if (p.calculation_type === 'multiply') {
            calcValue = sourceVals.reduce((a, b) => a * b, 1);
          } else if (p.calculation_type === 'sum') {
            calcValue = sourceVals.reduce((a, b) => a + b, 0);
          } else if (p.calculation_type === 'conversion' && sourceVals.length > 0) {
            calcValue = sourceVals[0];
          }

          return { ...p, default_value: calcValue * (p.multiplier || 1) };
        }
        return p;
      }) : [];
      return { ...ex, parameters: updatedParams };
    });
  };

  // Handlers
  const handleTagToggle = (tagId) => {
    FrontendLogger.info('CREATE_TEMPLATE_PAGE', `Toggling tag ID: ${tagId}`);
    setFormData(prev => {
      const currentTags = Array.isArray(prev.tag_ids) ? prev.tag_ids : [];
      return {
        ...prev,
        tag_ids: currentTags.includes(tagId)
          ? currentTags.filter(id => id !== tagId)
          : [...currentTags, tagId]
      };
    });
  };

  const handleAddExercise = (ex) => {
    FrontendLogger.info('CREATE_TEMPLATE_PAGE', `Adding exercise to template: ${ex.name} (ID: ${ex.id})`);
    setFormData(prev => {
      const currentExercises = Array.isArray(prev.exercises) ? prev.exercises : [];
      const newExercises = [...currentExercises, {
        exercise_id: ex.id,
        name: ex.name,
        position: currentExercises.length,
        sets: 3,
        // Normalize parameter_id immediately upon adding
        parameters: Array.isArray(ex.parameters) ? ex.parameters.map(p => ({ ...p, parameter_id: p.parameter_id || p.id })) : [] 
      }];
      return { ...prev, exercises: recalculateVirtualParams(newExercises) };
    });
  };

  const handleRemoveExercise = (position) => {
    FrontendLogger.info('CREATE_TEMPLATE_PAGE', `Removing exercise at position: ${position}`);
    setFormData(prev => {
      const currentExercises = Array.isArray(prev.exercises) ? prev.exercises : [];
      const filtered = currentExercises.filter(ex => ex.position !== position);
      const reindexed = filtered.map((ex, idx) => ({ ...ex, position: idx }));
      return { ...prev, exercises: reindexed };
    });
  };

  const handleUpdateParam = (position, paramId, value) => {
    FrontendLogger.info('CREATE_TEMPLATE_PAGE', `Updating param ID ${paramId} at position ${position} to value ${value}`);
    setFormData(prev => {
      const currentExercises = Array.isArray(prev.exercises) ? prev.exercises : [];
      const updatedExercises = currentExercises.map(ex => {
        if (ex.position === position) {
          const newParams = Array.isArray(ex.parameters) ? ex.parameters.map(p => 
            (p.parameter_id || p.id) === paramId ? { ...p, default_value: value } : p
          ) : [];
          return { ...ex, parameters: newParams };
        }
        return ex;
      });
      return { ...prev, exercises: recalculateVirtualParams(updatedExercises) };
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      FrontendLogger.info('CREATE_TEMPLATE_PAGE', `Reordering exercise from position ${active.id} to ${over.id}`);
      setFormData(prev => {
        const currentExercises = Array.isArray(prev.exercises) ? prev.exercises : [];
        const oldIndex = currentExercises.findIndex(i => i.position.toString() === active.id);
        const newIndex = currentExercises.findIndex(i => i.position.toString() === over.id);
        const reordered = arrayMove(currentExercises, oldIndex, newIndex);
        return { ...prev, exercises: reordered.map((item, idx) => ({ ...item, position: idx })) };
      });
    }
  };

  const toggleUserSelection = (userId) => {
    setFormData(prev => {
      const currentUsers = Array.isArray(prev.assigned_user_ids) ? prev.assigned_user_ids : [];
      return {
        ...prev,
        assigned_user_ids: currentUsers.includes(userId)
          ? currentUsers.filter(id => id !== userId)
          : [...currentUsers, userId]
      };
    });
  };

  const applyAiJson = () => {
    FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'Attempting to parse and apply AI JSON output');
    try {
      const parsed = JSON.parse(aiJsonInput);
      
      const enrichedExercises = (parsed.exercises || []).map((parsedEx, index) => {
        const baseEx = exercises.find(e => Number(e.id) === Number(parsedEx.exercise_id));
        if (!baseEx) {
          FrontendLogger.warn('CREATE_TEMPLATE_PAGE', `AI provided an invalid exercise ID: ${parsedEx.exercise_id}. Skipping.`);
          return null;
        }

        const enrichedParams = (baseEx.parameters || []).map(baseParam => {
          const baseParamId = baseParam.parameter_id || baseParam.id; // Safe ID resolution
          const aiParamValue = parsedEx.parameters?.find(p => Number(p.parameter_id) === Number(baseParamId));
          return {
            ...baseParam,
            parameter_id: baseParamId, // Explicitly enforce parameter_id existence
            default_value: aiParamValue !== undefined ? Number(aiParamValue.default_value) : Number(baseParam.default_value || 0)
          };
        });

        return {
          exercise_id: baseEx.id,
          name: baseEx.name,
          position: parsedEx.position !== undefined ? parsedEx.position : index,
          sets: parsedEx.sets || 3,
          parameters: enrichedParams
        };
      }).filter(Boolean);

      FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'Successfully enriched exercises from AI data', { enrichedCount: enrichedExercises.length });

      setFormData(prev => ({ 
        ...prev, 
        name: parsed.name || prev.name,
        description: parsed.description || prev.description,
        estimated_duration: parsed.estimated_duration || prev.estimated_duration,
        tag_ids: Array.isArray(parsed.tag_ids) && parsed.tag_ids.length > 0 ? parsed.tag_ids : (Array.isArray(prev.tag_ids) ? prev.tag_ids : []),
        assigned_user_ids: Array.isArray(parsed.assigned_user_ids) && parsed.assigned_user_ids.length > 0 ? parsed.assigned_user_ids : (Array.isArray(prev.assigned_user_ids) ? prev.assigned_user_ids : []),
        exercises: recalculateVirtualParams(enrichedExercises) 
      }));
      
      setIsAiModalOpen(false);
      setAiJsonInput('');
      FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'AI JSON successfully applied to form state');
    } catch (e) {
      alert('פורמט JSON לא תקין.');
      FrontendLogger.error('CREATE_TEMPLATE_PAGE', 'Failed to parse AI JSON', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clean the payload to match Pydantic model expectations and force parameter_id mapping
    const cleanPayload = {
      name: formData.name,
      description: formData.description,
      estimated_duration: formData.estimated_duration,
      tag_ids: Array.isArray(formData.tag_ids) ? formData.tag_ids : [],
      assigned_user_ids: Array.isArray(formData.assigned_user_ids) ? formData.assigned_user_ids : [],
      exercises: Array.isArray(formData.exercises) ? formData.exercises.map(ex => ({
        exercise_id: ex.exercise_id,
        position: ex.position,
        sets: ex.sets,
        parameters: Array.isArray(ex.parameters) ? ex.parameters.map(p => ({
          parameter_id: p.parameter_id || p.id, // Absolute safety net to prevent 422
          default_value: p.default_value
        })) : []
      })) : []
    };

    FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'Submitting cleaned payload', cleanPayload);
    
    try {
      await createTemplate(cleanPayload);
      navigate('/templates');
    } catch (error) {
      alert('אירעה שגיאה בשמירת השבלונה.');
      FrontendLogger.error('CREATE_TEMPLATE_PAGE', 'Server rejected submission', error);
    }
  };

  const aiPromptText = `אני בונה שבלונת אימון במערכת. אנא ספק לי מבנה JSON תקין עבור השבלונה.
השתמש אך ורק במספרי ה-ID של התגים, התרגילים והפרמטרים מתוך הרשימות הבאות:

תגים זמינים:
${tags.map(t => `- ${t.name} (ID: ${t.id})`).join('\n')}

תרגילים זמינים:
${exercises.map(e => `- ${e.name} (ID: ${e.id})`).join('\n')}

החזר אך ורק JSON במבנה הבא:
{
  "name": "שם האימון",
  "description": "תיאור קצר",
  "estimated_duration": 45,
  "tag_ids": [1, 2],
  "assigned_user_ids": [],
  "exercises": [
    {
      "exercise_id": 1,
      "position": 0,
      "sets": 3,
      "parameters": [
        { "parameter_id": 1, "default_value": 10 }
      ]
    }
  ]
}`;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-32">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-zinc-900">{templateId ? 'עריכת שבלונת אימון' : 'הקמת שבלונת אימון חדשה'}</h1>
          <p className="text-sm text-zinc-500 font-bold">הגדרת מבנה האימון, התרגילים והמתאמנים</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Part 1: Base Info & Tags */}
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <h2 className="text-sm font-black uppercase text-zinc-400 tracking-widest">1. מידע בסיס ותגיות</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">שם השבלונה</label>
              <input type="text" placeholder="הכנס שם שבלונה" className="w-full p-4 bg-zinc-50 rounded-xl font-bold border border-zinc-200 outline-none focus:border-zinc-900" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div>
              <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">זמן משוער (דקות)</label>
              <input type="number" placeholder="45" className="w-full p-4 bg-zinc-50 rounded-xl font-bold border border-zinc-200 outline-none focus:border-zinc-900" value={formData.estimated_duration} onChange={e => setFormData({...formData, estimated_duration: parseInt(e.target.value) || 0})} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">תיאור השבלונה</label>
            <textarea placeholder="תיאור כללי של האימון והמטרות..." rows="3" className="w-full p-4 bg-zinc-50 rounded-xl font-bold border border-zinc-200 outline-none focus:border-zinc-900 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          
          <div className="pt-4 border-t border-zinc-100 space-y-4">
            <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">חיפוש ובחירת תגיות</label>
            <input type="text" placeholder="סנן תגיות..." className="w-full p-3 bg-zinc-50 rounded-xl text-xs font-bold border border-zinc-200 outline-none" value={tagSearch} onChange={e => setTagSearch(e.target.value)} />
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2">
              {filteredTags.map(tag => {
                const isSelected = Array.isArray(formData.tag_ids) && formData.tag_ids.includes(tag.id);
                return (
                  <button key={tag.id} type="button" onClick={() => handleTagToggle(tag.id)} className={`transition-all ${isSelected ? 'ring-2 ring-offset-2 ring-zinc-900 rounded-xl' : 'opacity-60 hover:opacity-100'}`}>
                    <TagDisplay name={tag.name} color={tag.color} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Part 2: Workout Flow (Exercises & Params) */}
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <h2 className="text-sm font-black uppercase text-zinc-400 tracking-widest">2. מהלך האימון (תרגילים)</h2>
          
          {/* Exercise Grid & Search */}
          <div className="space-y-4 bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
            <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">מאגר התרגילים (לחץ להוספה)</label>
            <input type="text" placeholder="סנן תרגילים לפי שם או תגית (לדוגמה: 'חזה' או 'אירובי')..." className="w-full p-4 bg-white rounded-xl font-bold text-sm border border-zinc-200 outline-none focus:border-cyan-500 transition-colors shadow-sm" value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)} />
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-2">
              {filteredExercises.length > 0 ? filteredExercises.map(ex => (
                <button key={ex.id} type="button" onClick={() => handleAddExercise(ex)} className="bg-white p-4 rounded-xl border border-zinc-200 hover:border-cyan-500 hover:shadow-md transition-all text-right group flex flex-col gap-2 justify-between">
                  <span className="font-black text-sm text-zinc-800 group-hover:text-cyan-700">{ex.name}</span>
                  {Array.isArray(ex.tag_ids) && ex.tag_ids.length > 0 && (
                     <div className="flex flex-wrap gap-1">
                        {ex.tag_ids.slice(0,2).map(tId => {
                          const tObj = getTagById(tId);
                          return tObj ? <span key={tId} className="text-[9px] bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500">{tObj.name}</span> : null;
                        })}
                     </div>
                  )}
                </button>
              )) : <p className="text-xs text-zinc-400 p-2 col-span-full">לא נמצאו תרגילים התואמים את החיפוש.</p>}
            </div>
          </div>

          {/* Draggable List */}
          <div className="mt-8 border-t border-zinc-100 pt-8 min-h-[100px]">
             <h3 className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">התרגילים שנבחרו לאימון</h3>
             {!Array.isArray(formData.exercises) || formData.exercises.length === 0 ? (
               <div className="text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl p-8">
                 <p className="text-zinc-400 text-sm font-bold">טרם נוספו תרגילים לאימון זה.</p>
                 <p className="text-zinc-400 text-xs mt-1">בחר תרגילים מהמאגר למעלה כדי להתחיל.</p>
               </div>
             ) : (
               <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                 <SortableContext items={formData.exercises.map(e => e.position.toString())} strategy={verticalListSortingStrategy}>
                   <div className="space-y-4">
                     {formData.exercises.map(ex => (
                       <SortableExerciseItem 
                         key={ex.position.toString()} 
                         exercise={ex} 
                         onUpdateParam={handleUpdateParam} 
                         onRemove={handleRemoveExercise} 
                       />
                     ))}
                   </div>
                 </SortableContext>
               </DndContext>
             )}
          </div>
        </div>

        {/* Part 3: Users */}
        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black uppercase text-zinc-400 tracking-widest">3. שיוך למתאמנים</h2>
            <div className="flex gap-2">
              <button type="button" onClick={() => {
                  FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'Selected all users');
                  setFormData(prev => ({...prev, assigned_user_ids: users.map(u => u.id)}));
                }} className="text-[10px] font-bold bg-zinc-100 px-3 py-1 rounded hover:bg-zinc-200">בחר הכל</button>
              <button type="button" onClick={() => {
                  FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'Cleared all selected users');
                  setFormData(prev => ({...prev, assigned_user_ids: []}));
                }} className="text-[10px] font-bold bg-red-50 text-red-600 px-3 py-1 rounded hover:bg-red-100">נקה הכל</button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {users.map(u => {
              // Strict type checking to prevent undefined property errors
              const isSelected = Array.isArray(formData.assigned_user_ids) && formData.assigned_user_ids.includes(u.id);
              return (
                <button key={u.id} type="button" onClick={() => toggleUserSelection(u.id)} className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${isSelected ? 'border-zinc-900 bg-zinc-50 shadow-md' : 'border-transparent hover:bg-zinc-50 opacity-60 hover:opacity-100'}`}>
                  <div className="w-12 h-12 rounded-full bg-zinc-200 mb-2 overflow-hidden">
                    {u.profile_picture ? <img src={u.profile_picture} alt={u.username} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-zinc-400 font-bold text-xs">{u.first_name?.[0]}</div>}
                  </div>
                  <span className="text-[10px] font-black text-center">{u.first_name} {u.second_name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={() => navigate('/templates')} className="px-8 py-4 font-bold text-zinc-500 hover:bg-zinc-50 rounded-xl">ביטול</button>
          <button type="submit" className="px-12 py-4 bg-zinc-900 text-white rounded-xl font-black shadow-xl hover:bg-zinc-800 transition-all active:scale-95">
            {templateId ? 'עדכן שבלונה' : 'שמור שבלונה חדשה'}
          </button>
        </div>
      </form>

      {/* Part 4: AI Assistant Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            <h3 className="font-black text-lg text-zinc-900">AI Assistant - יצירה אוטומטית</h3>
            
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100">
                <p className="text-xs font-bold text-cyan-800 mb-2">1. העתק את הפרומפט הבא ל-AI שלך (ChatGPT / Claude):</p>
                <div className="relative">
                  <textarea className="w-full h-32 p-3 bg-white border border-cyan-200 rounded-lg text-[10px] font-mono text-zinc-600 resize-none outline-none" readOnly value={aiPromptText} />
                  <button type="button" onClick={() => {
                    navigator.clipboard.writeText(aiPromptText);
                    FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'Copied AI Prompt to clipboard');
                  }} className="absolute top-2 left-2 bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded">העתק</button>
                </div>
              </div>

              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <p className="text-xs font-bold text-zinc-800 mb-2">2. הדבק את ה-JSON שקיבלת חזרה כאן:</p>
                <textarea className="w-full h-48 p-3 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-900 outline-none focus:border-zinc-500 resize-none" placeholder="{ ... }" value={aiJsonInput} onChange={e => setAiJsonInput(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-zinc-100">
              <button type="button" onClick={() => setIsAiModalOpen(false)} className="px-6 py-3 font-bold text-zinc-500">ביטול</button>
              <button type="button" onClick={applyAiJson} className="flex-1 bg-cyan-600 text-white py-3 rounded-xl font-black hover:bg-cyan-700 transition-colors">החל נתונים בטופס</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating AI Button */}
      <button type="button" onClick={() => {
        setIsAiModalOpen(true);
        FrontendLogger.info('CREATE_TEMPLATE_PAGE', 'Opened AI Assistant Modal');
      }} className="fixed bottom-8 right-8 w-16 h-16 bg-cyan-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all font-black text-xs border-4 border-white z-40">
        AI✨
      </button>

    </div>
  );
};

export default CreateTemplatePage;