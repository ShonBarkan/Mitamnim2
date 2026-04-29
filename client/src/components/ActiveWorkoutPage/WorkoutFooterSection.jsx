import React from 'react';

/**
 * Section for workout summary, actual duration, and the final submit action.
 */
const WorkoutFooterSection = ({ 
  summary, 
  setSummary, 
  duration, 
  setDuration, 
  onFinish, 
  isSaving 
}) => {
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>סיכום וסיום אימון</h3>
      
      <div style={styles.inputGroup}>
        <label style={styles.label}>כמה זמן לקח האימון? (בדקות - אופציונלי)</label>
        <input 
          type="number"
          placeholder="למשל: 45"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          style={styles.durationInput}
        />
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.label}>איך היה האימון? (סיכום קצר)</label>
        <textarea 
          placeholder="כתוב כאן הערות, תחושות או דגשים..."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          style={styles.summaryArea}
        />
      </div>

      <button 
        onClick={onFinish}
        disabled={isSaving}
        style={{
          ...styles.finishBtn,
          backgroundColor: isSaving ? '#94d3a2' : '#28a745'
        }}
      >
        {isSaving ? "שומר נתונים..." : "✅ סיום ושמירת אימון"}
      </button>
    </div>
  );
};

const styles = {
  container: {
    marginTop: '30px',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '15px',
    border: '1px solid #eee',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
  },
  title: { margin: '0 0 20px', color: '#333', fontSize: '1.2rem' },
  inputGroup: { marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: 'bold', color: '#555' },
  durationInput: {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    fontSize: '16px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  },
  summaryArea: {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    fontSize: '16px',
    minHeight: '100px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit'
  },
  finishBtn: {
    width: '100%',
    padding: '16px',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.2)',
    transition: 'transform 0.1s'
  }
};

export default WorkoutFooterSection;