import React from 'react';

/**
 * ParameterTabs Component - Handles the selector bar for picking metric archetypes.
 */
const ParameterTabs = ({ creationMode, setCreationMode, setFormData, editingId }) => {
  if (editingId) {
    return (
      <div className="mb-6 flex items-center gap-3 select-none">
        <span className="bg-zinc-900 text-white text-[10px] px-3 py-1 rounded-md font-black uppercase tracking-widest">מצב עריכה פעיל</span>
        <span className="text-zinc-400 text-xs font-bold">עורך מדד מזהה מערכת #{editingId}</span>
      </div>
    );
  }

  const handleTabShift = (mode) => {
    setCreationMode(mode);
    setFormData(prev => ({
      ...prev,
      calculation_type: mode === 'conversion' ? 'conversion' : 'multiply'
    }));
  };

  return (
    <div className="grid grid-cols-3 p-1.5 bg-zinc-200/50 backdrop-blur-sm rounded-2xl mb-8 max-w-xl shadow-inner select-none">
      <button
        type="button"
        onClick={() => handleTabShift('regular')}
        className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
          creationMode === 'regular' ? 'bg-white text-zinc-900 shadow' : 'text-zinc-500 hover:text-zinc-900'
        }`}
      >
        🛠️ רגיל
      </button>
      <button
        type="button"
        onClick={() => handleTabShift('conversion')}
        className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
          creationMode === 'conversion' ? 'bg-white text-zinc-900 shadow' : 'text-zinc-500 hover:text-zinc-900'
        }`}
      >
        🔄 המרה
      </button>
      <button
        type="button"
        onClick={() => handleTabShift('combination')}
        className={`py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${
          creationMode === 'combination' ? 'bg-white text-zinc-900 shadow' : 'text-zinc-500 hover:text-zinc-900'
        }`}
      >
        🧬 שילוב פרמטרים
      </button>
    </div>
  );
};

export default ParameterTabs;