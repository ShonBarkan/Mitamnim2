import React from 'react';
import ExerciseLogForm from './ExerciseLogForm';

const ExerciseLogModal = ({ isOpen, onClose, selectedUserId, canModifyLogs }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        // Changed max-w-lg to max-w-3xl for a wider layout
        // Added max-h-[90vh] and overflow-y-auto to ensure responsiveness on small screens
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl p-6 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black text-zinc-900">תיעוד אימון</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 rounded-full text-zinc-600 transition-colors font-bold"
          >
            ✕
          </button>
        </div>

        <ExerciseLogForm 
          selectedUserId={selectedUserId}
          canModifyLogs={canModifyLogs}
          editLogToLoad={null}
          onEditComplete={onClose} 
        />
      </div>
    </div>
  );
};

export default ExerciseLogModal;