import React from 'react';
import ActivityLogItem from './ActivityLogItem';

/**
 * Groups activity logs for a specific day.
 * Displays a date sticky header and clusters logs by workout sessions or individual entries.
 */
const JournalDayGroup = ({ dateLabel, logs, isTrainerView }) => {
  if (!logs || logs.length === 0) return null;

  return (
    <div 
      className="journal-day-group" 
      style={{ 
        marginBottom: '20px',
        position: 'relative'
      }}
    >
      {/* Sticky date header for the group */}
      <div style={styles.dateHeader}>
        {dateLabel}
      </div>

      {/* List of logs with session-based grouping */}
      <div style={styles.logsList}>
        {logs.map((log, index) => {
          /**
           * Grouping logic:
           * Display a new header if:
           * 1. It's the first log of the day.
           * 2. The workout_session_id changed compared to the previous log.
           */
          const isNewGroup = index === 0 || logs[index - 1].workout_session_id !== log.workout_session_id;

          return (
            <React.Fragment key={log.id}>
              {isNewGroup && (
                <div style={styles.sessionTitle}>
                  <span style={styles.sessionIcon}>
                    {log.workout_session_id ? "🏋️" : "📝"}
                  </span>
                  {log.workout_session_id 
                    ? `${log.workout_session_name ?? "אימון אישי"} (#${log.workout_session_id})` 
                    : "תיעוד בודד"
                  }
                </div>
              )}
              <ActivityLogItem 
                log={log} 
                isTrainerView={isTrainerView} 
              />
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

const styles = {
  dateHeader: {
    position: 'sticky',
    top: '0',
    backgroundColor: '#f1f3f5',
    padding: '5px 15px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#495057',
    width: 'fit-content',
    marginBottom: '12px',
    zIndex: 10,
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    direction: 'rtl'
  },
  logsList: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px',
    paddingRight: '12px',
    borderRight: '2px solid #e9ecef',
    marginRight: '10px',
    direction: 'rtl'
  },
  sessionTitle: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#007bff',
    marginTop: '10px',
    marginBottom: '2px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    backgroundColor: '#f8f9fa',
    width: 'fit-content',
    padding: '2px 8px',
    borderRadius: '4px',
    border: '1px solid #eef0f2'
  },
  sessionIcon: {
    fontSize: '12px'
  }
};

export default JournalDayGroup;