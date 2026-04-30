import React, { createContext, useState, useCallback } from 'react';
import { workoutSessionService } from '../services/workoutSessionService';

/**
 * Context for managing workout sessions and history.
 * Coordinates with workoutSessionService to finalize workouts and retrieve past sessions.
 */
export const WorkoutSessionContext = createContext();

export const WorkoutSessionProvider = ({ children }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  /**
   * Fetches the user's workout history.
   * Backend returns metadata for each session, including template names and exercise counts.
   */
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await workoutSessionService.getHistory();
      // Updated to correctly synchronize with the sessions state
      setSessions(response.data); 
    } catch (err) {
      console.error("WorkoutSessionContext: Fetching history failed", err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Submits a bulk workout payload to be finalized.
   * The backend will automatically split the performed_exercises into individual 
   * ActivityLog entries (one per set) and link them to this session.
   * 
   * @param {Object} workoutData - Bulk payload including start_time, duration, summary, and exercises.
   */
  const submitWorkout = async (workoutData) => {
    try {
      const response = await workoutSessionService.finishWorkout(workoutData);
      
      // Immediately add the new session metadata to the top of the history list
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

export default WorkoutSessionProvider;