import React, { useState } from 'react';

/**
 * Modal to select and add a new exercise to the active workout.
 * Filters exercises based on the search input.
 */
const AddExerciseModal = ({ isOpen, onClose, exercises, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  // Filter exercises based on search term
  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        
        {/* Modal Header */}
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>הוספת תרגיל חדש</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Search Bar */}
        <div style={styles.searchContainer}>
          <input 
            type="text" 
            placeholder="חפש תרגיל..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* Exercise List */}
        <div style={styles.listContainer}>
          {filteredExercises.length > 0 ? (
            filteredExercises.map((ex) => (
              <div 
                key={ex.id} 
                onClick={() => {
                  onSelect(ex);
                  setSearchTerm(''); // Reset search on select
                }}
                style={styles.exerciseItem}
              >
                <span style={styles.exerciseName}>{ex.name}</span>
                <span style={styles.addIcon}>+</span>
              </div>
            ))
          ) : (
            <div style={styles.noResults}>לא נמצאו תרגילים מתאימים</div>
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>ביטול</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
    padding: '20px'
  },
  modal: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: '500px',
    borderRadius: '20px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '80vh',
    boxShadow: '0 15px 30px rgba(0,0,0,0.2)',
    overflow: 'hidden',
    direction: 'rtl'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#999'
  },
  searchContainer: {
    padding: '15px'
  },
  searchInput: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '10px',
    border: '1px solid #ddd',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  listContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 15px 15px 15px'
  },
  exerciseItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    transition: 'background 0.2s',
    borderRadius: '8px'
  },
  exerciseName: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#333'
  },
  addIcon: {
    color: '#007bff',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  noResults: {
    textAlign: 'center',
    padding: '40px',
    color: '#999'
  },
  footer: {
    padding: '15px',
    borderTop: '1px solid #eee',
    textAlign: 'left'
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  }
};

export default AddExerciseModal;