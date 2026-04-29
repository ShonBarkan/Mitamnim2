import React, { useEffect, useMemo } from 'react';
import { useActivity } from '../../hooks/useActivity';
import { groupLogsByDate } from '../../utils/activityDateUtils';
import JournalDayGroup from './JournalDayGroup';

/**
 * Main component to display a chronological journal of activity logs.
 * Groups logs by date and handles empty/loading states.
 */
const ActivityJournal = ({ exerciseId, isTrainerView = false }) => {
  const { logs, loading, fetchLogs } = useActivity();

  // Fetch logs whenever the exercise focus changes
  useEffect(() => {
    if (exerciseId) {
      fetchLogs(exerciseId, isTrainerView);
    }
  }, [exerciseId, isTrainerView, fetchLogs]);

  // Memoize the grouped logs to prevent unnecessary recalculations on re-renders
  const groupedLogs = useMemo(() => groupLogsByDate(logs), [logs]);
  const dateKeys = Object.keys(groupedLogs);

  if (loading && logs.length === 0) {
    return <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>טוען היסטוריית אימונים...</div>;
  }

  if (dateKeys.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px 20px', 
        backgroundColor: '#f9f9f9', 
        borderRadius: '8px', 
        border: '1px dashed #ccc',
        color: '#888' 
      }}>
        טרם תועדו ביצועים לתרגיל זה.
      </div>
    );
  }

  return (
    <div className="activity-journal" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h3 style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        {isTrainerView ? "יומן ביצועי קבוצה" : "היסטוריית הביצועים שלי"}
      </h3>
      
      {dateKeys.map((dateLabel) => (
        <JournalDayGroup 
          key={dateLabel} 
          dateLabel={dateLabel} 
          logs={groupedLogs[dateLabel]} 
          isTrainerView={isTrainerView}
        />
      ))}
    </div>
  );
};

export default ActivityJournal;