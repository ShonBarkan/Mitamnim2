import React from 'react';
import ExerciseBank from '../common/Exercise/ExerciseBank';

const ExerciseModal = ({ isOpen, onClose, exercises, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] bg-zinc-900/60 backdrop-blur-sm flex justify-center items-center p-4 md:p-6" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()} 
      >
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50 shrink-0">
          <div>
            <h3 className="text-xl font-black text-zinc-900">מאגר תרגילים</h3>
            <p className="text-xs font-bold text-zinc-500 mt-1">בחר תרגילים להוספה לאימון</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center bg-zinc-200 hover:bg-zinc-300 text-zinc-600 rounded-full transition-colors font-bold"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          <ExerciseBank exercises={exercises} onSelect={onSelect} />
        </div>

        <div className="p-4 border-t border-zinc-100 bg-zinc-50 shrink-0">
          <button 
            onClick={onClose} 
            className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl font-black shadow-lg transition-colors active:scale-95"
          >
            סיימתי להוסיף
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseModal;