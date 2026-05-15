import React, { createContext, useState, useCallback } from 'react';
import { activityService } from '../services/activityService';
import { initialData } from '../mock/mockData';

export const ActivityContext = createContext();

const IS_DEV = process.env.NODE_ENV === 'development';

export const ActivityProvider = ({ children }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Helper to manage local storage for Dev mode
   */
  const getMockDb = useCallback(() => {
    const data = localStorage.getItem('mitamnim2_db');
    if (!data) {
      localStorage.setItem('mitamnim2_db', JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(data);
  }, []);

  const saveMockDb = (db) => {
    localStorage.setItem('mitamnim2_db', JSON.stringify(db));
  };

  /**
   * Fetches performance logs. 
   * In Dev: Filters the activity_logs array by exerciseName.
   * In Prod: Calls activityService.
   */
  const fetchLogs = useCallback(async (exerciseName, isTrainerView = false) => {
    setLoading(true);
    try {
      if (IS_DEV) {
        await new Promise(resolve => setTimeout(resolve, 400));
        const db = getMockDb();
        // Filtering by exercise_name (string) as per the new architecture
        const filteredLogs = db.activity_logs.filter(log => log.exercise_name === exerciseName);
        setLogs(filteredLogs);
      } else {
        const response = isTrainerView 
          ? await activityService.getGroupLogs(exerciseName)
          : await activityService.getPersonalLogs(exerciseName);
        
        setLogs(response.data || response);
      }
    } catch (err) {
      console.error("ActivityContext: Failed to fetch logs", err);
    } finally {
      setLoading(false);
    }
  }, [getMockDb]);

  /**
   * Adds a new activity log entry.
   */
  const addLog = async (logData) => {
    try {
      if (IS_DEV) {
        const db = getMockDb();
        const newLog = { 
          ...logData, 
          id: Math.floor(Math.random() * 1000000),
          timestamp: new Date().toISOString()
        };
        db.activity_logs.unshift(newLog);
        saveMockDb(db);
        setLogs(prev => [newLog, ...prev]);
        return newLog;
      } else {
        const response = await activityService.create(logData);
        const data = response.data || response;
        setLogs(prev => [data, ...prev]);
        return data;
      }
    } catch (err) {
      console.error("ActivityContext: Create log failed", err);
      throw err;
    }
  };

  /**
   * Updates an existing activity log entry.
   */
  const editLog = async (logId, updateData) => {
    try {
      let updatedLog;
      if (IS_DEV) {
        const db = getMockDb();
        const index = db.activity_logs.findIndex(log => log.id === logId);
        if (index === -1) throw new Error("Log not found in mock DB");
        
        db.activity_logs[index] = { ...db.activity_logs[index], ...updateData };
        updatedLog = db.activity_logs[index];
        saveMockDb(db);
      } else {
        const response = await activityService.update(logId, updateData);
        updatedLog = response.data || response;
      }

      setLogs(prev => prev.map(log => log.id === logId ? updatedLog : log));
      return updatedLog;
    } catch (err) {
      console.error("ActivityContext: Update log failed", err);
      throw err;
    }
  };

  /**
   * Deletes an activity log entry.
   */
  const removeLog = async (logId) => {
    try {
      if (IS_DEV) {
        const db = getMockDb();
        db.activity_logs = db.activity_logs.filter(log => log.id !== logId);
        saveMockDb(db);
      } else {
        await activityService.delete(logId);
      }
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