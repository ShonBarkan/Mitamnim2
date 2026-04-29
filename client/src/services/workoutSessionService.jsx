import api from './api';

/**
 * Service for managing workout sessions and history.
 */
export const workoutSessionService = {
  /**
   * Submits a completed workout session to the server.
   * @param {Object} workoutData - Contains template_id, start_time, and performed_exercises.
   */
  finishWorkout: (workoutData) => api.post('/workout-sessions/finish', workoutData),

  /**
   * Fetches the authenticated user's workout history.
   */
  getHistory: () => api.get('/workout-sessions/history'),
};