import React, { useState } from 'react';
import FrontendLogger from '../../utils/logger';

/**
 * AddExerciseModal Component - Modal tray to dynamically inject exercises into an active session.
 * Fully adapted to the unified flat schema registry layout using 'exercise_name'.
 * Employs bright "Arctic Mirror" glassmorphism structures and filters context operations.
 */
const AddExerciseModal = ({ isOpen, onClose, exercises = [], onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Search filter evaluation mapped directly to the dry flat data layer attribute key
  const filteredExercises = exercises.filter(ex => 
    (ex.exercise_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (exercise) => {
    FrontendLogger.info('ADD_EXERCISE_MODAL', `Athlete injected exercise blueprint entity ID: ${exercise.id} into running logs`);
    onSelect(exercise);
    setSearchTerm('');
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
      {/* Click-outside backdrop safety anchor overlay */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Main Structural Glass Frame Wrapper */}
      <div className="relative bg-white/50 backdrop-blur-3xl w-full max-w-lg rounded-[2.5rem] border border-white/60 flex flex-col max-h-[80vh] shadow-2xl overflow-hidden font-sans animate-in zoom-in-95 duration-300" dir="rtl">
        
        {/* Modal Sheet Top Action Bar Header */}
        <div className="p-6 border-b border-white/40 flex justify-between items-center bg-white/20">
          <h3 className="m-0 text-xl font-black text-zinc-900 tracking-tighter uppercase">הוספת תרגיל לאימון</h3>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/80 border border-white/90 text-zinc-500 hover:bg-white hover:text-zinc-900 transition-all shadow-sm active:scale-90"
          >
            ✕
          </button>
        </div>

        {/* Live Registry Query Input Field Panel */}
        <div className="p-4 border-b border-white/40 bg-white/10">
          <input 
            type="text" 
            placeholder="חפש תרגיל ממאגר הקבוצה..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-5 py-4 rounded-2xl border border-white/80 bg-white/60 text-sm font-bold text-zinc-900 outline-none focus:bg-white focus:ring-8 focus:ring-zinc-900/5 transition-all shadow-inner placeholder:text-zinc-300"
            autoFocus
          />
        </div>

        {/* Scrolling Registry Stock Stream Result Arena */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide space-y-1">
          {filteredExercises.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {filteredExercises.map((ex) => (
                <div 
                  key={ex.id} 
                  onClick={() => handleSelect(ex)}
                  className="flex justify-between items-center p-4 bg-white/40 hover:bg-white/80 border border-transparent hover:border-white/80 rounded-2xl cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-black text-zinc-900 tracking-tight transition-colors group-hover:text-blue-600">
                      {ex.exercise_name}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                      ID: {ex.id || 'Registry'}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-white border border-white text-zinc-900 flex items-center justify-center font-black text-sm group-hover:bg-zinc-900 group-hover:text-white transition-all shadow-sm active:scale-95">
                    ＋
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-zinc-400 text-xs font-black uppercase tracking-widest italic select-none">
              לא נמצאו תרגילים תואמים במאגר
            </div>
          )}
        </div>

        {/* Bottom Escape Control Footer Guard */}
        <div className="p-4 border-t border-white/40 bg-white/20">
          <button 
            type="button"
            onClick={onClose} 
            className="w-full py-4 bg-white/60 text-zinc-500 hover:text-zinc-900 border border-white rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm hover:bg-white"
          >
            ביטול סגירה
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddExerciseModal;