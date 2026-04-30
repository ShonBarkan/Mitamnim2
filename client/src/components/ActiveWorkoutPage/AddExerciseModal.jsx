import React, { useState } from 'react';

/**
 * Modal component to select and add a new exercise to an ongoing workout.
 * Includes a real-time search filter and scrollable list.
 */
const AddExerciseModal = ({ isOpen, onClose, exercises, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Early return if modal is hidden
  if (!isOpen) return null;

  /**
   * Filters the available exercises based on the user's search input.
   */
  const filteredExercises = exercises.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Handles the selection of an exercise and resets the search state.
   */
  const handleSelect = (exercise) => {
    onSelect(exercise);
    setSearchTerm('');
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        
        {/* Modal Header */}
        <div style={styles.header}>
          <h3 style={{ margin: 0, fontWeight: '800' }}>הוספת תרגיל חדש</h3>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        {/* Search Input Area */}
        <div style={styles.searchContainer}>
          <input 
            type="text" 
            placeholder="חפש תרגיל (למשל: לחיצת חזה)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
            autoFocus
          />
        </div>

        {/* Dynamic Exercise List */}
        <div style={styles.listContainer}>
          {filteredExercises.length > 0 ? (
            filteredExercises.map((ex) => (
              <div 
                key={ex.id} 
                onClick={() => handleSelect(ex)}
                style={styles.exerciseItem}
              >
                <div style={styles.exerciseInfo}>
                  <span style={styles.exerciseName}>{ex.name}</span>
                  {ex.category_name && (
                    <small style={styles.categoryName}>{ex.category_name}</small>
                  )}
                </div>
                <span style={styles.addIcon}>+</span>
              </div>
            ))
          ) : (
            <div style={styles.noResults}>לא נמצאו תרגילים מתאימים</div>
          )}
        </div>

        {/* Modal Footer */}
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
    zIndex: 1100,
    backdropFilter: 'blur(8px)',
    padding: '20px'
  },
  modal: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: '450px',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '80vh',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    overflow: 'hidden',
    direction: 'rtl'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#adb5bd',
    padding: '5px'
  },
  searchContainer: {
    padding: '15px 20px'
  },
  searchInput: {
    width: '100%',
    padding: '12px 18px',
    borderRadius: '14px',
    border: '1px solid #e9ecef',
    backgroundColor: '#f8f9fa',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  },
  listContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 10px 15px 10px'
  },
  exerciseItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 12px',
    borderBottom: '1px solid #f8f9fa',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderRadius: '12px'
  },
  exerciseInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  exerciseName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#212529'
  },
  categoryName: {
    fontSize: '12px',
    color: '#868e96'
  },
  addIcon: {
    color: '#28a745',
    fontSize: '22px',
    fontWeight: 'bold',
    backgroundColor: '#eafaf1',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '10px'
  },
  noResults: {
    textAlign: 'center',
    padding: '40px',
    color: '#adb5bd',
    fontSize: '14px'
  },
  footer: {
    padding: '15px 20px',
    borderTop: '1px solid #f0f0f0',
    textAlign: 'left',
    backgroundColor: '#fff'
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#495057'
  }
};

export default AddExerciseModal;