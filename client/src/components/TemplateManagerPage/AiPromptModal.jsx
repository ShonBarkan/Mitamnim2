import React, { useState } from 'react';
import FrontendLogger from '../../utils/logger';

const AiPromptModal = ({ isOpen, onClose, onApply, exercises }) => {
  const [promptJson, setPromptJson] = useState('');

  if (!isOpen) return null;

  const handleApply = () => {
    try {
      const parsedData = JSON.parse(promptJson);
      
      // Logic to map exercise names to IDs
      const mappedExercises = parsedData.exercises.map((ex, index) => {
        const found = exercises.find(e => e.name.toLowerCase() === ex.name.toLowerCase());
        return {
          exercise_id: found ? found.id : null,
          position: index,
          sets: ex.sets || 3,
          parameters: ex.parameters || []
        };
      });

      onApply({
        name: parsedData.name || '',
        description: parsedData.description || '',
        exercises: mappedExercises
      });
      
      FrontendLogger.info('AI_PROMPT_MODAL', 'Successfully parsed and mapped AI template');
      onClose();
    } catch (error) {
      FrontendLogger.error('AI_PROMPT_MODAL', 'Failed to parse AI JSON', error);
      alert('Invalid JSON format');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-3xl w-full max-w-lg space-y-4">
        <h3 className="font-black text-lg">הדבק פרומפט JSON</h3>
        <textarea 
          className="w-full h-64 p-4 bg-zinc-50 rounded-xl text-xs font-mono"
          value={promptJson}
          onChange={(e) => setPromptJson(e.target.value)}
          placeholder='{"name": "...", "exercises": [{"name": "...", "sets": 3}]}'
        />
        <div className="flex gap-4 pt-4">
          <button onClick={onClose} className="px-4 py-2 font-bold text-zinc-500">ביטול</button>
          <button onClick={handleApply} className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-xl font-black">החל מילוי אוטומטי</button>
        </div>
      </div>
    </div>
  );
};

export default AiPromptModal;