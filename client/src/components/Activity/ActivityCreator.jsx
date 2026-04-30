import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useActivity } from '../../hooks/useActivity';
import { ParameterContext } from '../../contexts/ParameterContext';
import { ActiveParamContext } from '../../contexts/ActiveParamContext';
import ExerciseDrillDown from './ExerciseDrillDown';
import StepByStepParameterForm from './StepByStepParameterForm';

/**
 * Wizard component for creating a new activity log.
 * Handles data mapping from array-based form submissions to parameter-based calculations.
 * Fixed to include all required fields (name, unit) in the final payload to avoid 422 errors.
 */
const ActivityCreator = ({ initialExercise = null, onComplete }) => {
  const { addLog } = useActivity();
  const { parameters } = useContext(ParameterContext);
  const { activeParams, fetchActiveParams, loading: paramsLoading } = useContext(ActiveParamContext);

  const [currentExercise, setCurrentExercise] = useState(initialExercise);
  
  // Determine starting step: selection if no initial exercise or if it's a category
  const [step, setStep] = useState(
    initialExercise && !initialExercise.has_children ? 'entry' : 'selection'
  );
  
  const [logTimestamp, setLogTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [performanceData, setPerformanceData] = useState([]); // Array format from StepByStepForm

  // Sync state and fetch parameters if a leaf exercise is provided initially
  useEffect(() => {
    if (initialExercise) {
      setCurrentExercise(initialExercise);
      if (!initialExercise.has_children) {
        fetchActiveParams(initialExercise.id);
        setStep('entry');
      } else {
        setStep('selection');
      }
    } else {
      // LandingPage Mode: Start from the root selection
      setCurrentExercise(null);
      setStep('selection');
    }
  }, [initialExercise, fetchActiveParams]);

  /**
   * Calculates results for display and prepares the full data payload for submission.
   */
  const calculatedResults = useMemo(() => {
    if (step !== 'summary') return [];

    const valuesByParamId = {};
    
    // Map existing inputs (raw data) to a lookup by parameter_id
    performanceData.forEach(item => {
      const val = item.value !== undefined ? item.value : item.score;
      if (item.parameter_id !== undefined && val !== undefined && val !== '') {
        valuesByParamId[item.parameter_id] = parseFloat(val);
      }
    });

    return activeParams.map(ap => {
      const paramMeta = parameters.find(p => p.id === ap.parameter_id);
      const isVirtual = paramMeta?.is_virtual || false;
      const unit = paramMeta?.unit || ap.parameter_unit || '';
      const name = paramMeta?.name || ap.parameter_name || '';

      let finalValue = "0";

      if (!isVirtual) {
        const found = performanceData.find(item => item.parameter_id === ap.parameter_id);
        finalValue = found ? (found.value !== undefined ? found.value : found.score) : "0";
      } else {
        // Virtual logic calculation
        let result = null;
        const sources = paramMeta?.source_parameter_ids || [];
        const sourceValues = sources.map(id => valuesByParamId[id]).filter(v => !isNaN(v));
        
        if (sourceValues.length === sources.length && sources.length > 0) {
          switch (paramMeta.calculation_type) {
            case 'conversion': result = sourceValues[0] * (paramMeta.multiplier || 1); break;
            case 'sum': result = sourceValues.reduce((a, b) => a + b, 0); break;
            case 'subtract': result = sourceValues[0] - sourceValues[1]; break;
            case 'multiply': result = sourceValues.reduce((a, b) => a * b, 1); break;
            case 'divide': result = (sourceValues.length >= 2 && sourceValues[1] !== 0) ? sourceValues[0] / sourceValues[1] : null; break;
            case 'percentage': result = (sourceValues.length >= 2 && sourceValues[1] !== 0) ? (sourceValues[0] / sourceValues[1]) * 100 : null; break;
            default: result = null;
          }
        }
        finalValue = result !== null ? result.toFixed(2).replace(/\.00$/, '') : "0";
      }

      return { 
        parameter_id: ap.parameter_id,
        parameter_name: name, // Required for final payload
        unit: unit,           // Required for final payload
        value: finalValue, 
        is_virtual: isVirtual 
      };
    });
  }, [step, performanceData, activeParams, parameters]);

  const handleExerciseSelect = async (exercise) => {
    setCurrentExercise(exercise);
    if (!exercise.has_children) {
      await fetchActiveParams(exercise.id);
      setStep('entry');
    }
  };

  const handleReviewRequest = (data) => {
    setPerformanceData(data);
    setStep('summary');
  };

  /**
   * Merges raw and calculated parameters into the final payload for the server.
   */
  const handleFinalSubmit = async () => {
    // Inject calculated values and metadata into the performance_data payload
    const finalPayload = calculatedResults.map(res => ({
      parameter_id: res.parameter_id,
      parameter_name: res.parameter_name,
      unit: res.unit,
      value: res.value
    }));

    try {
      await addLog({
        exercise_id: currentExercise.id,
        timestamp: new Date(logTimestamp).toISOString(),
        performance_data: finalPayload
      });
      if (onComplete) onComplete();
      resetCreator();
    } catch (err) {
      console.error("Save failed:", err.response?.data || err.message);
      alert("שגיאה בשמירת האימון");
    }
  };

  const resetCreator = () => {
    setPerformanceData([]);
    // If started from root (LandingPage), go back to root selection
    if (!initialExercise) {
      setCurrentExercise(null);
      setStep('selection');
    } else if (initialExercise.has_children) {
      setCurrentExercise(initialExercise);
      setStep('selection');
    } else {
      setStep('entry');
    }
  };

  return (
    <div className="activity-creator" style={{ backgroundColor: '#fff', borderRadius: '15px', padding: '20px', border: '1px solid #dee2e6', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', direction: 'rtl' }}>
      <header style={{ marginBottom: '20px', borderBottom: '2px solid #f8f9fa', paddingBottom: '10px' }}>
        <h3 style={{ margin: 0, color: '#343a40' }}>{step === 'summary' ? 'בדיקת נתוני אימון' : 'תיעוד אימון חדש'}</h3>
        {currentExercise && (
          <div style={{ marginTop: '5px', color: '#007bff', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>{currentExercise.name}</span>
            {(step !== 'selection' && (!initialExercise || initialExercise.has_children)) && (
              <button onClick={resetCreator} style={{ fontSize: '11px', cursor: 'pointer', background: '#f1f3f5', border: '1px solid #ddd', borderRadius: '4px', color: '#666', padding: '2px 8px' }}>
                החלף תרגיל
              </button>
            )}
          </div>
        )}
      </header>

      {/* Step 1: Selection - Starts from initialExercise.id or null for root */}
      {step === 'selection' && (
        <ExerciseDrillDown 
          onSelect={handleExerciseSelect} 
          initialParentId={initialExercise?.id || null} 
        />
      )}

      {step === 'entry' && (
        <>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '13px', color: '#6c757d', display: 'block', marginBottom: '5px' }}>תאריך ושעה:</label>
            <input 
              type="datetime-local" 
              value={logTimestamp} 
              onChange={(e) => setLogTimestamp(e.target.value)} 
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', width: '100%' }} 
            />
          </div>
          {paramsLoading ? <p style={{ textAlign: 'center' }}>טוען פרמטרים...</p> : (
            <StepByStepParameterForm 
              params={activeParams.filter(ap => {
                  const meta = parameters.find(p => p.id === ap.parameter_id);
                  return meta && !meta.is_virtual;
              })} 
              onSubmit={handleReviewRequest}
              onCancel={resetCreator}
            />
          )}
        </>
      )}

      {step === 'summary' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '10px', border: '1px solid #e9ecef' }}>
                  <h4 style={{ marginTop: 0, fontSize: '16px', borderBottom: '1px solid #ddd', paddingBottom: '8px' }}>סיכום ביצועים:</h4>
                  <div style={{ display: 'grid', gap: '10px' }}>
                      {calculatedResults.map(res => (
                          <div key={res.parameter_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #eee', paddingBottom: '5px' }}>
                              <span style={{ color: res.is_virtual ? '#007bff' : '#333', fontWeight: res.is_virtual ? 'bold' : 'normal' }}>
                                  {res.parameter_name}:
                              </span>
                              <span><strong>{res.value}</strong> {res.unit}</span>
                          </div>
                      ))}
                  </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleFinalSubmit} style={{ flex: 2, padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>אשר ושמור תיעוד</button>
                  <button onClick={() => setStep('entry')} style={{ flex: 1, padding: '12px', background: '#e9ecef', color: '#495057', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>חזור לעריכה</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default ActivityCreator;