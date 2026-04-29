import React from 'react';
import ActivityLogItem from './ActivityLogItem';

/**
 * Groups activity logs for a specific day.
 * Displays a date sticky header and a list of activity items.
 */
const JournalDayGroup = ({ dateLabel, logs, isTrainerView }) => {
  if (!logs || logs.length === 0) return null;

  return (
    <div 
      className="journal-day-group" 
      style={{ 
        marginBottom: '15px',
        position: 'relative'
      }}
    >
      {/* Sticky date header for the group */}
      <div style={{
        position: 'sticky',
        top: '0',
        backgroundColor: '#f1f3f5',
        padding: '5px 15px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#495057',
        width: 'fit-content',
        marginBottom: '10px',
        zIndex: 10,
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        {dateLabel}
      </div>

      {/* List of logs for this day */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '8px',
        paddingRight: '10px',
        borderRight: '2px solid #e9ecef',
        marginRight: '10px'
      }}>
        {logs.map((log) => (
          <ActivityLogItem 
            key={log.id} 
            log={log} 
            isTrainerView={isTrainerView} 
          />
        ))}
      </div>
    </div>
  );
};

export default JournalDayGroup;