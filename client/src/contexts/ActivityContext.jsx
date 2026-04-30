import React, { createContext, useState, useCallback } from 'react';
import { activityService } from '../services/activityService';

// Export the context so hooks and components can consume it
export const ActivityContext = createContext();

/**
 * Provider for managing exercise activity logs for the Mitamnim application.
 * In this architecture, each log entry represents a single performed set.
 * The backend provides enriched data including parameter names and units via joins.
 */
export const ActivityProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches performance logs (individual sets) for a specific exercise.
   * Data includes enriched metadata such as exercise_name and workout_session_name.
   */
  const fetchLogs = useCallback(async (exerciseId, isTrainerView = false) => {
    setLoading(true);
    try {
      const response = isTrainerView 
        ? await activityService.getGroupLogs(exerciseId)
        : await activityService.getPersonalLogs(exerciseId);
      
      setLogs(response.data);
    } catch (err) {
      console.error("ActivityContext: Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Adds a new activity log entry for a single set.
   * Updates the local state by prepending the enriched entry returned by the server.
   */
  const addLog = async (logData) => {
    try {
      const response = await activityService.create(logData);
      setLogs(prev => [response.data, ...prev]);
      return response.data;
    } catch (err) {
      console.error("ActivityContext: Create log failed", err);
      throw err;
    }
  };

  /**
   * Updates an existing activity log (set entry).
   * Synchronizes the local state with the updated and enriched response.
   */
  const editLog = async (logId, updateData) => {
    try {
      const response = await activityService.update(logId, updateData);
      setLogs(prev => prev.map(log => log.id === logId ? response.data : log));
      return response.data;
    } catch (err) {
      console.error("ActivityContext: Update log failed", err);
      throw err;
    }
  };

  /**
   * Deletes an activity log entry and removes it from the local state.
   */
  const removeLog = async (logId) => {
    try {
      await activityService.delete(logId);
      setLogs(prev => prev.filter(log => log.id !== logId));
    } catch (err) {
      console.error("ActivityContext: Delete log failed", err);
      throw err;
    }
  };

  return (
    <ActivityContext.Provider value={{ 
      logs, 
      loading, 
      fetchLogs, 
      addLog, 
      editLog, 
      removeLog 
    }}>
      {children}
    </ActivityContext.Provider>
  );
};

export default ActivityProvider;