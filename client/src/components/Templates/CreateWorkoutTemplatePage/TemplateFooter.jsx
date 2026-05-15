import React from 'react';

const TemplateFooter = ({ onCancel }) => {
  return (
    <div className="flex gap-4 mt-8 sticky bottom-6 z-10 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-zinc-100 shadow-lg">
      <button 
        type="submit" 
        className="flex-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg active:scale-95"
      >
        שמור שבלונה
      </button>
      <button 
        type="button" 
        onClick={onCancel} 
        className="flex-1 w-full bg-white hover:bg-zinc-50 text-zinc-600 py-3 rounded-xl font-bold text-sm border border-zinc-200 transition-all active:scale-95"
      >
        ביטול
      </button>
    </div>
  );
};

export default TemplateFooter;