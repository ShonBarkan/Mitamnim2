import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DashboardItem = ({ config, exercises, parameters, onUpdate, onRemove }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...config });

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: config.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  // מציאת השמות לתצוגה
  const exerciseName = exercises.find(ex => ex.id === config.exercise_id)?.name || config.exercise_id;
  const parameterName = parameters.find(p => p.id === config.parameter_id)?.name || config.parameter_id;

  // שליפת פרמטרים רלוונטיים לתרגיל הספציפי לצורך עריכה
  const selectedEx = exercises.find(ex => ex.id === config.exercise_id);
  const availableParams = selectedEx?.active_parameter_ids?.map(pId => parameters.find(p => p.id === pId)).filter(Boolean) || [];

  const handleSave = () => {
    onUpdate(config.id, editData);
    setIsEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-4 p-4 bg-white border rounded-xl shadow-sm mb-2 transition-all ${isDragging ? 'border-purple-500 shadow-lg' : 'border-gray-100'}`}>
      
      {/* ידית גרירה */}
      <div {...attributes} {...listeners} className="cursor-grab p-2 text-gray-400 hover:text-purple-600">
        <span className="text-xl">⠿</span>
      </div>

      <div className="flex-1">
        {isEditing ? (
          <div className="flex flex-wrap gap-2">
            <select 
              className="text-sm border rounded p-1"
              value={editData.parameter_id}
              onChange={(e) => setEditData({ ...editData, parameter_id: parseInt(e.target.value) })}
            >
              {availableParams.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select 
              className="text-sm border rounded p-1"
              value={editData.ranking_direction}
              onChange={(e) => setEditData({ ...editData, ranking_direction: e.target.value })}
            >
              <option value="desc">DESC (גבוה)</option>
              <option value="asc">ASC (נמוך)</option>
            </select>
          </div>
        ) : (
          <>
            <h4 className="font-bold text-gray-800 text-sm">{exerciseName}</h4>
            <p className="text-xs text-purple-600 font-medium">{parameterName} • {config.ranking_direction === 'desc' ? 'גבוה מנצח' : 'נמוך מנצח'}</p>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isEditing ? (
          <button onClick={handleSave} className="bg-green-500 text-white px-3 py-1 rounded text-xs font-bold">שמור</button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-blue-500 text-sm">ערוך</button>
        )}
        
        <button 
          onClick={() => onUpdate(config.id, { is_public: !config.is_public })}
          className={`w-8 h-8 flex items-center justify-center rounded-lg ${config.is_public ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-400'}`}
        >
          {config.is_public ? '👁️' : '🕶️'}
        </button>

        <button onClick={() => onRemove(config.id)} className="text-gray-300 hover:text-red-500 p-2">✕</button>
      </div>
    </div>
  );
};

export default DashboardItem;