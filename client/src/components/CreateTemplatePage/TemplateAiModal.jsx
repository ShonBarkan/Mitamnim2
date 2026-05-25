import React, { useMemo, useState } from 'react';
import FrontendLogger from '../../utils/logger';

const TemplateAiModal = ({ 
  isAiModalOpen, setIsAiModalOpen, exercises, tags, 
  aiJsonInput, setAiJsonInput, applyAiJson 
}) => {
  const [copied, setCopied] = useState(false);

  // Generate prompt internally to keep the parent page clean
  const aiPromptText = useMemo(() => `אתה עוזר מאמן כושר. בנה לי שבלונת אימון מובנית ב-JSON.
הנחיות:
1. "name": שם קצר ומדויק.
2. "description": תיאור מקצועי ומפורט באורך של לפחות 20 מילים.
3. האימון יהיה והתיאור יהיהו רק בעברית 
4. השתמש ב-ID הבאים בלבד:
תרגילים:
${exercises.map(ex => `\n- ${ex.name} (ID: ${ex.id}): ${ex.parameters?.map(p => ` ${p.name}(ParamID: ${p.id})`).join(', ')}`).join('')}

תגים:
${tags.map(t => `- ${t.name} (ID: ${t.id})`).join('\n')}

החזר JSON בלבד במבנה:
{ "name": "...", "description": "...", "estimated_duration": 45, "tag_ids": [], "exercises": [{ "exercise_id": 1, "position": 0, "sets": 3, "parameters": [{ "parameter_id": 1, "default_value": 10 }] }] }`, [exercises, tags]);

  const handleCopy = () => {
    navigator.clipboard.writeText(aiPromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl space-y-6 max-h-[90vh] flex flex-col">
            <h3 className="font-black text-lg text-zinc-900">AI Assistant</h3>
            <div className="flex-1 overflow-y-auto space-y-4">
              <div className="bg-cyan-50 p-4 rounded-xl border border-cyan-100">
                <p className="text-xs font-bold text-cyan-800 mb-2">1. העתק את הפרומפט:</p>
                <div className="relative">
                  <textarea className="w-full h-40 p-3 bg-white border border-cyan-200 rounded-lg text-[10px] font-mono text-zinc-600 resize-none outline-none" readOnly value={aiPromptText} />
                  <button type="button" onClick={handleCopy} className={`absolute top-2 left-2 text-[10px] font-bold px-3 py-1 rounded ${copied ? 'bg-green-600 text-white' : 'bg-zinc-900 text-white'}`}>
                    {copied ? '✓ הועתק!' : 'העתק'}
                  </button>
                </div>
              </div>
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                <p className="text-xs font-bold text-zinc-800 mb-2">2. הדבק את ה-JSON שקיבלת:</p>
                <textarea className="w-full h-48 p-3 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-900 outline-none focus:border-zinc-500 resize-none" placeholder="{ ... }" value={aiJsonInput} onChange={e => setAiJsonInput(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-4 pt-4 border-t border-zinc-100">
              <button type="button" onClick={() => setIsAiModalOpen(false)} className="px-6 py-3 font-bold text-zinc-500">ביטול</button>
              <button type="button" onClick={applyAiJson} className="flex-1 bg-cyan-600 text-white py-3 rounded-xl font-black hover:bg-cyan-700">החל נתונים</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating Button - Fixed Z-Index to stay on top */}
      <button 
        type="button" 
        onClick={() => setIsAiModalOpen(true)} 
        className="fixed bottom-8 right-8 w-16 h-16 bg-cyan-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all font-black text-xs border-4 border-white z-[90]"
      >
        AI✨
      </button>
    </>
  );
};
export default TemplateAiModal;