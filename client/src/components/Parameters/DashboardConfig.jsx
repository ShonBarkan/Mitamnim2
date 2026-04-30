import React, { useState, useContext, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useStats } from '../../contexts/StatsContext';
import { ParameterContext } from '../../contexts/ParameterContext';
import MetricSelector from '../Parameters/DashboardConfig/MetricSelector';
import SortableDashboardItem from '../Parameters/DashboardConfig/SortableDashboardItem';

const DashboardConfig = ({ exercises = [], logs = [], activeParams = [] }) => {
  const { dashboardConfigs = [], addDashboardConfig, removeDashboardConfig, updateDashboardConfig, formulas = [], conversions = [] } = useStats();
  const { parameters = [] } = useContext(ParameterContext);

  const [formData, setFormData] = useState({
    id: null,
    exercise_id: '',
    parameter_id: '',
    ranking_direction: 'desc',
    is_public: true
  });

  const [localConfigs, setLocalConfigs] = useState([]);

  useEffect(() => {
    if (dashboardConfigs) {
      const sorted = [...dashboardConfigs].sort((a, b) => a.display_order - b.display_order);
      setLocalConfigs(sorted);
    }
  }, [dashboardConfigs]);

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 5 },
  }));

  const handleExerciseChange = (e) => {
    const exId = parseInt(e.target.value);
    setFormData({ ...formData, exercise_id: exId, parameter_id: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await updateDashboardConfig(formData.id, formData);
      } else {
        await addDashboardConfig({ ...formData, display_order: dashboardConfigs.length });
      }
      setFormData({ id: null, exercise_id: '', parameter_id: '', ranking_direction: 'desc', is_public: true });
    } catch (err) {
      console.error("Submit failed:", err);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localConfigs.findIndex(i => i.id === active.id);
    const newIndex = localConfigs.findIndex(i => i.id === over.id);
    const newItems = arrayMove(localConfigs, oldIndex, newIndex);
    
    setLocalConfigs(newItems);

    try {
      const updates = newItems.map((item, index) => {
        if (item.display_order !== index) {
          return updateDashboardConfig(item.id, { display_order: index });
        }
        return null;
      }).filter(Boolean);
      await Promise.all(updates);
    } catch (err) {
      console.error("Drag and drop sync failed:", err);
    }
  };

  return (
    <div className="p-6 bg-white shadow-xl rounded-2xl border border-gray-100" dir="rtl">
      <h3 className="text-xl font-black text-gray-800 mb-6">הגדרות תצוגת דשבורד</h3>
      
      <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 mr-1">1. בחר תרגיל</label>
          <select 
            value={formData.exercise_id}
            onChange={handleExerciseChange}
            className="w-full p-3 rounded-lg border-none shadow-sm text-sm font-medium"
            required
          >
            <option value="">-- בחר תרגיל --</option>
            {exercises && exercises.length > 0 ? (
              exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)
            ) : null}
          </select>
        </div>

        <MetricSelector 
          selectedExerciseId={formData.exercise_id}
          exercises={exercises}
          parameters={parameters}
          formulas={formulas}
          conversions={conversions}
          activeParams={activeParams}
          value={formData.parameter_id}
          onChange={(val) => setFormData({...formData, parameter_id: val})}
        />

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-500 mr-1">3. סדר הדירוג</label>
          <select 
            value={formData.ranking_direction}
            onChange={(e) => setFormData({...formData, ranking_direction: e.target.value})}
            className="w-full p-3 rounded-lg border-none shadow-sm text-sm font-medium"
          >
            <option value="desc">גבוה מנצח</option>
            <option value="asc">נמוך מנצח</option>
          </select>
        </div>

        <button type="submit" className="w-full p-3 rounded-lg font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all shadow-lg active:scale-95">
          {formData.id ? 'עדכן הגדרה' : 'הוסף לדשבורד'}
        </button>
      </form>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={localConfigs.map(c => c.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {localConfigs.map((config) => (
              <SortableDashboardItem 
                key={config.id} 
                config={config}
                getExerciseName={(id) => exercises.find(ex => ex.id === id)?.name || id}
                getParameterName={(id) => {
                    const p = parameters.find(p => p.id === parseInt(id));
                    if (p) return p.name;
                    const f = formulas.find(f => f.target_name === id);
                    if (f) return f.target_name;
                    const c = conversions.find(c => c.target_name === id);
                    if (c) return c.target_name;
                    return id;
                }} 
                onRemove={removeDashboardConfig}
                onEdit={(c) => setFormData({...c})}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default DashboardConfig;