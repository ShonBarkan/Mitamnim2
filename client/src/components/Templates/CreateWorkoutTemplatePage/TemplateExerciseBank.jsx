import React from 'react';

const TemplateExerciseBank = ({ parentId, loading, availableExercises, onAdd }) => {
  return (
    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
      <h4 className="text-sm font-bold text-zinc-600 mb-3">בנק תרגילים זמינים (לחץ להוספה):</h4>
      
      {!parentId ? (
        <p className="text-sm text-zinc-400 italic">בחר קטגוריית אב כדי לראות תרגילים...</p>
      ) : loading ? (
        <p className="text-sm text-blue-600 font-medium">סורק את העץ וטוען תרגילים...</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {availableExercises.map((exercise) => (
            <div 
              key={exercise.id}
              onClick={() => onAdd(exercise)}
              className="flex-shrink-0 px-4 py-2 bg-white border border-zinc-200 rounded-full cursor-pointer text-sm font-bold text-zinc-800 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-1 shadow-sm"
            >
              <span className="text-blue-500 font-black">+</span>
              {exercise.name}
            </div>
          ))}

          {availableExercises.length === 0 && (
            <p className="text-sm text-zinc-400 italic">לא נמצאו תרגילי קצה בקטגוריה זו.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TemplateExerciseBank;