import React, { createContext, useState, useCallback, useContext } from 'react';
import { workoutSessionService } from '../services/workoutSessionService';
import FrontendLogger from '../utils/logger';

export const WorkoutContext = createContext();

/**
 * Context provider for managing live workout synchronization pipelines and historical data portfolios.
 */
export const WorkoutProvider = ({ children }) => {
  const [history, setHistory] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Fetches the authenticated user's completed workout session history array.
   */
  const fetchHistory = useCallback(async () => {
    try {
      FrontendLogger.info('WORKOUT_CONTEXT', 'Initiating historic completed workout logs synchronization pipeline');
      const data = await workoutSessionService.getHistory();
      setHistory(data);
      FrontendLogger.info('WORKOUT_CONTEXT', `Successfully synchronized ${data.length} historic workout sessions from database`);
    } catch (err) {
      FrontendLogger.error('WORKOUT_CONTEXT', 'Failed to retrieve synchronized workout history matrix portfolio', err);
    }
  }, []);

  /**
   * Transmits and commits a completed live workout session block to the database perimeter.
   * Maps un-nested structured performed_exercises containing exact relational set metrics.
   */
  const saveWorkoutSession = async (sessionData) => {
    setIsSaving(true);
    try {
      FrontendLogger.info('WORKOUT_CONTEXT', 'Dispatching active live session payload structural block to network service', sessionData);
      const data = await workoutSessionService.finishWorkout(sessionData);
      
      setHistory(prev => [data, ...prev]);
      FrontendLogger.info('WORKOUT_CONTEXT', 'Live workout session successfully closed, validated and pushed to local history state matrix', data);
      return data;
    } catch (err) {
      FrontendLogger.error('WORKOUT_CONTEXT', 'Failed to finalize live session transaction block transmission parameters', err);
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

/**
 * Custom hook utility proxying contextual abstraction layers cleanly.
 * Must be consumed strictly within an active WorkoutProvider scope wrapper boundary.
 */
export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be consumed strictly within an active WorkoutProvider scope wrapper boundary.');
  }
  return context;
};

export default WorkoutProvider;