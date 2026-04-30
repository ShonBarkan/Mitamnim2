import api from './api';

/**
 * Service for managing workout sessions and history.
 * Coordinates with the backend to finalize bulk workout data 
 * and retrieve past performance metadata.
 */
export const workoutSessionService = {
  /**
   * Submits a completed workout session to the server in bulk.
   * The backend will split the performed_exercises into individual activity logs per set.
   * 
   * @param {Object} workoutData - Data structure:
   * {
   *   template_id: number|null,
   *   start_time: string (ISO),
   *   workout_summary: string,
   *   actual_duration: string,
   *   performed_exercises: [
   *     {
   *       exercise_id: number,
   *       performance_data: [[{parameter_id: number, value: string}, ...], ...] // List of sets
   *     }
   *   ]
   * }
   */
  finishWorkout: (workoutData) => api.post('/workout-sessions/finish', workoutData),

  /**
   * Fetches the authenticated user's workout history.
   * Returns a list of sessions enriched with template names and unique exercise counts.
   */
  getHistory: () => api.get('/workout-sessions/history'),
};

export default workoutSessionService;