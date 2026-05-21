import React, { useState } from 'react';
import { useTemplate } from '../../contexts/TemplateContext';
import { useExercise } from '../../contexts/ExerciseContext';
import { useUsers } from '../../contexts/UserContext';
import { useTag } from '../../contexts/TagContext';
import FrontendLogger from '../../utils/logger';
import UserSelectionGrid from './UserSelectionGrid';
import TemplateExerciseList from './TemplateExerciseList';
import AiPromptModal from './AiPromptModal';
import AddExerciseModal from './AddExerciseModal';

const TemplateForm = ({ onCancel }) => {
  const { createTemplate } = useTemplate();
  const { exercises } = useExercise();
  const { users } = useUsers();
  const { tags } = useTag();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimated_duration: 30,
    exercises: [], // Structured as { exercise_id, position, sets, parameters: [] }
    assigned_user_ids: [],
    tag_ids: []
  });

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);

  const handleTagToggle = (tagId) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId]
    }));
  };

  const handleUserChange = (selectedIds) => {
    setFormData(prev => ({ ...prev, assigned_user_ids: selectedIds }));
  };

  const handleAiApply = (aiData) => {
    setFormData(prev => ({ ...prev, ...aiData }));
  };

  const handleAddExercise = (newExercise) => {
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, { ...newExercise, position: prev.exercises.length }]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    FrontendLogger.info('TEMPLATE_FORM', 'Initiating template persistence sequence', { name: formData.name });
    try {
      await createTemplate(formData);
      FrontendLogger.info('TEMPLATE_FORM', 'Template creation completed successfully');
      onCancel();
    } catch (error) {
      FrontendLogger.error('TEMPLATE_FORM', 'Critical failure during template persistence', error);
      alert('שגיאה בשמירת השבלונה, בדוק את הלוגים');
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl mt-6 space-y-8 animate-in zoom-in-95">
      <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tight">הקמת שבלונת אימון חדשה</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input 
            type="text" 
            placeholder="שם השבלונה" 
            className="w-full p-4 bg-zinc-50 rounded-xl font-bold border border-zinc-200 focus:border-zinc-900 outline-none transition-all"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
          <input 
            type="number" 
            placeholder="זמן משוער (דקות)" 
            className="w-full p-4 bg-zinc-50 rounded-xl font-bold border border-zinc-200 focus:border-zinc-900 outline-none transition-all"
            value={formData.estimated_duration}
            onChange={(e) => setFormData({...formData, estimated_duration: parseInt(e.target.value) || 0})}
          />
        </div>

        <textarea 
          placeholder="תיאור השבלונה"
          className="w-full p-4 bg-zinc-50 rounded-xl font-bold border border-zinc-200 focus:border-zinc-900 outline-none transition-all"
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        />

        {/* Tag Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">תגיות שיוך</label>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  formData.tag_ids.includes(tag.id) 
                    ? 'bg-zinc-900 text-white shadow-md' 
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* AI Prompt Section */}
        <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-2xl">
          <button 
            type="button" 
            onClick={() => setIsAiModalOpen(true)}
            className="text-cyan-800 font-black text-xs underline"
          >
            הדבק פרומפט AI למילוי אוטומטי
          </button>
        </div>

        {/* User Selection */}
        <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
          <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-4">שיוך מתאמנים</label>
          <UserSelectionGrid 
            users={users} 
            selectedIds={formData.assigned_user_ids} 
            onChange={handleUserChange} 
          />
        </div>

        {/* Exercise List */}
        <div className="bg-white p-4 border border-zinc-200 rounded-2xl space-y-4">
          <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest">מבנה האימון</label>
          <TemplateExerciseList 
            exercises={formData.exercises} 
            setExercises={(newExercises) => setFormData({...formData, exercises: newExercises})}
          />
          <button 
            type="button" 
            onClick={() => setIsExerciseModalOpen(true)}
            className="w-full py-3 border-2 border-dashed border-zinc-300 rounded-xl font-bold text-zinc-500 text-sm hover:bg-zinc-50 transition-colors"
          >
            + הוסף תרגיל חדש
          </button>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-zinc-100">
          <button type="button" onClick={onCancel} className="px-6 py-3 font-bold text-zinc-500 hover:text-zinc-900">ביטול</button>
          <button type="submit" className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-black shadow-lg hover:bg-zinc-800 transition-all active:scale-95">שמור שבלונה</button>
        </div>
      </form>

      {/* Modals */}
      <AiPromptModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        exercises={exercises} 
        onApply={handleAiApply} 
      />
      <AddExerciseModal 
        isOpen={isExerciseModalOpen} 
        onClose={() => setIsExerciseModalOpen(false)} 
        onAdd={handleAddExercise}
      />
    </div>
  );
};

export default TemplateForm;