import React from 'react';
import SubExerciseCreator from './TrainerControls/SubExerciseCreator';
import ParameterLinker from './TrainerControls/ParameterLinker';

const TrainerControls = ({ 
    isTrainer, 
    hasParameters, 
    hasSubExercises, 
    parameters, 
    onLinkParam, 
    onAfterCreate, // Updated prop
    newSubExName, 
    setNewSubExName, 
    onAddSub 
}) => {
    if (!isTrainer) return null;

    const gridTemplateColumns = (!hasParameters && !hasSubExercises) ? '1fr 1fr' : '1fr';

    return (
        <div style={{ 
            marginTop: '40px', display: 'grid', gridTemplateColumns: gridTemplateColumns, 
            gap: '20px', background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #e9ecef'
        }}>
            {!hasSubExercises && (
                <ParameterLinker 
                    parameters={parameters}
                    onLinkParam={onLinkParam}
                    onAfterCreate={onAfterCreate}
                />
            )}

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