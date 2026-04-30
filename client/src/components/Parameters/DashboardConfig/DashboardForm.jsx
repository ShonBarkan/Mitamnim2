import React, { useState, useMemo } from 'react';

const DashboardForm = ({ exercises, parameters, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ exercise_id: '', parameter_id: '', ranking_direction: 'desc' });

  const filteredExercises = useMemo(() => {
    return !searchTerm ? exercises : exercises.filter(ex => ex.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [exercises, searchTerm]);

  const availableMetrics = useMemo(() => {
    if (!formData.exercise_id) return [];
    const selectedEx = exercises.find(ex => ex.id === formData.exercise_id);
    return selectedEx?.active_parameter_ids?.map(pId => parameters.find(p => p.id === pId)).filter(Boolean) || [];
  }, [formData.exercise_id, exercises, parameters]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.exercise_id || !formData.parameter_id) return;
    onAdd(formData);
    setFormData({ exercise_id: '', parameter_id: '', ranking_direction: 'desc' });
    setSearchTerm('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 border border-gray-200">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-500 mr-1">1. חפש ובחר תרגיל</label>
        <input 
          type="text" placeholder="חפש תרגיל..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2.5 rounded-lg border border-gray-200 text-sm mb-1 focus:ring-2 focus:ring-purple-500 outline-none"
        />
        <select 
          value={formData.exercise_id}
          onChange={(e) => setFormData({...formData, exercise_id: parseInt(e.target.value), parameter_id: ''})}
          className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none"
          required
        >
          <option value="">-- בחר תרגיל --</option>
          {filteredExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-500 mr-1">2. בחר מדד</label>
        <select 
          value={formData.parameter_id}
          onChange={(e) => setFormData({...formData, parameter_id: parseInt(e.target.value)})}
          disabled={!formData.exercise_id}
          className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-white disabled:bg-gray-100 outline-none"
          required
        >
          <option value="">-- בחר פרמטר --</option>
          {availableMetrics.map(p => <option key={p.id} value={p.id}>{p.name} {p.unit ? `(${p.unit})` : ''}</option>)}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-gray-500 mr-1">3. סדר דירוג</label>
        <select 
          value={formData.ranking_direction}
          onChange={(e) => setFormData({...formData, ranking_direction: e.target.value})}
          className="w-full p-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none"
        >
          <option value="desc">הכי גבוה מנצח</option>
          <option value="asc">הכי נמוך מנצח</option>
        </select>
      </div>

      <button type="submit" className="bg-purple-600 text-white font-bold py-2.5 px-4 rounded-lg hover:bg-purple-700 transition-all shadow-md active:scale-95 text-sm h-fit self-end">
        ➕ הוסף לדשבורד
      </button>
    </form>
  );
};

export default DashboardForm;