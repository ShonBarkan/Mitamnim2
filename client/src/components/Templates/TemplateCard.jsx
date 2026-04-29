import React from 'react';

/**
 * Individual Card representing a workout template.
 * Displays summary info and action buttons.
 */
const TemplateCard = ({ template, onEdit, onDelete, onStart, isTrainer }) => {
  const { name, description, expected_duration_time, exercises_config, scheduled_days } = template;

  const daysOfWeek = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      border: '1px solid #eee',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'transform 0.2s',
      direction: 'rtl'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '1.2rem' }}>{name}</h3>
        <span style={{ fontSize: '0.8rem', color: '#007bff', fontWeight: 'bold' }}>
          {expected_duration_time || '--'} דקות
        </span>
      </div>

      <p style={{ margin: 0, color: '#666', fontSize: '0.9rem', minHeight: '40px' }}>
        {description || 'אין תיאור זמין'}
      </p>

      {/* Info chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ background: '#f8f9fa', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', border: '1px solid #ddd' }}>
          {exercises_config.length} תרגילים
        </div>
        {scheduled_days?.length > 0 && (
          <div style={{ background: '#fff3cd', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', border: '1px solid #ffeeba', color: '#856404' }}>
            ימי פעילות: {scheduled_days.map(d => daysOfWeek[d]).join(', ')}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
        <button 
          onClick={() => onStart(template)}
          style={{
            flex: 2,
            backgroundColor: '#28a745',
            color: '#fff',
            border: 'none',
            padding: '10px',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🚀 התחל אימון
        </button>

        {isTrainer && (
          <>
            <button 
              onClick={() => onEdit(template)}
              style={{
                flex: 1,
                backgroundColor: '#fff',
                color: '#495057',
                border: '1px solid #ced4da',
                padding: '10px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              ערוך
            </button>
            <button 
              onClick={() => onDelete(template.id)}
              style={{
                padding: '10px',
                backgroundColor: '#fff',
                color: '#dc3545',
                border: '1px solid #dc3545',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              🗑️
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TemplateCard;