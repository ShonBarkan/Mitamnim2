import React, { useState, useEffect, useContext } from 'react';
import { useActivity } from '../../hooks/useActivity';
import { ExerciseContext } from '../../contexts/ExerciseContext';
import { ActiveParamContext } from '../../contexts/ActiveParamContext';
import ExerciseDrillDown from './ExerciseDrillDown';
import StepByStepParameterForm from './StepByStepParameterForm';

/**
 * Wizard component for creating a new activity log.
 * Handles both deep-link selection (from ExercisePage) and root selection (from LandingPage).
 */
const ActivityCreator = ({ initialExercise = null, onComplete }) => {
  const { addLog } = useActivity();
  const { activeParams, fetchActiveParams, loading: paramsLoading } = useContext(ActiveParamContext);

  // Determine starting step: 
  // If we have a leaf exercise (no children), go to 'entry'. 
  // Otherwise (null or category), go to 'selection'.
  const [currentExercise, setCurrentExercise] = useState(initialExercise);
  const [step, setStep] = useState(
    initialExercise && !initialExercise.has_children ? 'entry' : 'selection'
  );
  
  const [logTimestamp, setLogTimestamp] = useState(new Date().toISOString().slice(0, 16));

  // Sync state if initialExercise prop changes
  useEffect(() => {
    if (initialExercise) {
      setCurrentExercise(initialExercise);
      if (!initialExercise.has_children) {
        // It's a leaf node - get its parameters and go to entry
        fetchActiveParams(initialExercise.id);
        setStep('entry');
      } else {
        // It's a category - we stay in selection but start from this parent
        setStep('selection');
      }
    } else {
        // No initial exercise - start from scratch
        setCurrentExercise(null);
        setStep('selection');
    }
  }, [initialExercise, fetchActiveParams]);

  /**
   * Called when a leaf exercise is finally selected from the drill-down.
   */
  const handleExerciseSelect = async (exercise) => {
    setCurrentExercise(exercise);
    if (!exercise.has_children) {
      await fetchActiveParams(exercise.id);
      setStep('entry');
    }
  };

  /**
   * Final submission to the backend.
   */
  const handleFinalSubmit = async (performanceData) => {
    try {
      await addLog({
        exercise_id: currentExercise.id,
        timestamp: new Date(logTimestamp).toISOString(),
        performance_data: performanceData
      });
      
      if (onComplete) onComplete();
      resetCreator();
    } catch (err) {
      alert("שגיאה בשמירת האימון");
    }
  };

  const resetCreator = () => {
    // If we didn't start with a fixed exercise, allow full reset.
    // If we did, we just go back to the selection step within that branch.
    if (!initialExercise) {
      setCurrentExercise(null);
      setStep('selection');
    } else if (initialExercise.has_children) {
      setCurrentExercise(initialExercise);
      setStep('selection');
    }
  };

  return (
    <div className="activity-creator" style={{
      backgroundColor: '#fff',
      borderRadius: '15px',
      padding: '20px',
      border: '1px solid #dee2e6',
      boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
      direction: 'rtl'
    }}>
      <header style={{ marginBottom: '20px', borderBottom: '2px solid #f8f9fa', paddingBottom: '10px' }}>
        <h3 style={{ margin: 0, color: '#343a40' }}>תיעוד אימון חדש</h3>
        
        {currentExercise && (
          <div style={{ marginTop: '5px', color: '#007bff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>{currentExercise.name}</span>
            {/* Show change button only if we aren't forced into a specific leaf */}
            {(step === 'entry' || (initialExercise && initialExercise.has_children)) && (
              <button 
                onClick={resetCreator}
                style={{ 
                    fontSize: '11px', cursor: 'pointer', background: '#f1f3f5', 
                    border: '1px solid #ddd', borderRadius: '4px', color: '#666',
                    padding: '2px 8px'
                }}
              >
                החלף תרגיל
              </button>
            )}
          </div>
        )}
      </header>

      {/* Step 1: Selection - Starts from initialExercise.id if it's a category */}
      {step === 'selection' && (
        <ExerciseDrillDown 
          onSelect={handleExerciseSelect} 
          initialParentId={initialExercise?.id || null}
        />
      )}

      {/* Step 2: Entry - Step by step parameter input */}
      {step === 'entry' && (
        <>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '13px', color: '#6c757d', display: 'block', marginBottom: '5px' }}>מתי זה קרה?</label>
            <input 
              type="datetime-local" 
              value={logTimestamp}
              onChange={(e) => setLogTimestamp(e.target.value)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', width: '100%' }}
            />
          </div>
          
          {paramsLoading ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>טוען פרמטרים...</p>
          ) : (
            <StepByStepParameterForm 
              params={activeParams} 
              onSubmit={handleFinalSubmit}
              onCancel={resetCreator}
            />
          )}
        </>
      )}
    </div>
  );
};

export default ActivityCreator;