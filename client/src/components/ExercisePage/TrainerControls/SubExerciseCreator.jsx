import React from 'react';

const SubExerciseCreator = ({ newSubExName, setNewSubExName, onAddSub }) => {
  return (
    <div style={{ padding: '10px', border: '1px dashed #28a745', borderRadius: '8px' }}>
      <h4>🌱 הוספת תת-תרגיל</h4>
      <form onSubmit={onAddSub} style={{ display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="שם התרגיל" 
          value={newSubExName} 
          onChange={e => setNewSubExName(e.target.value)} 
          required 
          style={{ flex: 1, padding: '8px' }} 
        />
        <button 
          type="submit" 
          style={{ 
            padding: '8px 15px', backgroundColor: '#28a745', color: 'white', 
            border: 'none', borderRadius: '4px', cursor: 'pointer' 
          }}
        >
          צור
        </button>
      </form>
    </div>
  );
};

export default SubExerciseCreator;