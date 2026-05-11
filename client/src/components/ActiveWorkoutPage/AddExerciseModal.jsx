import React, { useState } from 'react';

const AddExerciseModal = ({ isOpen, onClose, exercises, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (exercise) => {
    onSelect(exercise);
    setSearchTerm('');
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-zinc-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] flex flex-col max-h-[80vh] shadow-2xl overflow-hidden font-sans animate-in zoom-in-95 duration-300" dir="rtl">
        
        <div className="p-6 border-b border-zinc-50 flex justify-between items-center bg-white">
          <h3 className="m-0 text-xl font-black text-zinc-900 tracking-tighter">הוספת תרגיל חדש</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 transition-all">✕</button>
        </div>

        <div className="p-4 border-b border-zinc-50">
          <input 
            type="text" 
            placeholder="חפש תרגיל (למשל: לחיצת חזה)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-5 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-bold text-zinc-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
          {filteredExercises.length > 0 ? (
            <div className="flex flex-col gap-1">
              {filteredExercises.map((ex) => (
                <div 
                  key={ex.id} 
                  onClick={() => handleSelect(ex)}
                  className="flex justify-between items-center p-4 hover:bg-zinc-50 rounded-2xl cursor-pointer transition-all border border-transparent hover:border-zinc-100 group"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-black text-zinc-900">{ex.name}</span>
                    {ex.category_name && (
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{ex.category_name}</span>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                    +
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-10 text-zinc-400 text-sm font-bold">לא נמצאו תרגילים מתאימים</div>
          )}
        </div>

        <div className="p-4 border-t border-zinc-50 bg-zinc-50/50">
          <button 
            onClick={onClose} 
            className="w-full py-3 bg-white border border-zinc-200 rounded-xl text-zinc-600 font-bold text-sm hover:bg-zinc-100 hover:text-zinc-900 transition-all active:scale-95"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExerciseModal;
