import React, { useState, useMemo } from 'react';

/**
 * DashboardForm Component - Form to define new leaderboard display rules.
 * Implements the "Arctic Mirror" design with Glassmorphism and responsive layout.
 */
const DashboardForm = ({ exercises, parameters, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ 
    exercise_id: '', 
    parameter_id: '', 
    ranking_direction: 'desc' 
  });

  /**
   * Memoized filter for the exercise list based on user search.
   */
  const filteredExercises = useMemo(() => {
    return !searchTerm 
      ? exercises 
      : exercises.filter(ex => ex.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [exercises, searchTerm]);

  /**
   * Memoized list of metrics valid for the currently selected exercise.
   * Maps active_parameter_ids from the exercise to actual parameter objects.
   */
  const availableMetrics = useMemo(() => {
    if (!formData.exercise_id) return [];
    const selectedEx = exercises.find(ex => ex.id === formData.exercise_id);
    return selectedEx?.active_parameter_ids
      ?.map(pId => parameters.find(p => p.id === pId))
      .filter(Boolean) || [];
  }, [formData.exercise_id, exercises, parameters]);

  /**
   * Submits the new dashboard configuration to the parent context.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.exercise_id || !formData.parameter_id) return;
    
    onAdd(formData);
    
    // Reset local state
    setFormData({ exercise_id: '', parameter_id: '', ranking_direction: 'desc' });
    setSearchTerm('');
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-white/30 backdrop-blur-2xl p-8 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 border border-white/60 shadow-inner"
    >
      {/* Step 1: Exercise Selection with Search */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mr-2">1. חיפוש ובחירת תרגיל</label>
        <div className="space-y-2">
          <input 
            type="text" 
            placeholder="Search exercises..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-4 rounded-2xl bg-white/50 border border-white/40 text-sm font-bold text-zinc-900 outline-none focus:ring-8 focus:ring-zinc-900/5 transition-all placeholder:text-zinc-300"
          />
          <select 
            value={formData.exercise_id}
            onChange={(e) => setFormData({...formData, exercise_id: parseInt(e.target.value), parameter_id: ''})}
            className="w-full p-4 rounded-2xl bg-white/50 border border-white/40 text-sm font-bold text-zinc-900 outline-none appearance-none cursor-pointer focus:ring-8 focus:ring-zinc-900/5"
            required
          >
            <option value="">-- בחר תרגיל --</option>
            {filteredExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
          </select>
        </div>
      </div>

      {/* Step 2: Parameter/Metric Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mr-2">2. בחירת מדד להצגה</label>
        <select 
          value={formData.parameter_id}
          onChange={(e) => setFormData({...formData, parameter_id: parseInt(e.target.value)})}
          disabled={!formData.exercise_id}
          className="w-full p-4 rounded-2xl bg-white/50 border border-white/40 text-sm font-bold text-zinc-900 outline-none appearance-none disabled:opacity-30 disabled:cursor-not-allowed focus:ring-8 focus:ring-zinc-900/5"
          required
        >
          <option value="">-- בחר פרמטר --</option>
          {availableMetrics.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} {p.unit ? `(${p.unit})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Step 3: Ranking Direction Selection */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mr-2">3. קביעת סדר דירוג</label>
        <select 
          value={formData.ranking_direction}
          onChange={(e) => setFormData({...formData, ranking_direction: e.target.value})}
          className="w-full p-4 rounded-2xl bg-white/50 border border-white/40 text-sm font-bold text-zinc-900 outline-none appearance-none cursor-pointer focus:ring-8 focus:ring-zinc-900/5"
        >
          <option value="desc">הכי גבוה מנצח (High is Best)</option>
          <option value="asc">הכי נמוך מנצח (Low is Best)</option>
        </select>
      </div>

      {/* Submission Button */}
      <div className="flex items-end">
        <button 
          type="submit" 
          className="w-full bg-zinc-900 text-white font-black py-4 px-6 rounded-2xl hover:bg-zinc-800 transition-all shadow-2xl shadow-zinc-900/20 active:scale-95 text-xs uppercase tracking-widest h-[54px]"
        >
          ＋ הוסף לדשבורד
        </button>
      </div>
    </form>
  );
};

export default DashboardForm;