import React, { useState } from 'react';
import { useTag } from '../../../contexts/TagContext';
import { useToast } from '../../../contexts/ToastContext';
import FrontendLogger from '../../../utils/logger';

/**
 * TagAiHub Component - Optimized for Arctic Mirror glassmorphism aesthetics.
 */
const TagAiHub = () => {
  const { tags, addBulkTags } = useTag();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [bulkJson, setBulkJson] = useState('');

  const generateAIPrompt = () => {
    const existingNames = tags.map(t => t.name).join(', ');
    return `אני בונה מערכת ניהול ספורטאים, ואני צריך שתציע לי רשימה של 10 תגים (Tags) חדשים ומקצועיים בעברית.
הנה רשימת התגים הקיימים אצלי - אל תציע כפילויות: [ ${existingNames || 'אין תגים'} ]

החזר לי תוצאה בפורמט JSON בלבד (מערך של אובייקטים עם השדות: name, color):
[{"name": "...", "color": "#..."}, ...]`;
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
      await addBulkTags(parsedData);
      showToast("כל התגים הוספו בהצלחה!", "success");
      setBulkJson('');
    } catch (e) {
      showToast("פורמט ה-JSON לא תקין", "error");
    }
  };

  return (
    // Updated to match Arctic Mirror glass effect: white translucent background with soft border
    <div className="bg-white/40 backdrop-blur-md rounded-3xl p-6 border border-white/60 shadow-lg">
      <h3 className="text-sm font-black uppercase tracking-wider text-zinc-700 mb-6 select-none">
        💡 AI Hub & Bulk Operations
      </h3>
      
      <div className="flex flex-col gap-4">
        <button 
          onClick={copyPromptToClipboard} 
          className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black text-xs uppercase hover:bg-zinc-800 transition-all shadow-md active:scale-95"
        >
          {copied ? "✨ הועתק!" : "📋 העתק פרומפט חכם ל-AI"}
        </button>

        <textarea
          value={bulkJson}
          onChange={(e) => setBulkJson(e.target.value)}
          placeholder='הדבק כאן את ה-JSON שקיבלת מה-AI...'
          className="w-full h-32 bg-white/60 border border-white/80 rounded-2xl p-4 text-xs font-mono font-bold outline-none focus:ring-4 focus:ring-zinc-900/5 transition-all resize-none"
        />
        
        <button 
          onClick={handleBulkUpload} 
          className="w-full bg-cyan-600 text-white py-4 rounded-2xl font-black text-xs uppercase hover:bg-cyan-700 transition-all shadow-md active:scale-95"
        >
          🚀 הזרק תגים למערכת (Bulk)
        </button>
      </div>
    </div>
  );
};

export default TagAiHub;