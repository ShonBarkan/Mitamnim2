import React from 'react';

const ExerciseActiveCard = ({ exercise, onUpdateValue, onAddSet, onToggleDone }) => {
  return (
    <div style={{ 
      ...styles.card, 
      borderColor: exercise.isDone ? '#28a745' : '#eee',
      backgroundColor: exercise.isDone ? '#f6fff8' : '#fff'
    }}>
      <div style={styles.cardHeader}>
        <h3 style={{ margin: 0 }}>{exercise.exercise_name}</h3>
        <input 
          type="checkbox" 
          checked={exercise.isDone} 
          onChange={onToggleDone}
          style={{ width: '22px', height: '22px', cursor: 'pointer' }}
        />
      </div>

      <div style={styles.setsTable}>
        {exercise.actualSets.map((set, sIdx) => (
          <div key={sIdx} style={styles.setRow}>
            <span style={styles.setNum}>{set.setNum}</span>
            <div style={styles.paramsInputs}>
              {Object.keys(set.values).map(pName => (
                <div key={pName} style={styles.inputGroup}>
                  <small>{pName}</small>
                  <input 
                    type="text"
                    value={set.values[pName]}
                    onChange={(e) => onUpdateValue(sIdx, pName, e.target.value)}
                    style={styles.input}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={onAddSet} style={styles.addSetBtn}>+ הוסף סט</button>
    </div>
  );
};

const styles = {
  card: { border: '2px solid #eee', borderRadius: '15px', padding: '15px', marginBottom: '15px', transition: 'all 0.3s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  setsTable: { display: 'flex', flexDirection: 'column', gap: '10px' },
  setRow: { display: 'flex', alignItems: 'center', gap: '15px', padding: '10px 0', borderBottom: '1px solid #f9f9f9' },
  setNum: { fontWeight: 'bold', backgroundColor: '#eee', width: '25px', height: '25px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '12px' },
  paramsInputs: { display: 'flex', gap: '10px', flex: 1 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '2px' },
  input: { width: '60px', padding: '5px', border: '1px solid #ddd', borderRadius: '5px', textAlign: 'center' },
  addSetBtn: { marginTop: '10px', background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }
};

export default ExerciseActiveCard;