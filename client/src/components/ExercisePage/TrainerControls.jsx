import React from 'react';
import SubExerciseCreator from './TrainerControls/SubExerciseCreator';
import ParameterLinker from './TrainerControls/ParameterLinker';

/**
 * Component providing administrative controls for trainers and admins.
 * Allows linking parameters to an exercise or creating sub-exercises.
 */
const TrainerControls = ({ 
    isTrainer, 
    hasParameters, 
    hasSubExercises, 
    parameters, 
    selectedParamId, 
    setSelectedParamId, 
    onLinkParam, 
    onCreateAndLink, 
    newSubExName, 
    setNewSubExName, 
    onAddSub 
}) => {
    // Guard clause: Only render for authorized roles
    if (!isTrainer) return null;

    /**
     * Grid configuration:
     * Shows both panels side-by-side if no content is established yet.
     * Otherwise, centers the single available action.
     */
    const gridTemplateColumns = (!hasParameters && !hasSubExercises) ? '1fr 1fr' : '1fr';

    return (
        <div style={{ 
            marginTop: '40px', 
            display: 'grid', 
            gridTemplateColumns: gridTemplateColumns, 
            gap: '20px', 
            background: '#f8f9fa', 
            padding: '20px', 
            borderRadius: '12px',
            border: '1px solid #e9ecef'
        }}>
            
            {/* 
                Logic: Parameter linking is only allowed if the exercise 
                does not act as a parent to other sub-exercises.
            */}
            {!hasSubExercises && (
                <ParameterLinker 
                    parameters={parameters}
                    selectedParamId={selectedParamId}
                    setSelectedParamId={setSelectedParamId}
                    onLinkParam={onLinkParam}
                    onCreateAndLink={onCreateAndLink}
                />
            )}

            {/* 
                Logic: Sub-exercise creation is only allowed if there are 
                no parameters directly linked to this exercise.
            */}
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