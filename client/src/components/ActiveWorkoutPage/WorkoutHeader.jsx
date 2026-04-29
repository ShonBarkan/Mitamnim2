import React from 'react';

const WorkoutHeader = ({ name, description, parentName, onSave, isSaving }) => {
  return (
    <div style={styles.header}>
      <div style={styles.info}>
        <h2 style={{ margin: 0 }}>{name}</h2>
        <small style={{ color: '#666' }}>{parentName} | {description}</small>
      </div>
      <button 
        onClick={onSave} 
        disabled={isSaving}
        style={styles.saveBtn}
      >
        {isSaving ? "שומר..." : "סיום אימון"}
      </button>
    </div>
  );
};

const styles = {
  header: { 
    position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#fff', 
    padding: '15px 20px', borderBottom: '1px solid #eee', 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  saveBtn: { 
    backgroundColor: '#28a745', color: '#fff', border: 'none', 
    padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' 
  }
};

export default WorkoutHeader;