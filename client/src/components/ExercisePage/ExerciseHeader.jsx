import React from 'react';

const ExerciseHeader = ({ name, id, onAddLog }) => {
  return (
    <header style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h2 style={{ margin: 0 }}>{name}</h2>
        <small style={{ color: '#666' }}>מזהה תרגיל: {id}</small>
      </div>
      
      <button 
        onClick={onAddLog}
        style={{
          backgroundColor: '#28a745', color: 'white', border: 'none', 
          padding: '10px 20px', borderRadius: '30px', cursor: 'pointer',
          fontWeight: 'bold', boxShadow: '0 4px 10px rgba(40, 167, 69, 0.3)'
        }}
      >
        + תיעוד אימון חדש
      </button>
    </header>
  );
};

export default ExerciseHeader;