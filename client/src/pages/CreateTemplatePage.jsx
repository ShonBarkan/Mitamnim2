import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { arrayMove } from '@dnd-kit/sortable';

import { useTemplate } from '../contexts/TemplateContext';
import { useExercise } from '../contexts/ExerciseContext';
import { useUsers } from '../contexts/UserContext';
import { useTag } from '../contexts/TagContext';
import FrontendLogger from '../utils/logger';

import TemplateBasicInfo from '../components/CreateTemplatePage/TemplateBasicInfo';
import ExerciseBank from '../components/common/Exercise/ExerciseBank';
import TemplateSelectedExercises from '../components/CreateTemplatePage/TemplateSelectedExercises';
import TemplateUserSelector from '../components/CreateTemplatePage/TemplateUserSelector';
import TemplateAiModal from '../components/CreateTemplatePage/TemplateAiModal';

const CreateTemplatePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('id');
  
  const { createTemplate, updateTemplate, templates, fetchTemplates } = useTemplate();
  const { exercises, fetchExercises } = useExercise();
  const { users, refreshUsers } = useUsers();
  const { tags, fetchTags } = useTag();

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

  const filteredTags = useMemo(() => 
    (Array.isArray(tags) ? tags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase())) : []), 
    [tags, tagSearch]
  );

  useEffect(() => {
    if (isInitialMount.current) {
      refreshUsers();
      fetchTags();
      fetchExercises();
      fetchTemplates();
      isInitialMount.current = false;
    }
  }, [refreshUsers, fetchTags, fetchExercises, fetchTemplates]);

  useEffect(() => {
    if (templateId && templates.length > 0 && !initializedUsers) {
      const existingTemplate = templates.find(t => t.id === templateId);
      if (existingTemplate) {
        setFormData({ 
          ...existingTemplate, 
          exercises: Array.isArray(existingTemplate.exercises) ? existingTemplate.exercises : [],
          assigned_user_ids: existingTemplate.assigned_user_ids || [],
          tag_ids: Array.isArray(existingTemplate.tags) ? existingTemplate.tags.map(t => t.id) : (existingTemplate.tag_ids || [])
        });
        setInitializedUsers(true);
      }
    } else if (!templateId && users.length > 0 && !initializedUsers) {
      setFormData(prev => ({ ...prev, assigned_user_ids: users.map(u => u.id) }));
      setInitializedUsers(true);
    }
  }, [templateId, templates, users, initializedUsers]);

  const recalculateVirtualParams = (exercisesArray) => {
    if (!Array.isArray(exercisesArray)) return [];
    return exercisesArray.map(ex => ({
      ...ex,
      parameters: Array.isArray(ex.parameters) ? ex.parameters.map(p => {
        if (p.is_virtual) {
          const sourceVals = (p.source_parameter_ids || []).map(sId => {
            const sourceParam = ex.parameters.find(src => (src.parameter_id || src.id) === sId);
            return sourceParam ? (parseFloat(sourceParam.default_value) || 0) : 0;
          });
          let calcValue = 0;
          if (p.calculation_type === 'multiply') calcValue = sourceVals.reduce((a, b) => a * b, 1);
          else if (p.calculation_type === 'sum') calcValue = sourceVals.reduce((a, b) => a + b, 0);
          else if (p.calculation_type === 'conversion' && sourceVals.length > 0) calcValue = sourceVals[0];
          return { ...p, default_value: calcValue * (p.multiplier || 1) };
        }
        return p;
      }) : []
    }));
  };

  const handleAddExercise = (ex) => {
    setFormData(prev => {
      const currentExercises = Array.isArray(prev.exercises) ? prev.exercises : [];
      const newExercises = [...currentExercises, {
        exercise_id: ex.id,
        name: ex.name,
        position: currentExercises.length,
        sets: 3,
        parameters: Array.isArray(ex.parameters) ? ex.parameters.map(p => ({ 
            ...p, 
            parameter_id: p.parameter_id || p.id,
            default_value: p.default_value || 0 
        })) : [] 
      }];
      return { ...prev, exercises: recalculateVirtualParams(newExercises) };
    });
  };

  const handleRemoveExercise = (position) => {
    setFormData(prev => {
      const filtered = (Array.isArray(prev.exercises) ? prev.exercises : []).filter(ex => ex.position !== position);
      return { ...prev, exercises: filtered.map((ex, idx) => ({ ...ex, position: idx })) };
    });
  };

  const handleUpdateParam = (position, paramId, value) => {
    setFormData(prev => {
      const updatedExercises = (Array.isArray(prev.exercises) ? prev.exercises : []).map(ex => {
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

  const handleUpdateSets = (position, setsValue) => {
    setFormData(prev => ({
      ...prev,
      exercises: (Array.isArray(prev.exercises) ? prev.exercises : []).map(ex => 
        ex.position === position ? { ...ex, sets: setsValue } : ex
      )
    }));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFormData(prev => {
        const currentExercises = Array.isArray(prev.exercises) ? prev.exercises : [];
        const oldIndex = currentExercises.findIndex(i => i.position.toString() === active.id);
        const newIndex = currentExercises.findIndex(i => i.position.toString() === over.id);
        const reordered = arrayMove(currentExercises, oldIndex, newIndex);
        return { ...prev, exercises: reordered.map((item, idx) => ({ ...item, position: idx })) };
      });
    }
  };

  const handleTagToggle = (tagId) => {
    setFormData(prev => {
      const currentTags = Array.isArray(prev.tag_ids) ? prev.tag_ids : [];
      return { ...prev, tag_ids: currentTags.includes(tagId) ? currentTags.filter(id => id !== tagId) : [...currentTags, tagId] };
    });
  };

  const toggleUserSelection = (userId) => {
    setFormData(prev => {
      const currentUsers = Array.isArray(prev.assigned_user_ids) ? prev.assigned_user_ids : [];
      return {
        ...prev,
        assigned_user_ids: currentUsers.includes(userId) ? currentUsers.filter(id => id !== userId) : [...currentUsers, userId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          default_value: parseFloat(p.default_value) || 0
        })) : []
      })) : []
    };

    try {
      if (templateId) {
        await updateTemplate(templateId, cleanPayload);
      } else {
        await createTemplate(cleanPayload);
      }
      navigate('/templates');
    } catch (error) {
      alert('אירעה שגיאה בשמירת השבלונה.');
    }
  };

  const applyAiJson = () => {
    try {
      const parsedData = JSON.parse(aiJsonInput);
      
      // Hydrate the raw AI data with actual exercise metadata from the exercises bank
      const hydratedExercises = (parsedData.exercises || []).map((item) => {
        // Find the full exercise object from your exercises bank
        const fullEx = exercises.find(ex => ex.id === item.exercise_id);
        if (!fullEx) return null;

        return {
          exercise_id: item.exercise_id,
          name: fullEx.name,
          position: item.position,
          sets: item.sets,
          parameters: (fullEx.parameters || []).map(p => {
            // Find the specific value provided by the AI for this parameter ID
            const aiParam = item.parameters.find(ap => ap.parameter_id === (p.id || p.parameter_id));
            return {
                ...p,
                parameter_id: p.id || p.parameter_id,
                default_value: aiParam ? aiParam.default_value : 0
            };
          })
        };
      }).filter(Boolean); // Remove exercises that weren't found in the bank

      setFormData(prev => ({
        ...prev,
        name: parsedData.name || prev.name,
        description: parsedData.description || prev.description,
        estimated_duration: parsedData.estimated_duration || prev.estimated_duration,
        tag_ids: parsedData.tag_ids || prev.tag_ids,
        // Apply the hydrated exercises and run the virtual parameter calculator
        exercises: recalculateVirtualParams(hydratedExercises)
      }));

      setIsAiModalOpen(false);
      setAiJsonInput('');
      FrontendLogger.info('CREATE_TEMPLATE', 'AI generated template data successfully hydrated and applied');
    } catch (error) {
      alert('Invalid JSON format. Please check your input.');
      FrontendLogger.error('CREATE_TEMPLATE', 'Failed to parse AI JSON', error);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 pb-32">
      <h1 className="text-2xl font-black text-zinc-900">{templateId ? 'עריכת שבלונה' : 'יצירת שבלונה חדשה'}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info מופיע ראשון כפי שביקשת */}
        <TemplateBasicInfo 
            formData={formData} 
            setFormData={setFormData} 
            tagSearch={tagSearch} 
            setTagSearch={setTagSearch} 
            filteredTags={filteredTags} 
            handleTagToggle={handleTagToggle} 
        />
        
        {/* מאגר התרגילים מוגן בתוך הטופס (על ידי type="button" בתוך הקומפוננטה) */}
        <div className="bg-white p-8 rounded-3xl border border-zinc-200">
          <ExerciseBank exercises={exercises} onSelect={handleAddExercise} />
          
          <TemplateSelectedExercises 
            exercises={formData.exercises} 
            handleUpdateParam={handleUpdateParam} 
            handleUpdateSets={handleUpdateSets} 
            handleRemoveExercise={handleRemoveExercise} 
            handleDragEnd={handleDragEnd} 
          />
        </div>
        
        <TemplateUserSelector users={users} assignedUserIds={formData.assigned_user_ids} toggleUserSelection={toggleUserSelection} setFormData={setFormData} />
        
        <div className="flex justify-end gap-4 pt-4">
          <button type="button" onClick={() => navigate('/templates')} className="px-8 py-4 font-bold text-zinc-500 hover:bg-zinc-50 rounded-xl">ביטול</button>
          <button type="submit" className="px-12 py-4 bg-zinc-900 text-white rounded-xl font-black shadow-xl hover:bg-zinc-800 transition-all">{templateId ? 'עדכן' : 'שמור'}</button>
        </div>
      </form>

      <TemplateAiModal 
        isAiModalOpen={isAiModalOpen} 
        setIsAiModalOpen={setIsAiModalOpen} 
        exercises={exercises} 
        tags={tags} 
        aiJsonInput={aiJsonInput} 
        setAiJsonInput={setAiJsonInput} 
        applyAiJson={applyAiJson} 
      />
    </div>
  );
};

export default CreateTemplatePage;