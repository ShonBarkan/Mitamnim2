import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service handling API communication for Workout Sessions lifecycle.
 */
export const sessionService = {
  /**
   * Starts a new workout session (Active or Freestyle).
   * @param {Object} data - { template_id (optional), name, note }
   */
  startSession: async (data) => {
    FrontendLogger.info('SESSION_SERVICE', `Initiating new session: '${data.name}'`);
    try {
      const response = await api.post('/sessions', data);
      FrontendLogger.info('SESSION_SERVICE', 'Session successfully created', { id: response.data.id });
      return response.data;
    } catch (error) {
      FrontendLogger.error('SESSION_SERVICE', 'Failed to create session', error);
      throw error;
    }
  },

  /**
   * Retrieves all workout sessions for the currently authenticated user.
   */
  getMySessions: async () => {
    FrontendLogger.info('SESSION_SERVICE', 'Fetching user sessions history');
    try {
      const response = await api.get('/sessions');
      return response.data;
    } catch (error) {
      FrontendLogger.error('SESSION_SERVICE', 'Error fetching sessions', error);
      throw error;
    }
  },

  /**
   * Updates an existing session (e.g., finishing the session or updating notes).
   * @param {string} id - The session UUID
   * @param {Object} data - { note, finished_at }
   */
  updateSession: async (id, data) => {
    FrontendLogger.info('SESSION_SERVICE', `Updating session ID: ${id}`);
    try {
      const response = await api.patch(`/sessions/${id}`, data);
      FrontendLogger.info('SESSION_SERVICE', 'Session successfully updated');
      return response.data;
    } catch (error) {
      FrontendLogger.error('SESSION_SERVICE', `Failed to update session ID: ${id}`, error);
      throw error;
    }
  },

  /**
   * Permanently deletes a workout session and cascades deletion to its logs.
   * @param {string} id - The session UUID
   */
  deleteSession: async (id) => {
    FrontendLogger.info('SESSION_SERVICE', `Purging session record ID: ${id}`);
    try {
      await api.delete(`/sessions/${id}`);
      FrontendLogger.info('SESSION_SERVICE', `Session ID: ${id} successfully evicted`);
    } catch (error) {
      FrontendLogger.error('SESSION_SERVICE', `Failed to purge session ID: ${id}`, error);
      throw error;
    }
  }
};

export default sessionService;