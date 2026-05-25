import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { useTemplate } from '../contexts/TemplateContext';
import { useExercise } from '../contexts/ExerciseContext';
import { useUsers } from '../contexts/UserContext';
import { useTag } from '../contexts/TagContext';
import FrontendLogger from '../utils/logger';

import TemplateBasicInfo from '../components/CreateTemplatePage/TemplateBasicInfo';
import TemplateExerciseBank from '../components/CreateTemplatePage/TemplateExerciseBank';
import TemplateSelectedExercises from '../components/CreateTemplatePage/TemplateSelectedExercises';
import TemplateUserSelector from '../components/CreateTemplatePage/TemplateUserSelector';
import TemplateAiModal from '../components/CreateTemplatePage/TemplateAiModal';

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
            assigned_user_ids: existingTemplate.assigned_user_ids || [],
            tag_ids: mappedTagIds 
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

  // Memoized tag filter
  const filteredTags = useMemo(() => 
    tags?.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase())) || [], 
    [tags, tagSearch]
  );

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
            parameter_id: baseParamId, 
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
          parameter_id: p.parameter_id || p.id,
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
        
        <TemplateBasicInfo
          formData={formData}
          setFormData={setFormData}
          tagSearch={tagSearch}
          setTagSearch={setTagSearch}
          filteredTags={filteredTags}
          handleTagToggle={handleTagToggle}
        />

        <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <h2 className="text-sm font-black uppercase text-zinc-400 tracking-widest">2. מהלך האימון (תרגילים)</h2>
          
          <TemplateExerciseBank
            exercises={exercises} // Passes the raw list now
            getTagById={getTagById}
            handleAddExercise={handleAddExercise}
          />

          <TemplateSelectedExercises
            exercises={formData.exercises}
            handleUpdateParam={handleUpdateParam}
            handleRemoveExercise={handleRemoveExercise}
            handleDragEnd={handleDragEnd}
          />
        </div>

        <TemplateUserSelector
          users={users}
          assignedUserIds={formData.assigned_user_ids}
          setFormData={setFormData}
          toggleUserSelection={toggleUserSelection}
        />

        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={() => navigate('/templates')} className="px-8 py-4 font-bold text-zinc-500 hover:bg-zinc-50 rounded-xl">ביטול</button>
          <button type="submit" className="px-12 py-4 bg-zinc-900 text-white rounded-xl font-black shadow-xl hover:bg-zinc-800 transition-all active:scale-95">
            {templateId ? 'עדכן שבלונה' : 'שמור שבלונה חדשה'}
          </button>
        </div>
      </form>

      <TemplateAiModal
        isAiModalOpen={isAiModalOpen}
        setIsAiModalOpen={setIsAiModalOpen}
        aiPromptText={aiPromptText}
        aiJsonInput={aiJsonInput}
        setAiJsonInput={setAiJsonInput}
        applyAiJson={applyAiJson}
      />

    </div>
  );
};

export default CreateTemplatePage;