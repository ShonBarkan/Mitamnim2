import React from 'react';

const ParameterLinker = ({ parameters, onLinkParam }) => {
  

  const handleAdd = (paramId) => {
    if (!paramId) return;


    onLinkParam(null, paramId);
  };

  return (
    <div style={{ padding: '15px', border: '1px dashed #007bff', borderRadius: '12px', backgroundColor: '#f0f7ff' }}>
      <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        🔗 פרמטרים זמינים לקישור
      </h4>
      
      {parameters.length > 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'refer-content', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
          gap: '10px' 
        }}>
          {parameters.map(p => (
            <div 
              key={p.id}
              onClick={() => handleAdd(p.id)}
              style={{
                backgroundColor: 'white',
                border: '1px solid #d0e3ff',
                borderRadius: '8px',
                padding: '10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                textAlign: 'center',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.box_shadow = '0 4px 8px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.box_shadow = 'none';
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>{p.name}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>({p.unit})</div>
              
              <div style={{
                marginTop: '8px',
                backgroundColor: '#007bff',
                color: 'white',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                +
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: '13px', color: '#666', fontStyle: 'italic', textAlign: 'center' }}>
          כל הפרמטרים הקיימים כבר מקושרים לתרגיל זה.
        </p>
      )}
    </div>
  );
};

export default ParameterLinker;