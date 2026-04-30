import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableDashboardItem = ({ config, getExerciseName, getParameterName, onRemove, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: config.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 mb-3 rounded-xl border-2 transition-all ${
        isDragging 
          ? "bg-purple-50 border-purple-300 shadow-xl scale-105" 
          : "bg-white border-gray-100 shadow-sm hover:border-purple-100"
      }`}
    >
      <div className="flex items-center gap-4 flex-1">
        {/* Drag Handle - Only this part triggers the drag */}
        <div 
          {...listeners} 
          {...attributes} 
          className="cursor-grab active:cursor-grabbing p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-purple-500 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
            <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
          </svg>
        </div>
        
        <div className="text-right">
          <div className="font-bold text-gray-800 text-lg">
            {getExerciseName(config.exercise_id)}
          </div>
          <div className="text-sm text-purple-600 font-semibold italic">
            מדד: {getParameterName(config.parameter_id)}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Badge for ranking direction */}
        <div className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter ${
          config.ranking_direction === 'desc' 
            ? "bg-green-50 text-green-600 border border-green-100" 
            : "bg-blue-50 text-blue-600 border border-blue-100"
        }`}>
          {config.ranking_direction === 'desc' ? 'גבוה מנצח' : 'נמוך מנצח'}
        </div>
        
        {/* Edit Button */}
        <button 
          onClick={() => onEdit(config)}
          className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
          title="ערוך הגדרה"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>

        {/* Delete Button */}
        <button 
          onClick={() => {
            if(window.confirm('האם להסיר את המדד מהדשבורד הציבורי?')) {
              onRemove(config.id);
            }
          }}
          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          title="מחק"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default SortableDashboardItem;