import React, { useState, useMemo, useEffect } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useDashboardConfig } from '../../contexts/DashboardConfigContext';
import { useParameter } from '../../contexts/ParameterContext';
import { useExercise } from '../../contexts/ExerciseContext';
import { useToast } from '../../contexts/ToastContext';

// Sortable item wrapper
const SortableConfigItem = ({ config, exercises, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: config.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  
  const associatedExercise = exercises.find(ex => ex.id === config.exercise_id);
  const scopeLabel = config.exercise_id ? associatedExercise?.name : 'כל התרגילים';

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="flex items-center p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm gap-4"
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="cursor-grab text-zinc-400 hover:text-zinc-600 active:cursor-grabbing select-none"
      >
        ⋮⋮
      </div>
      
      <div className="flex-1 flex justify-between items-center">
        <div>
          <h4 className="font-bold">{config.display_name}</h4>
          <p className="text-xs text-zinc-400">
            {scopeLabel} | {config.is_higher_better ? '↑ גבוה עדיף' : '↓ נמוך עדיף'}
          </p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(config.id); }} 
          className="text-red-500 hover:text-red-700 font-bold text-sm"
        >
          מחק
        </button>
      </div>
    </div>
  );
};

const DashboardConfigManager = () => {
  const { configs, createConfig, deleteConfig, reorderConfigs, loading } = useDashboardConfig();
  const { parameters } = useParameter();
  const { exercises } = useExercise();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    parameter_id: '',
    exercise_id: null,
    is_higher_better: true,
    position: 0
  });

  const selectedParam = useMemo(() => 
    parameters.find(p => p.id === parseInt(formData.parameter_id)), 
    [parameters, formData.parameter_id]
  );

  const relevantExercises = useMemo(() => {
    if (!formData.parameter_id) return [];
    const targetParamId = parseInt(formData.parameter_id);
    return exercises.filter(ex => {
      let ids = [];
      if (ex.parameter_ids && Array.isArray(ex.parameter_ids)) ids = ex.parameter_ids;
      else if (ex.parameters && Array.isArray(ex.parameters)) ids = ex.parameters.map(p => p.id);
      return ids.includes(targetParamId);
    });
  }, [exercises, formData.parameter_id]);

  const derivedDisplayName = useMemo(() => {
    if (!selectedParam) return '';
    const exercise = exercises.find(ex => ex.id === parseInt(formData.exercise_id));
    return exercise ? `${exercise.name} - ${selectedParam.name}` : `כל - ${selectedParam.name}`;
  }, [selectedParam, formData.exercise_id, exercises]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createConfig({ ...formData, display_name: derivedDisplayName });
      setFormData({ parameter_id: '', exercise_id: null, is_higher_better: true, position: 0 });
      showToast('הגדרה נוספה בהצלחה', 'success');
    } catch (err) {
      showToast('שגיאה בשמירת ההגדרה', 'error');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = configs.findIndex((c) => c.id === active.id);
    const newIndex = configs.findIndex((c) => c.id === over.id);
    
    // Create the new array order
    const newOrder = arrayMove(configs, oldIndex, newIndex);
    
    try {
      // Pass the entire reordered array to the context function
      await reorderConfigs(newOrder);
      showToast('סדר העדיפויות עודכן בהצלחה', 'success');
    } catch (err) {
      showToast('שגיאה בעדכון הסדר בשרת', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
        <select className="p-3 rounded-xl border border-zinc-200" value={formData.parameter_id} onChange={(e) => setFormData({...formData, parameter_id: e.target.value, exercise_id: null})} required>
          <option value="">בחר פרמטר...</option>
          {parameters.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        
        <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-100 text-zinc-500 font-bold flex items-center justify-center">
          {selectedParam ? `Strategy: ${selectedParam.aggregation_strategy}` : 'בחר פרמטר'}
        </div>

        <select className="w-full p-3 rounded-xl border border-zinc-200" value={formData.exercise_id || ''} onChange={(e) => setFormData({...formData, exercise_id: e.target.value === '' ? null : parseInt(e.target.value)})}>
          <option value="">כל התרגילים</option>
          {relevantExercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
        </select>

        <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-700 font-bold flex items-center truncate">
          {derivedDisplayName || 'שם תצוגה'}
        </div>

        <div className="flex items-center gap-2">
            <select className="flex-1 p-3 rounded-xl border border-zinc-200 font-bold" value={formData.is_higher_better.toString()} onChange={(e) => setFormData({...formData, is_higher_better: e.target.value === 'true'})}>
                <option value="true">↑ גבוה עדיף</option>
                <option value="false">↓ נמוך עדיף</option>
            </select>
            <button type="submit" className="bg-zinc-900 text-white p-3 px-6 rounded-xl font-bold hover:bg-zinc-800 transition-colors">+</button>
        </div>
      </form>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={configs} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {configs.map((config) => (
              <SortableConfigItem key={config.id} config={config} exercises={exercises} onDelete={deleteConfig} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default DashboardConfigManager;