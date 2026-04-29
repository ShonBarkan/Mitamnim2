import React from 'react';
import ActivityCreator from '../Activity/ActivityCreator';

const LogModal = ({ isOpen, onClose, selectedEx }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{ width: '90%', maxWidth: '500px', position: 'relative' }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute', top: '-40px', left: '0', 
            background: 'none', border: 'none', color: 'white', 
            fontSize: '24px', cursor: 'pointer'
          }}
        >
          ✕ סגור
        </button>
        <ActivityCreator 
          initialExercise={selectedEx} 
          onComplete={onClose} 
        />
      </div>
    </div>
  );
};

export default LogModal;