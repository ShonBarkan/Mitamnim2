import React, { useState, useContext, useEffect } from 'react';
import { ExerciseContext } from '../../contexts/ExerciseContext';

/**
 * Navigation component to drill down through exercise categories.
 * Supports starting from a specific category via initialParentId.
 */
const ExerciseDrillDown = ({ onSelect, initialParentId = null }) => {
  const { exercises } = useContext(ExerciseContext);
  
  // Initialize navigation state. 
  // If initialParentId is provided, we start deeper in the tree.
  const [currentParentId, setCurrentParentId] = useState(initialParentId);

  // Sync state if initialParentId changes (e.g., user selects a different category in the background)
  useEffect(() => {
    setCurrentParentId(initialParentId);
  }, [initialParentId]);

  // Filter exercises belonging to the currently viewed category level
  const visibleExercises = exercises.filter(ex => ex.parent_id === currentParentId);

  /**
   * Navigates one level up in the exercise tree.
   */
  const handleBack = () => {
    const currentCategory = exercises.find(ex => ex.id === currentParentId);
    if (currentCategory) {
      setCurrentParentId(currentCategory.parent_id);
    } else {
      // If we can't find the category, we're likely at the root
      setCurrentParentId(null);
    }
  };

  /**
   * Handles item selection or deeper navigation.
   */
  const handleItemClick = (exercise) => {
    if (exercise.has_children) {
      // Move deeper into the tree branch
      setCurrentParentId(exercise.id);
    } else {
      // It's a leaf node - trigger the final selection
      onSelect(exercise);
    }
  };

  return (
    <div className="exercise-drill-down">
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '15px',
        minHeight: '32px' 
      }}>
        <span style={{ fontSize: '14px', color: '#6c757d', fontWeight: '500' }}>
          {currentParentId ? 'בחר תת-תרגיל:' : 'בחר קטגוריה:'}
        </span>
        
        {/* Show "Back" only if we are NOT at the absolute root */}
        {currentParentId !== null && (
          <button 
            onClick={handleBack}
            style={{
              padding: '5px 12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ⬅ חזור
          </button>
        )}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '12px',
        maxHeight: '400px',
        overflowY: 'auto',
        padding: '2px' // Prevent box-shadow clipping
      }}>
        {visibleExercises.map(ex => (
          <button
            key={ex.id}
            onClick={() => handleItemClick(ex)}
            style={{
              padding: '16px 12px',
              backgroundColor: ex.has_children ? '#ffffff' : '#f0f7ff',
              border: `1px solid ${ex.has_children ? '#e9ecef' : '#cce5ff'}`,
              borderRadius: '12px',
              cursor: 'pointer',
              textAlign: 'center',
              fontWeight: ex.has_children ? '500' : '700',
              color: ex.has_children ? '#495057' : '#0056b3',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = ex.has_children ? '#adb5bd' : '#66b2ff';
              e.currentTarget.style.backgroundColor = ex.has_children ? '#f8f9fa' : '#e0efff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = ex.has_children ? '#e9ecef' : '#cce5ff';
              e.currentTarget.style.backgroundColor = ex.has_children ? '#ffffff' : '#f0f7ff';
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span style={{ fontSize: '15px', lineHeight: '1.2' }}>{ex.name}</span>
            {ex.has_children && (
              <span style={{ 
                fontSize: '10px', 
                color: '#adb5bd', 
                textTransform: 'uppercase',
                letterSpacing: '0.5px' 
              }}>
                📂 תת-קטגוריה
              </span>
            )}
          </button>
        ))}
      </div>

      {visibleExercises.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px', 
          color: '#adb5bd', 
          fontStyle: 'italic',
          backgroundColor: '#fcfcfc',
          borderRadius: '12px',
          border: '1px dashed #eee'
        }}>
          אין תרגילים זמינים במיקום זה.
        </div>
      )}
    </div>
  );
};

export default ExerciseDrillDown;