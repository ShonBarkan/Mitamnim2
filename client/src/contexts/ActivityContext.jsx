import React, { createContext, useState, useCallback } from 'react';
import { activityService } from '../services/activityService';

// Export the context so the hook can import it
export const ActivityContext = createContext();

export const ActivityProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches performance logs for a specific exercise.
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