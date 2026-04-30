import React, { useEffect, useContext } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { useStats } from '../../../contexts/StatsContext';
import { ExerciseContext } from '../../../contexts/ExerciseContext';
import { ParameterContext } from '../../../contexts/ParameterContext';

import DashboardForm from './DashboardForm';
import DashboardItem from './DashboardItem';

const DashboardConfig = () => {
  const { dashboardConfigs, addDashboardConfig, updateDashboardConfig, removeDashboardConfig, refreshAllConfigs } = useStats();
  const { exercises } = useContext(ExerciseContext);
  const { parameters } = useContext(ParameterContext);

  useEffect(() => {
    refreshAllConfigs();
  }, [refreshAllConfigs]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = dashboardConfigs.findIndex(i => i.id === active.id);
    const newIndex = dashboardConfigs.findIndex(i => i.id === over.id);
    const newItems = arrayMove(dashboardConfigs, oldIndex, newIndex);

    newItems.forEach((item, index) => {
      if (item.display_order !== index) updateDashboardConfig(item.id, { display_order: index });
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100" dir="rtl">
      <h3 className="text-xl font-black text-gray-800 mb-6">הגדרות תצוגת דשבורד</h3>
      
      <DashboardForm 
        exercises={exercises} 
        parameters={parameters} 
        onAdd={addDashboardConfig} 
      />

      <div className="space-y-2">
        <h4 className="text-sm font-bold text-gray-400 mb-4 mr-1 uppercase tracking-wider">חוקים פעילים (גרור לשינוי סדר)</h4>
        
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={dashboardConfigs.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {dashboardConfigs.map((config) => (
              <DashboardItem 
                key={config.id} 
                config={config}
                exercises={exercises}
                parameters={parameters}
                onUpdate={updateDashboardConfig}
                onRemove={removeDashboardConfig}
              />
            ))}
          </SortableContext>
        </DndContext>

        {dashboardConfigs.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 text-sm">
            טרם הוגדרו חוקי תצוגה.
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardConfig;