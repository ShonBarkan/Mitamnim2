import React, { useState } from 'react';
import { useToast } from '../../../contexts/ToastContext';
import FrontendLogger from '../../../utils/logger';

const ExerciseAiHub = ({ existingExercises, existingTags, existingParams, onImportBulk }) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [bulkJson, setBulkJson] = useState('');

  const generateAIPrompt = () => {
    const tagsInfo = existingTags.map(t => t.name).join(', ');
    const paramsInfo = existingParams.map(p => `${p.name} (${p.unit})`).join(', ');
    const exercisesInfo = existingExercises.map(e => e.name).join(', ');

    return `אני בונה מערכת אימונים. אנא הצע לי 10 תרגילים מקצועיים חדשים.
השתמש רק בנתוני המערכת הקיימים כדי למנוע כפילויות.
חשוב מאוד: ב-tag_ids וב-parameter_ids השתמש אך ורק במספר ה-ID (המספר), ולא בשם.

נתוני המערכת הנוכחיים:
- תרגילים קיימים: [ ${exercisesInfo} ]
- תגים זמינים: [ ${existingTags.map(t => `${t.name} (ID: ${t.id})`).join(', ')} ]
- פרמטרים זמינים: [ ${existingParams.map(p => `${p.name} (ID: ${p.id})`).join(', ')} ]

החזר את התוצאה בפורמט JSON בלבד (מערך אובייקטים):
[
  {
    "name": "שם התרגיל בעברית",
    "tag_ids": [id1, id2],
    "parameter_ids": [id1, id2]
  }
]`;
  };

  const copyPromptToClipboard = () => {
    navigator.clipboard.writeText(generateAIPrompt());
    setCopied(true);
    showToast("הפרומפט הועתק", "success");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleBulkUpload = async () => {
    try {
      const parsedData = JSON.parse(bulkJson);
      await onImportBulk(parsedData);
      showToast("התרגילים נוספו בהצלחה", "success");
      setBulkJson('');
    } catch (e) {
      showToast("שגיאה בפורמט ה-JSON", "error");
    }
  };

  return (
    <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 shadow-sm">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">AI Assistant</h3>
      
      <div className="flex flex-col gap-3">
        <button 
          onClick={copyPromptToClipboard} 
          className="w-full bg-white border border-zinc-200 text-zinc-600 py-2 rounded-xl font-bold text-[10px] uppercase hover:bg-zinc-100 transition-all active:scale-95"
        >
          {copied ? "✨ הועתק!" : "📋 העתק פרומפט"}
        </button>

        <textarea
          value={bulkJson}
          onChange={(e) => setBulkJson(e.target.value)}
          placeholder='הדבק כאן את ה-JSON...'
          className="w-full h-20 bg-white border border-zinc-200 rounded-xl p-3 text-[11px] font-mono outline-none focus:border-zinc-400 transition-all resize-none"
        />
        
        <button 
          onClick={handleBulkUpload} 
          className="w-full bg-zinc-900 text-white py-2 rounded-xl font-bold text-[10px] uppercase hover:bg-zinc-700 transition-all active:scale-95"
        >
          🚀 הזרקת נתונים
        </button>
      </div>
    </div>
  );
};

export default ExerciseAiHub;