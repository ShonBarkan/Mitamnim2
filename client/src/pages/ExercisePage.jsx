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

  /**
   * Links a parameter and its dependencies if they are not already linked.
   */
  const handleLinkParam = async (paramId) => {
    if (!paramId || !selectedEx) return;

    const paramToLink = parameters.find(p => p.id === parseInt(paramId));
    if (!paramToLink) return;

    try {
      // 1. Recursive linking: If virtual, ensure all source parameters are linked first
      if (paramToLink.is_virtual && paramToLink.source_parameter_ids) {
        for (const sourceId of paramToLink.source_parameter_ids) {
          const isAlreadyLinked = activeParams.some(ap => ap.parameter_id === sourceId);
          if (!isAlreadyLinked) {
            await linkParam({
              exercise_id: selectedEx.id,
              parameter_id: sourceId,
              group_id: user.group_id,
              default_value: "" // Dependencies are usually raw, but we keep default empty
            });
          }
        }
      }

      // 2. Link the target parameter itself
      await linkParam({
        exercise_id: selectedEx.id,
        parameter_id: paramToLink.id,
        group_id: user.group_id,
        default_value: paramToLink.is_virtual ? "" : "0" // Virtuals never have default values
      });
      
      showToast(`${paramToLink.name} linked successfully`, "success");
    } catch (err) {
      console.error("Failed to link parameter:", err);
      showToast("Failed to link parameter", "error");
    }
  };

  /**
   * Triggered when ParameterForm (inside ParameterLinker) completes creation.
   */
  const handleAfterCreate = async (newParam) => {
    if (newParam && selectedEx) {
        // After creation, we just use the existing link logic to handle potential dependencies
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

  if (!selectedEx && !exerciseId) {
    return (
      <div style={{ direction: 'rtl', padding: '20px' }}>
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
    <div style={{ direction: 'rtl', padding: '20px', display: 'flex', gap: '30px', maxWidth: '1400px', margin: '0 auto' }}>
      <Sidebar 
        exercises={exercises} 
        selectedExId={selectedEx?.id} 
        onExerciseClick={(ex) => navigate(`/exercises/${ex.id}`)} 
      />

      <main style={{ flex: 1 }}>
        {selectedEx && (
          <>
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

            <section style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <ActivityJournal exerciseId={selectedEx.id} />
            </section>
            
          </>
          
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