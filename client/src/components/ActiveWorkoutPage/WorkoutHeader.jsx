import React from 'react';

/**
 * Sticky header for the Active Workout session.
 * Displays template info, parent category, and action buttons.
 */
const WorkoutHeader = ({ name, description, parentName, onSave, onCancel, isSaving }) => {
  return (
    <div style={styles.header}>
      <div style={styles.info}>
        {/* Parent Category Badge */}
        <span style={styles.categoryBadge}>{parentName}</span>
        
        <h2 style={styles.title}>{name}</h2>
        
        {description && (
          <p style={styles.description}>{description}</p>
        )}
      </div>

      <div style={styles.actions}>
        <button 
          onClick={onCancel} 
          style={styles.cancelBtn}
          disabled={isSaving}
        >
          ביטול
        </button>
        
        <button 
          onClick={onSave} 
          disabled={isSaving}
          style={{
            ...styles.saveBtn,
            backgroundColor: isSaving ? '#94d3a2' : '#28a745'
          }}
        >
          {isSaving ? "שומר..." : "סיום אימון"}
        </button>
      </div>
    </div>
  );
};

const styles = {
  header: { 
    position: 'sticky', 
    top: 0, 
    zIndex: 100, 
    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
    padding: '12px 20px', 
    borderBottom: '1px solid #eee', 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    backdropFilter: 'blur(10px)',
    direction: 'rtl'
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1
  },
  categoryBadge: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#007bff',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  title: { 
    margin: 0, 
    fontSize: '1.25rem', 
    color: '#1a1a1a',
    fontWeight: '800'
  },
  description: {
    margin: 0,
    fontSize: '13px',
    color: '#666',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '200px'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center'
  },
  saveBtn: { 
    color: '#fff', 
    border: 'none', 
    padding: '10px 18px', 
    borderRadius: '10px', 
    fontWeight: 'bold', 
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
    boxShadow: '0 4px 6px rgba(40, 167, 69, 0.2)'
  },
  cancelBtn: {
    backgroundColor: 'transparent',
    color: '#dc3545',
    border: '1px solid #dc3545',
    padding: '8px 15px',
    borderRadius: '10px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s'
  }
};

export default WorkoutHeader;