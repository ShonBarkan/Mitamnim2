import React, { useState } from 'react';
import ParameterForm from '../../Parameters/ParameterForm';

const ParameterLinker = ({ parameters, onLinkParam, onAfterCreate }) => {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div style={{ padding: '15px', border: '1px dashed #007bff', borderRadius: '12px', backgroundColor: '#f0f7ff' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '15px' 
      }}>
        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔗 קישור פרמטרים לתרגיל
        </h4>
        
        <button 
          onClick={() => setIsCreating(!isCreating)}
          style={{
            backgroundColor: isCreating ? '#6c757d' : '#28a745',
            color: 'white', border: 'none', borderRadius: '6px',
            padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
          }}
        >
          {isCreating ? 'ביטול' : '+ צור פרמטר חדש'}
        </button>
      </div>

      {isCreating && (
        <div style={{ marginBottom: '20px', backgroundColor: '#fff', padding: '10px', borderRadius: '12px', border: '1px solid #28a745' }}>
             {/* Using the standard ParameterForm but passing an onSuccess handler to link it immediately */}
             <ParameterForm onSuccess={(newParam) => {
                 setIsCreating(false);
                 onAfterCreate(newParam);
             }} />
        </div>
      )}
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
        gap: '10px' 
      }}>
        {parameters.map(p => (
          <div 
            key={p.id}
            onClick={() => onLinkParam(p.id)}
            style={{
              backgroundColor: 'white',
              border: p.is_virtual ? '1px solid #007bff' : '1px solid #d0e3ff',
              borderRadius: '8px', padding: '10px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer',
              transition: 'transform 0.2s', textAlign: 'center', position: 'relative'
            }}
          >
            {p.is_virtual && (
                <span style={{ 
                    position: 'absolute', top: '5px', left: '5px', 
                    fontSize: '9px', background: '#e7f1ff', color: '#007bff',
                    padding: '1px 4px', borderRadius: '4px', fontWeight: 'bold'
                }}>VIRTUAL</span>
            )}
            <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333', marginTop: p.is_virtual ? '10px' : '0' }}>{p.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>({p.unit})</div>
            <div style={{
              marginTop: '8px', backgroundColor: '#007bff', color: 'white',
              width: '24px', height: '24px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
            }}>+</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ParameterLinker;