import React, { createContext, useState, useCallback } from 'react';
import { workoutService } from '../services/workoutManagementService';
import { initialData } from '../mock/mockData';

export const WorkoutContext = createContext();

const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Context provider for managing active workout sessions and historical data.
 */
export const WorkoutProvider = ({ children }) => {
  const [history, setHistory] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

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
   * Fetches user's workout history.
   * In Dev: Retrieves sessions from the mock database.
   */
  const fetchHistory = useCallback(async (userId = null) => {
    try {
      if (IS_DEV) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const db = getMockDb();
        // Filter sessions by user if ID is provided
        const userHistory = userId 
          ? db.workout_sessions.filter(s => s.user_id === userId)
          : db.workout_sessions;
        setHistory(userHistory || []);
      } else {
        const res = await workoutService.getHistory();
        const data = res.data || res;
        setHistory(data);
      }
    } catch (err) {
      console.error("WorkoutContext: History fetch failed", err);
    }
  }, [getMockDb]);

  /**
   * Finalizes and saves a live workout session.
   * In Dev: Atomically updates sessions and activity logs in local storage.
   */
  const saveWorkoutSession = async (sessionData) => {
    setIsSaving(true);
    try {
      if (IS_DEV) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const db = getMockDb();

        const newSession = {
          ...sessionData,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString()
        };

        // Persist session
        db.workout_sessions.unshift(newSession);

        // Persist logs included in this session if they exist
        if (sessionData.logs && Array.isArray(sessionData.logs)) {
          const logsWithSessionId = sessionData.logs.map(log => ({
            ...log,
            id: Math.floor(Math.random() * 1000000),
            session_id: newSession.id
          }));
          db.activity_logs = [...logsWithSessionId, ...db.activity_logs];
        }

        saveMockDb(db);
        setHistory(prev => [newSession, ...prev]);
        return newSession;
      } else {
        const res = await workoutService.finishWorkout(sessionData);
        const data = res.data || res;
        setHistory(prev => [data, ...prev]);
        return data;
      }
    } catch (err) {
      console.error("WorkoutContext: Save session failed", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <WorkoutContext.Provider value={{ 
      history, 
      isSaving, 
      fetchHistory, 
      saveWorkoutSession 
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export default WorkoutProvider;