import React, { useState } from 'react';
import { useExercise } from '../../contexts/ExerciseContext';
import { useTag } from '../../contexts/TagContext';
import FrontendLogger from '../../utils/logger';

const AiPromptModal = ({ isOpen, onClose, onApply }) => {
  const [promptJson, setPromptJson] = useState('');
  const { exercises } = useExercise();
  const { tags } = useTag();

  if (!isOpen) return null;

  const generateAIPrompt = () => {
    return `אני בונה שבלונת אימון חדשה במערכת. אנא צור עבורי שבלונת אימון מפורטת.
חשוב מאוד: ב-exercise_id, parameter_id וב-tag_ids השתמש אך ורק במספרי ה-ID המצורפים להלן.

נתוני המערכת הנוכחיים:
- תרגילים זמינים: [ ${exercises.map(e => `${e.name} (ID: ${e.id})`).join(', ')} ]
- תגים זמינים: [ ${tags.map(t => `${t.name} (ID: ${t.id})`).join(', ')} ]

החזר אך ורק פורמט JSON במבנה הבא:
{
  "name": "שם השבלונה",
  "description": "תיאור קצר",
  "estimated_duration": 45,
  "exercises": [
    {
      "exercise_id": 1,
      "sets": 3,
      "parameters": [{"parameter_id": 1, "default_value": 50}]
    }
  ],
  "tag_ids": [1]
}`;
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(generateAIPrompt());
    FrontendLogger.info('AI_PROMPT_MODAL', 'Prompt copied to clipboard');
  };

  const handleApply = () => {
    try {
      const parsedData = JSON.parse(promptJson);
      onApply({
        name: parsedData.name || '',
        description: parsedData.description || '',
        estimated_duration: parsedData.estimated_duration || 30,
        exercises: (parsedData.exercises || []).map((ex, index) => ({
          exercise_id: ex.exercise_id,
          position: index,
          sets: ex.sets || 3,
          parameters: (ex.parameters || []).map(p => ({
            parameter_id: p.parameter_id,
            default_value: parseFloat(p.default_value) || 0
          }))
        })),
        tag_ids: parsedData.tag_ids || []
      });
      onClose();
    } catch (error) {
      alert('פורמט JSON לא תקין.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="font-black text-lg text-zinc-900">AI Assistant - יצירת שבלונה</h3>
        
        <button 
          onClick={copyPrompt}
          className="w-full bg-zinc-100 hover:bg-zinc-200 py-2 rounded-xl font-bold text-xs uppercase tracking-widest text-zinc-600 transition-all"
        >
          📋 העתק פרומפט להנחיית ה-AI
        </button>

        <textarea 
          className="w-full h-64 p-4 bg-zinc-50 rounded-xl text-xs font-mono border border-zinc-200"
          value={promptJson}
          onChange={(e) => setPromptJson(e.target.value)}
          placeholder="הדבק כאן את ה-JSON שקיבלת מה-AI..."
        />
        
        <div className="flex gap-4 pt-4">
          <button onClick={onClose} className="px-4 py-2 font-bold text-zinc-500">ביטול</button>
          <button onClick={handleApply} className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-xl font-black">החל מילוי</button>
        </div>
      </div>
    </div>
  );
};

export default AiPromptModal;