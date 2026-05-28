import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service handling API communication for Exercise Logs and Snapshots.
 */
export const exerciseLogService = {
  /**
   * Creates a new exercise log along with its parameter snapshots.
   * @param {Object} data - { user_id, session_id, exercise_id, exercise_name, sets, params }
   */
  createLog: async (data) => {
    FrontendLogger.info('EXERCISE_LOG_SERVICE', `Submitting new log for exercise: '${data.exercise_name}'`);
    try {
      const response = await api.post('/exercise-logs', data);
      FrontendLogger.info('EXERCISE_LOG_SERVICE', 'Exercise log successfully persisted', { id: response.data.id });
      return response.data;
    } catch (error) {
      FrontendLogger.error('EXERCISE_LOG_SERVICE', `Failed to persist log for: '${data.exercise_name}'`, error);
      throw error;
    }
  },

  /**
   * Retrieves all exercise logs associated with a specific session.
   * @param {string} sessionId - The session UUID
   */
  getSessionLogs: async (sessionId) => {
    FrontendLogger.info('EXERCISE_LOG_SERVICE', `Fetching logs for session ID: ${sessionId}`);
    try {
      const response = await api.get(`/exercise-logs/session/${sessionId}`);
      return response.data;
    } catch (error) {
      FrontendLogger.error('EXERCISE_LOG_SERVICE', `Error fetching logs for session: ${sessionId}`, error);
      throw error;
    }
  },

  /**
   * Retrieves all exercise logs associated with a specific user.
   * @param {string} userId - The user UUID
   */
  getUserLogs: async (userId) => {
    FrontendLogger.info('EXERCISE_LOG_SERVICE', `Fetching logs for user ID: ${userId}`);
    try {
      const response = await api.get(`/exercise-logs/user/${userId}`);
      return response.data;
    } catch (error) {
      FrontendLogger.error('EXERCISE_LOG_SERVICE', `Error fetching logs for user: ${userId}`, error);
      throw error;
    }
  },

  /**
   * Updates an existing exercise log.
   * @param {string} id - The exercise log UUID
   * @param {Object} data - { sets, created_at, params: [] }
   */
  updateLog: async (id, data) => {
    FrontendLogger.info('EXERCISE_LOG_SERVICE', `Patching exercise log ID: ${id}`);
    try {
      // Sending data directly, created_at will be handled if present
      const response = await api.patch(`/exercise-logs/${id}`, data);
      FrontendLogger.info('EXERCISE_LOG_SERVICE', 'Exercise log successfully updated');
      return response.data;
    } catch (error) {
      FrontendLogger.error('EXERCISE_LOG_SERVICE', `Failed to update exercise log ID: ${id}`, error);
      throw error;
    }
  },

  /**
   * Permanently deletes an exercise log.
   * @param {string} id - The exercise log UUID
   */
  deleteLog: async (id) => {
    FrontendLogger.info('EXERCISE_LOG_SERVICE', `Purging exercise log ID: ${id}`);
    try {
      await api.delete(`/exercise-logs/${id}`);
      FrontendLogger.info('EXERCISE_LOG_SERVICE', `Exercise log ID: ${id} successfully evicted`);
    } catch (error) {
      FrontendLogger.error('EXERCISE_LOG_SERVICE', `Failed to purge exercise log ID: ${id}`, error);
      throw error;
    }
  }
};

export default exerciseLogService;