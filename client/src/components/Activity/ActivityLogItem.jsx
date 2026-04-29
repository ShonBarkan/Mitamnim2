import React, { useState } from 'react';
import { useActivity } from '../../hooks/useActivity';
import { formatTime } from '../../utils/activityDateUtils';
import ActivityLogEditModal from './ActivityLogEditModal'; // Will be Step 5

/**
 * Represents a single performance record.
 * Displays time, exercise name (for grouped views), parameters, and actions.
 */
const ActivityLogItem = ({ log, isTrainerView }) => {
  const { removeLog } = useActivity();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleDelete = () => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את התיעוד הזה?')) {
      removeLog(log.id);
    }
  };

  return (
    <div 
      className="activity-log-item"
      style={{
        backgroundColor: '#fff',
        border: '1px solid #e9ecef',
        borderRadius: '10px',
        padding: '12px 15px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        transition: 'box-shadow 0.2s',
        position: 'relative'
      }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
    >
      {/* Header: Time, User (if trainer), and Exercise Name */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#868e96', fontWeight: 'bold' }}>
              {formatTime(log.timestamp)}
            </span>
            <span style={{ fontWeight: 'bold', color: '#212529' }}>
              {log.exercise_name}
            </span>
          </div>
          {isTrainerView && log.user_full_name && (
            <span style={{ fontSize: '12px', color: '#007bff', marginTop: '2px' }}>
              👤 {log.user_full_name}
            </span>
          )}
        </div>

        {/* Action Buttons: Only for the owner (not trainer view, unless allowed) */}
        {!isTrainerView && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#adb5bd', fontSize: '14px' }}
              title="ערוך"
            >
              ✎
            </button>
            <button 
              onClick={handleDelete}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ff8787', fontSize: '14px' }}
              title="מחק"
            >
              🗑
            </button>
          </div>
        )}
      </div>

      {/* Performance Data: Dynamic chips for each parameter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {log.performance_data.map((param, index) => (
          <div 
            key={index}
            style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span style={{ color: '#495057' }}>{param.parameter_name}:</span>
            <strong style={{ color: '#212529' }}>{param.value}</strong>
            <span style={{ fontSize: '11px', color: '#868e96' }}>{param.unit}</span>
          </div>
        ))}
      </div>

      {/* Edit Modal (Step 5) */}
      {isEditModalOpen && (
        <ActivityLogEditModal 
          log={log} 
          onClose={() => setIsEditModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default ActivityLogItem;