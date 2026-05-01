import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ExerciseContext } from '../contexts/ExerciseContext';
import { ParameterContext } from '../contexts/ParameterContext';
import { ActiveParamContext } from '../contexts/ActiveParamContext';
import { useToast } from '../hooks/useToast';

import ActivityJournal from '../components/Activity/ActivityJournal';
import ExerciseTreeManager from '../components/Exercises/ExerciseTreeManager';
import Sidebar from '../components/ExercisePage/Sidebar';
import ExerciseHeader from '../components/ExercisePage/ExerciseHeader';
import ActiveParameters from '../components/ExercisePage/ActiveParameters';
import TrainerControls from '../components/ExercisePage/TrainerControls';
import LogModal from '../components/ExercisePage/LogModal';

const ExercisePage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  
  const { exercises, fetchExercises, addExercise } = useContext(ExerciseContext);
  const { parameters, fetchParameters } = useContext(ParameterContext);
  const { activeParams, fetchActiveParams, linkParam, unlinkParam, loading: paramsLoading } = useContext(ActiveParamContext);

  const [selectedEx, setSelectedEx] = useState(null);
  const [newSubExName, setNewSubExName] = useState('');
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  
  // Sidebar Collapse State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Responsive Auto-Collapse Logic
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  const availableParameters = useMemo(() => {
    return parameters.filter(
      p => !activeParams.some(ap => ap.parameter_id === p.id)
    );
  }, [parameters, activeParams]);

  useEffect(() => {
    fetchExercises();
    fetchParameters();
  }, [fetchExercises, fetchParameters]);

  useEffect(() => {
    if (exerciseId && exercises.length > 0) {
      const found = exercises.find(ex => ex.id.toString() === exerciseId);
      if (found) {
        setSelectedEx(found);
        fetchActiveParams(found.id);
      }
    }
  }, [exerciseId, exercises, fetchActiveParams]);

  const handleLinkParam = async (paramId) => {
    if (!paramId || !selectedEx) return;
    const paramToLink = parameters.find(p => p.id === parseInt(paramId));
    if (!paramToLink) return;

    try {
      if (paramToLink.is_virtual && paramToLink.source_parameter_ids) {
        for (const sourceId of paramToLink.source_parameter_ids) {
          const isAlreadyLinked = activeParams.some(ap => ap.parameter_id === sourceId);
          if (!isAlreadyLinked) {
            await linkParam({
              exercise_id: selectedEx.id,
              parameter_id: sourceId,
              group_id: user.group_id,
              default_value: "" 
            });
          }
        }
      }

      await linkParam({
        exercise_id: selectedEx.id,
        parameter_id: paramToLink.id,
        group_id: user.group_id,
        default_value: paramToLink.is_virtual ? "" : "0"
      });
      
      showToast(`${paramToLink.name} linked successfully`, "success");
    } catch (err) {
      showToast("Failed to link parameter", "error");
    }
  };

  const handleAfterCreate = async (newParam) => {
    if (newParam && selectedEx) {
        await handleLinkParam(newParam.id);
    }
  };

  const handleAddSubExercise = async (e) => {
    e.preventDefault();
    try {
      await addExercise({
        name: newSubExName,
        parent_id: selectedEx.id,
        group_id: user.group_id
      });
      setNewSubExName('');
      showToast("Sub-exercise added", "success");
    } catch (err) {
      showToast("Failed to add sub-exercise", "error");
    }
  };

  // Entry View (Full Width)
  if (!selectedEx && !exerciseId) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10 font-sans" dir="rtl">
        <ExerciseTreeManager 
          exercises={exercises} 
          onExerciseClick={(ex) => navigate(`/exercises/${ex.id}`)}
          isTrainer={isTrainer}
          addExercise={addExercise}
          groupId={user?.group_id}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans overflow-x-hidden" dir="rtl">
      
      {/* Dynamic Sidebar */}
      <aside 
        className={`sticky top-0 h-screen bg-white border-l border-zinc-100 transition-all duration-500 ease-in-out z-40 overflow-hidden flex flex-col ${
          isSidebarCollapsed ? 'w-20' : 'w-80'
        }`}
      >
        {/* Toggle Button - Now placed INSIDE the sidebar header area */}
        <div className={`p-4 flex ${isSidebarCollapsed ? 'justify-center' : 'justify-start'}`}>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="w-8 h-8 bg-zinc-100 text-zinc-900 rounded-lg flex items-center justify-center hover:bg-zinc-900 hover:text-white transition-all active:scale-90"
            aria-label="Toggle Sidebar"
          >
            {isSidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <Sidebar 
            exercises={exercises} 
            selectedExId={selectedEx?.id} 
            onExerciseClick={(ex) => navigate(`/exercises/${ex.id}`)}
            isCollapsed={isSidebarCollapsed}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-6 lg:p-12 overflow-y-auto">
        {selectedEx && (
          <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-700">
            
            <ExerciseHeader 
              name={selectedEx.name} 
              id={selectedEx.id} 
              onAddLog={() => setIsAddLogOpen(true)} 
            />

            <ActiveParameters 
              activeParams={activeParams} 
              loading={paramsLoading} 
              isTrainer={isTrainer} 
              onUnlink={unlinkParam} 
            />

            <TrainerControls 
              isTrainer={isTrainer}
              hasParameters={activeParams.length > 0}
              hasSubExercises={exercises.some(ex => ex.parent_id === selectedEx.id)}
              parameters={availableParameters}
              onLinkParam={handleLinkParam}
              onAfterCreate={handleAfterCreate}
              newSubExName={newSubExName}
              setNewSubExName={setNewSubExName}
              onAddSub={handleAddSubExercise}
            />

            <section className="pt-12 border-t border-zinc-100">
               <ActivityJournal exerciseId={selectedEx.id} />
            </section>
            
          </div>
        )}
      </main>

      <LogModal 
        isOpen={isAddLogOpen} 
        onClose={() => setIsAddLogOpen(false)} 
        selectedEx={selectedEx} 
      />
    </div>
  );
};

export default ExercisePage;