import React, { createContext, useState, useCallback } from 'react';
import { workoutSessionService } from '../services/workoutSessionService';

export const WorkoutSessionContext = createContext();

export const WorkoutSessionProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches the user's workout history and updates the local state.
   */
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await workoutSessionService.getHistory();
      setTemplates(response.data); // Synchronize with backend history
    } catch (err) {
      console.error("WorkoutSessionContext: Fetching history failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Submits the current workout data and adds the new session to history.
   * @param {Object} workoutData - The performance data from ActiveWorkoutPage.
   */
  const submitWorkout = async (workoutData) => {
    try {
      const response = await workoutSessionService.finishWorkout(workoutData);
      
      // Update history state immediately with the new session
      setSessions(prev => [response.data, ...prev]);
      
      return response.data;
    } catch (err) {
      console.error("WorkoutSessionContext: Submitting workout failed", err);
      throw err;
    }
  };

  return (
    <WorkoutSessionContext.Provider value={{ 
      sessions, 
      loading, 
      fetchHistory, 
      submitWorkout 
    }}>
      {children}
    </WorkoutSessionContext.Provider>
  );
};