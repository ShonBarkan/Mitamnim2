import React from 'react';

/**
 * Component that displays a horizontal list of available leaf exercises 
 * based on the selected category.
 */
const TemplateExerciseBank = ({ parentId, loading, availableExercises, onAdd, styles }) => {
  return (
    <div style={styles.bankContainer}>
      <h4 style={styles.bankHeader}>בנק תרגילים זמינים (לחץ להוספה):</h4>
      
      {!parentId ? (
        <p style={styles.bankEmpty}>בחר קטגוריית אב כדי לראות תרגילים...</p>
      ) : loading ? (
        <p style={{ fontSize: '13px', color: '#007bff' }}>סורק את העץ וטוען תרגילים...</p>
      ) : (
        <div style={styles.bankScroll}>
          {availableExercises.map((exercise) => (
            <div 
              key={exercise.id}
              onClick={() => onAdd(exercise)}
              style={styles.bankItem}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#28a745';
                e.currentTarget.style.backgroundColor = '#f6fff8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#dee2e6';
                e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              <span style={{ color: '#28a745', marginLeft: '5px', fontWeight: 'bold' }}>+</span>
              <strong>{exercise.name}</strong>
            </div>
          ))}

          {availableExercises.length === 0 && (
            <p style={styles.bankEmpty}>לא נמצאו תרגילי קצה בקטגוריה זו.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TemplateExerciseBank;