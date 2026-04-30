import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ExerciseContext } from '../contexts/ExerciseContext';
import { ParameterContext } from '../contexts/ParameterContext';
import { ActiveParamContext } from '../contexts/ActiveParamContext';
import { useToast } from '../hooks/useToast';

import ActivityJournal from '../components/Activity/ActivityJournal';
import ExerciseTreeManager from '../components/Exercises/ExerciseTreeManager';

// Modular Components
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
  const { parameters, fetchParameters, addParameter } = useContext(ParameterContext);
  const { activeParams, fetchActiveParams, linkParam, unlinkParam, loading: paramsLoading } = useContext(ActiveParamContext);

  const [selectedEx, setSelectedEx] = useState(null);
  const [newSubExName, setNewSubExName] = useState('');
  const [selectedParamId, setSelectedParamId] = useState('');
  const [defaultValue, setDefaultValue] = useState('');
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);

  const isTrainer = user?.role === 'trainer' || user?.role === 'admin';

  // Calculate parameters that are not yet linked to the selected exercise
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
    } else {
      setSelectedEx(null);
    }
  }, [exerciseId, exercises, fetchActiveParams]);

  /**
   * Links an existing parameter to the current exercise
   */
  const handleLinkParam = async (e, directParamId = null) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    
    const paramIdToUse = directParamId || selectedParamId;
    
    if (!paramIdToUse) {
      console.warn("handleLinkParam: No parameter ID selected.");
      return;
    }

    try {
      await linkParam({
        exercise_id: selectedEx.id,
        parameter_id: parseInt(paramIdToUse),
        group_id: user.group_id,
        default_value: defaultValue
      });
      
      setSelectedParamId('');
      showToast("Parameter linked", "success");
    } catch (err) {
      console.error("Failed to link parameter:", err);
      showToast("Failed to link parameter", "error");
    }
  };

  /**
   * Logic for "Create New Parameter and Link"
   * Receives formData from the custom inline form in ParameterLinker
   */
  const handleCreateAndLinkParam = async (formData) => {
    // Validation is handled by the form, but double-check here
    if (!formData.name) return;

    try {
      // 1. Create the parameter in the global pool with its aggregation strategy
      const newParam = await addParameter({
        name: formData.name,
        unit: formData.unit,
        aggregation_strategy: formData.aggregation_strategy,
        group_id: user.group_id
      });

      // 2. Link it specifically to this exercise
      await linkParam({
        exercise_id: selectedEx.id,
        parameter_id: newParam.id,
        group_id: user.group_id,
        default_value: ""
      });

      showToast("New parameter created and linked", "success");
    } catch (err) {
      console.error("Failed to create and link parameter:", err);
      showToast("Failed to create and link parameter", "error");
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

            <section style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <ActivityJournal exerciseId={selectedEx.id} />
            </section>

            <TrainerControls 
              isTrainer={isTrainer}
              hasParameters={activeParams.length > 0}
              hasSubExercises={exercises.some(ex => ex.parent_id === selectedEx.id)}
              parameters={availableParameters}
              selectedParamId={selectedParamId}
              setSelectedParamId={setSelectedParamId}
              onLinkParam={handleLinkParam}
              onCreateAndLink={handleCreateAndLinkParam}
              newSubExName={newSubExName}
              setNewSubExName={setNewSubExName}
              onAddSub={handleAddSubExercise}
            />
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