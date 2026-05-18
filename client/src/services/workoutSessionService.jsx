import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service for managing workout sessions log transmissions and historic tracking.
 * Coordinates with the database to finalize structural workout performance matrices.
 */
export const workoutSessionService = {
  /**
   * Submits a finalized completed workout session profile to the database.
   * Maps clean, normalized metrics collections flatly into relational sets tables.
   * * @param {Object} workoutData - Data structure aligned with WorkoutSessionFinish schema:
   * {
   * template_id: number|null,
   * start_time: string (ISO Timestamp),
   * workout_summary: string|null,
   * actual_duration: string|null,
   * performed_exercises: [
   * {
   * exercise_id: number,
   * sets: [
   * {
   * set_number: number,
   * metrics: [
   * { parameter_id: number, value: string }
   * ]
   * }
   * ]
   * }
   * ]
   * }
   */
  finishWorkout: async (workoutData) => {
    FrontendLogger.info('WORKOUT_SESSION', 'Transmitting finalized execution metrics data vector block to server', workoutData);
    const response = await api.post('/workout-sessions/finish', workoutData);
    return response.data;
  },

  /**
   * Fetches the full historic logs of all validated sessions completed by the current user.
   * Path: GET /workout-sessions
   */
  getHistory: async () => {
    FrontendLogger.info('WORKOUT_SESSION', 'Requesting historic completed workout tracking matrix portfolio');
    const response = await api.get('/workout-sessions');
    return response.data;
  }
};

export default workoutSessionService;