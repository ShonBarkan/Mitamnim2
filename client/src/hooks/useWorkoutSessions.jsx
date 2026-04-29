import { useContext } from 'react';
import { WorkoutSessionContext } from '../contexts/WorkoutSessionContext';

/**
 * Custom hook to access workout session data and actions.
 * Simplifies the usage of WorkoutSessionContext throughout the app.
 */
export const useWorkoutSessions = () => {
  const context = useContext(WorkoutSessionContext);

  // Safety check to ensure the hook is used within the correct provider
  if (!context) {
    throw new Error('useWorkoutSessions must be used within a WorkoutSessionProvider');
  }

  return context;
};