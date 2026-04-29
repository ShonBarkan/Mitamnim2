import React from 'react';
import SubExerciseCreator from '../ExercisePage/TrainerControls/SubExerciseCreator';
import ParameterLinker from '../ExercisePage/TrainerControls/ParameterLinker';

const TrainerControls = ({ 
  isTrainer, 
  hasParameters, 
  hasSubExercises, 
  parameters, 
  selectedParamId, 
  setSelectedParamId, 
  onLinkParam, 
  newSubExName, 
  setNewSubExName, 
  onAddSub 
}) => {
  // Guard clause for non-trainer users
  if (!isTrainer) return null;

  // Determine grid layout: 2 columns if both are visible, 1 column otherwise
  const gridTemplateColumns = (!hasParameters && !hasSubExercises) ? '1fr 1fr' : '1fr';

  return (
    <div style={{ 
      marginTop: '40px', 
      display: 'grid', 
      gridTemplateColumns: gridTemplateColumns, 
      gap: '20px', 
      background: '#f8f9fa', 
      padding: '20px', 
      borderRadius: '12px' 
    }}>
      
      {/* Logic: Only show linker if the exercise has no sub-exercises (children) */}
      {!hasSubExercises && (
        <ParameterLinker 
          parameters={parameters}
          selectedParamId={selectedParamId}
          setSelectedParamId={setSelectedParamId}
          onLinkParam={onLinkParam}
        />
      )}

      {/* Logic: Only show sub-exercise creator if the exercise has no parameters linked */}
      {!hasParameters && (
        <SubExerciseCreator
          newSubExName={newSubExName}
          setNewSubExName={setNewSubExName}
          onAddSub={onAddSub}
        />
      )}

    </div>
  );
};

export default TrainerControls;