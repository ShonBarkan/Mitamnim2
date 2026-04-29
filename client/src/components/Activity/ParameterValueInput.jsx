import React from 'react';

/**
 * Input component for a single parameter value.
 * Features a manual text input and quick-access numeric buttons.
 */
const ParameterValueInput = ({ unit, value, onChange, defaultValue }) => {
  // Common gym increments for quick entry
  const quickValues = [5, 10, 15, 20, 25, 30, 40, 50, 60, 80, 100];

  const handleQuickClick = (val) => {
    // If the field is empty, just set the value. 
    // Otherwise, we could either replace or append. Replacing is usually safer for gym logs.
    onChange(String(val));
  };

  return (
    <div className="parameter-value-input" style={{ direction: 'rtl' }}>
      {/* Manual Input Area */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '10px',
        marginBottom: '25px'
      }}>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={defaultValue || "0"}
          style={{
            width: '120px',
            padding: '15px',
            fontSize: '24px',
            textAlign: 'center',
            borderRadius: '12px',
            border: '2px solid #007bff',
            outline: 'none',
            fontWeight: 'bold'
          }}
        />
        <span style={{ fontSize: '18px', color: '#495057', fontWeight: 'bold' }}>
          {unit}
        </span>
      </div>

      {/* Quick Value Buttons Grid */}
      <div style={{ marginBottom: '10px' }}>
        <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '10px', textAlign: 'center' }}>
          בחירה מהירה:
        </p>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '8px' 
        }}>
          {quickValues.map((val) => (
            <button
              key={val}
              onClick={() => handleQuickClick(val)}
              style={{
                padding: '12px 5px',
                backgroundColor: value === String(val) ? '#007bff' : '#f8f9fa',
                color: value === String(val) ? '#fff' : '#495057',
                border: `1px solid ${value === String(val) ? '#007bff' : '#dee2e6'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.1s ease'
              }}
            >
              {val}
            </button>
          ))}
          
          {/* Special "Clear" button */}
          <button
            onClick={() => onChange('')}
            style={{
              padding: '12px 5px',
              backgroundColor: '#fff',
              color: '#dc3545',
              border: '1px solid #dc3545',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              gridColumn: 'span 1'
            }}
          >
            מחק
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParameterValueInput;