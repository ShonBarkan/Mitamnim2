import React, { useEffect, useState, useMemo } from 'react';
import { useExerciseLog } from '../../contexts/ExerciseLogContext';
import { useExercise } from '../../contexts/ExerciseContext';
import LogEntryRow from './LogEntryRow';
import FrontendLogger from '../../utils/logger';

const LogDiaryHistory = ({ selectedUserId, canModifyLogs }) => {
  const { logs, loading: logsLoading, fetchUserLogs, updateLog, removeLog } = useExerciseLog() || {};
  const { exercises, fetchExercises } = useExercise() || {};
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (typeof fetchExercises === 'function') fetchExercises();
  }, [fetchExercises]);

  useEffect(() => {
    if (selectedUserId && typeof fetchUserLogs === 'function') {
      FrontendLogger.info('LOG_DIARY_HISTORY', `Fetching logs for user ID: ${selectedUserId}`);
      fetchUserLogs(selectedUserId);
    }
  }, [selectedUserId, fetchUserLogs]);

  const handleSave = async (logId, updatedData) => {
    try {
      await updateLog(logId, updatedData);
      setEditingId(null);
    } catch (error) {
      FrontendLogger.error('LOG_DIARY_HISTORY', 'Failed to update log', error);
    }
  };

  const handleDelete = async (logId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק תיעוד זה?')) {
      try {
        await removeLog(logId);
      } catch (error) {
        FrontendLogger.error('LOG_DIARY_HISTORY', 'Failed to delete log', error);
      }
    }
  };

  const sortedGroupedLogs = useMemo(() => {
    if (!Array.isArray(logs) || logs.length === 0) return [];

    // 1. Sort all logs by time (newest first)
    const sortedLogs = [...logs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // 2. Group by Date using ISO string as sort key
    const groups = {};
    sortedLogs.forEach((log) => {
      const dateObj = new Date(log.created_at);
      const sortKey = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
      const dateLabel = dateObj.toLocaleDateString('he-IL', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });

      if (!groups[sortKey]) {
        groups[sortKey] = { label: dateLabel, logs: [] };
      }
      groups[sortKey].logs.push(log);
    });

    // 3. Return sorted array of entries (newest date first)
    return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [logs]);

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-3">יומן אימונים</h2>
      {logsLoading && !editingId ? (
        <p className="text-gray-500 animate-pulse">טוען נתונים...</p>
      ) : sortedGroupedLogs.length === 0 ? (
        <p className="text-gray-500 text-center py-10">לא נמצאו רישומים ביומן.</p>
      ) : (
        <div className="space-y-10">
          {sortedGroupedLogs.map(([sortKey, group]) => (
            <div key={sortKey} className="relative">
              {/* Date Header */}
              <h3 className="sticky top-0 z-10 bg-gray-50 text-blue-800 font-bold mb-4 border-b border-blue-200 pb-1">
                {group.label}
              </h3>
              
              {/* Logs Timeline */}
              <div className="space-y-4">
                {group.logs.map((log) => (
                  <div key={log.id} className="flex gap-4">
                    {/* Time Stamp Column */}
                    <div className="w-16 flex-shrink-0 text-right pt-1">
                      <span className="text-sm font-mono font-bold text-gray-500">
                        {new Date(log.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    {/* Log Card */}
                    <div className="flex-1">
                      <LogEntryRow
                        log={log}
                        exercise={exercises?.find(ex => ex.id === log.exercise_id)}
                        isEditing={editingId === log.id}
                        onStartEdit={() => setEditingId(log.id)}
                        onSave={(data) => handleSave(log.id, data)}
                        onCancel={() => setEditingId(null)}
                        onDelete={() => handleDelete(log.id)}
                        canModify={canModifyLogs}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LogDiaryHistory;