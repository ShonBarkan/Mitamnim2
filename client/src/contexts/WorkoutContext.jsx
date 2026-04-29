import React, { createContext, useState, useCallback } from 'react';
import { workoutService } from '../services/workoutManagementService';

export const WorkoutContext = createContext();

export const WorkoutProvider = ({ children }) => {
  const [history, setHistory] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch user's workout history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await workoutService.getHistory();
      setHistory(res.data);
    } catch (err) {
      console.error("WorkoutContext: History fetch failed", err);
    }
  }, []);

  // Finalize and save a live workout session
  const saveWorkoutSession = async (sessionData) => {
    setIsSaving(true);
    try {
      const res = await workoutService.finishWorkout(sessionData);
      // Add the new session to history state
      setHistory(prev => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      console.error("WorkoutContext: Save session failed", err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <WorkoutContext.Provider value={{ 
      history, isSaving, fetchHistory, saveWorkoutSession 
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};