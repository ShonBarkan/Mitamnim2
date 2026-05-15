import React, { useEffect, useContext } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { useStats } from '../../../contexts/StatsContext';
import { ExerciseContext } from '../../../contexts/ExerciseContext';
import { ParameterContext } from '../../../contexts/ParameterContext';

import DashboardForm from './DashboardForm';
import DashboardItem from './DashboardItem';

/**
 * DashboardConfig Component - Manages the sorting and definitions of dashboard display rules.
 * Leverages @dnd-kit for high-performance drag-and-drop reorganization.
 * Implements the "Arctic Mirror" design language.
 */
const DashboardConfig = () => {
  const { 
    dashboardConfigs, 
    addDashboardConfig, 
    updateDashboardConfig, 
    removeDashboardConfig, 
    refreshAllConfigs 
  } = useStats();
  
  const { exercises } = useContext(ExerciseContext);
  const { parameters } = useContext(ParameterContext);

  // Sync latest dashboard configurations from the Stats Engine on mount
  useEffect(() => {
    refreshAllConfigs();
  }, [refreshAllConfigs]);

  /**
   * Sensor Configuration:
   * Adds a 5px activation constraint to prevent accidental drags during scrolls.
   */
  const sensors = useSensors(useSensor(PointerSensor, { 
    activationConstraint: { distance: 5 } 
  }));

  /**
   * Handles the persistence of the new display order after a drag operation.
   * Performs bulk updates to the display_order field in the registry.
   */
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = dashboardConfigs.findIndex(i => i.id === active.id);
    const newIndex = dashboardConfigs.findIndex(i => i.id === over.id);
    const newItems = arrayMove(dashboardConfigs, oldIndex, newIndex);

    // Persist changes only where order actually changed
    newItems.forEach((item, index) => {
      if (item.display_order !== index) {
        updateDashboardConfig(item.id, { display_order: index });
      }
    });
  };

  return (
    <div className="bg-white/40 backdrop-blur-3xl p-10 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] border border-white/60 font-sans" dir="rtl">
      
      {/* --- HEADER --- */}
      <header className="mb-10 space-y-2">
        <h3 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase">הגדרות תצוגת דשבורד</h3>
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Dashboard Logic & Display Rules</p>
      </header>
      
      {/* --- CONFIGURATION FORM --- */}
      <section className="mb-12">
        <DashboardForm 
          exercises={exercises} 
          parameters={parameters} 
          onAdd={addDashboardConfig} 
        />
      </section>

      {/* --- ACTIVE RULES LIST (SORTABLE) --- */}
      <div className="space-y-6">
        <div className="flex justify-between items-center mr-2 mb-4">
          <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">
            חוקים פעילים (גרור לשינוי סדר)
          </h4>
          <span className="bg-zinc-900 text-white text-[9px] px-3 py-1 rounded-full font-black uppercase">
            {dashboardConfigs.length} ACTIVE
          </span>
        </div>
        
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={dashboardConfigs.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
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
            </div>
          </SortableContext>
        </DndContext>

        {/* --- EMPTY STATE --- */}
        {dashboardConfigs.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-white/40 rounded-[2.5rem] bg-white/20">
            <p className="text-zinc-300 font-bold uppercase tracking-widest text-xs">
              טרם הוגדרו חוקי תצוגה
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardConfig;