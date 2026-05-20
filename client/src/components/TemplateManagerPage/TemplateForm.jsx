import React, { useState } from 'react';
import { useTemplate } from '../../contexts/TemplateContext';
import { useExercise } from '../../contexts/ExerciseContext';
import { useUsers } from '../../contexts/UserContext';
import FrontendLogger from '../../utils/logger';
import UserSelectionGrid from './UserSelectionGrid';
import TemplateExerciseList from './TemplateExerciseList';
import AiPromptModal from './AiPromptModal';
import AddExerciseModal from './AddExerciseModal';

const TemplateForm = ({ onCancel }) => {
  const { createTemplate } = useTemplate();
  const { exercises } = useExercise();
  const { users } = useUsers();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimated_duration: 30,
    exercises: [],
    assigned_user_ids: [],
    tag_ids: []
  });

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);

  const handleUserChange = (selectedIds) => {
    setFormData(prev => ({ ...prev, assigned_user_ids: selectedIds }));
  };

  const handleAiApply = (aiData) => {
    setFormData(prev => ({ ...prev, ...aiData }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      FrontendLogger.info('TEMPLATE_FORM', `Submitting template: ${formData.name}`);
      await createTemplate(formData);
      onCancel();
    } catch (error) {
      FrontendLogger.error('TEMPLATE_FORM', 'Failed to create template', error);
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
            className="w-full p-4 bg-zinc-50 rounded-xl font-bold"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <input 
            type="number" 
            placeholder="זמן משוער (דקות)" 
            className="w-full p-4 bg-zinc-50 rounded-xl font-bold"
            value={formData.estimated_duration}
            onChange={(e) => setFormData({...formData, estimated_duration: parseInt(e.target.value) || 0})}
          />
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

        {/* User Selection Grid */}
        <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100">
          <UserSelectionGrid 
            users={users} 
            selectedIds={formData.assigned_user_ids} 
            onChange={handleUserChange} 
          />
        </div>

        {/* Exercise List with Drag & Drop */}
        <div className="bg-white p-4 border border-zinc-200 rounded-2xl space-y-4">
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
          <button type="button" onClick={onCancel} className="px-6 py-3 font-bold text-zinc-500">ביטול</button>
          <button type="submit" className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-black">שמור שבלונה</button>
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
      />
    </div>
  );
};

export default TemplateForm;