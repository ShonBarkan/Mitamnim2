import React from 'react';

const ActiveParameters = ({ activeParams, loading, isTrainer, onUnlink }) => {
  if (loading) return <p>טוען פרמטרים...</p>;

  return (
    <section style={{ marginBottom: '30px' }}>
      <h4 style={{ color: '#495057' }}>📊 פרמטרים פעילים</h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        {activeParams.length > 0 ? activeParams.map(ap => (
          <div key={ap.id} style={{ 
            background: '#f8f9fa', padding: '8px 15px', borderRadius: '20px', 
            border: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px'
          }}>
            <strong>{ap.parameter_name}</strong> 
            <span style={{ color: '#666' }}>({ap.parameter_unit})</span>
            {isTrainer && (
              <button onClick={() => onUnlink(ap.id)} style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer' }}>✕</button>
            )}
          </div>
        )) : <p style={{ fontSize: '14px', color: '#999' }}>אין פרמטרים מקושרים לתרגיל זה.</p>}
      </div>
    </section>
  );
};

export default ActiveParameters;