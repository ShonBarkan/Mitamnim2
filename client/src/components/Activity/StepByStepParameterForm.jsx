import React, { useState } from 'react';
import ParameterValueInput from './ParameterValueInput';

/**
 * Step-by-step form for entering performance values for multiple parameters.
 * Navigates through parameters one by one and aggregates results.
 */
const StepByStepParameterForm = ({ params, onSubmit, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState({});

  if (!params || params.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p>לא הוגדרו פרמטרים לתרגיל זה.</p>
        <button onClick={onCancel} style={{ padding: '8px 16px', cursor: 'pointer' }}>ביטול</button>
      </div>
    );
  }

  const currentParam = params[currentIndex];
  const isLastStep = currentIndex === params.length - 1;

  // Update a single parameter's value in the local state
  const handleValueChange = (val) => {
    setResults({ ...results, [currentParam.parameter_id]: val });
  };

  const nextStep = () => {
    if (!results[currentParam.parameter_id]) {
      alert("נא להזין ערך לפני שממשיכים");
      return;
    }
    setCurrentIndex(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentIndex(prev => prev - 1);
  };

  const handleFinish = () => {
    if (!results[currentParam.parameter_id]) {
      alert("נא להזין ערך אחרון");
      return;
    }

    // Map internal results to the JSON schema expected by the Backend
    const performanceData = params.map(p => ({
      parameter_id: p.parameter_id,
      parameter_name: p.parameter_name,
      unit: p.parameter_unit,
      value: String(results[p.parameter_id])
    }));

    onSubmit(performanceData);
  };

  return (
    <div className="step-form">
      {/* Progress Indicator */}
      <div style={{ 
        height: '6px', 
        width: '100%', 
        backgroundColor: '#e9ecef', 
        borderRadius: '3px', 
        marginBottom: '20px', 
        overflow: 'hidden' 
      }}>
        <div style={{
          height: '100%',
          width: `${((currentIndex + 1) / params.length) * 100}%`,
          backgroundColor: '#28a745',
          transition: 'width 0.3s ease'
        }} />
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '12px', color: '#6c757d' }}>
          שלב {currentIndex + 1} מתוך {params.length}
        </span>
        <h4 style={{ margin: '5px 0', fontSize: '20px', color: '#007bff' }}>
          {currentParam.parameter_name}
        </h4>
      </div>

      {/* Actual Input Component (Step 9) */}
      <ParameterValueInput
        unit={currentParam.parameter_unit}
        defaultValue={currentParam.default_value}
        value={results[currentParam.parameter_id] || ''}
        onChange={handleValueChange}
      />

      {/* Navigation Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
        {currentIndex > 0 ? (
          <button 
            onClick={prevStep} 
            style={{ padding: '10px 25px', cursor: 'pointer', borderRadius: '8px', border: '1px solid #ddd', background: '#fff' }}
          >
            חזור
          </button>
        ) : (
          <button 
            onClick={onCancel} 
            style={{ padding: '10px 25px', cursor: 'pointer', borderRadius: '8px', border: 'none', background: '#f8f9fa', color: '#6c757d' }}
          >
            ביטול
          </button>
        )}

        {isLastStep ? (
          <button 
            onClick={handleFinish} 
            style={{ padding: '10px 35px', cursor: 'pointer', borderRadius: '8px', border: 'none', background: '#28a745', color: '#fff', fontWeight: 'bold' }}
          >
            סיום ושמירה
          </button>
        ) : (
          <button 
            onClick={nextStep} 
            style={{ padding: '10px 35px', cursor: 'pointer', borderRadius: '8px', border: 'none', background: '#007bff', color: '#fff', fontWeight: 'bold' }}
          >
            הבא
          </button>
        )}
      </div>
    </div>
  );
};

export default StepByStepParameterForm;