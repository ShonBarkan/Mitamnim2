import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service handling API communication for Workout Sessions lifecycle.
 */
export const sessionService = {
  /**
   * Submits a complete, finished workout session (Fat Payload) to the server.
   * This includes the session details, all exercise logs, and their parameters.
   * * @param {Object} data - The fat payload object.
   * @param {string} [data.template_id] - Optional template UUID.
   * @param {string} data.name - Session name.
   * @param {string} data.started_at - ISO timestamp of when the session started.
   * @param {string} data.finished_at - ISO timestamp of when the session ended.
   * @param {string} [data.note] - Optional session note.
   * @param {Array} data.logs - Array of exercise logs with their nested params.
   */
  submitSession: async (data) => {
    FrontendLogger.info('SESSION_SERVICE', `Submitting fat session payload: '${data.name}'`);
    try {
      const response = await api.post('/sessions', data);
      FrontendLogger.info('SESSION_SERVICE', 'Fat session successfully saved', { id: response.data.id });
      return response.data;
    } catch (error) {
      FrontendLogger.error('SESSION_SERVICE', 'Failed to submit fat session', error);
      throw error;
    }
  },

  /**
   * Retrieves all workout sessions for the currently authenticated user.
   * Returns fully nested data (Session -> Logs -> Params) due to backend eager loading.
   */
  getMySessions: async () => {
    FrontendLogger.info('SESSION_SERVICE', 'Fetching detailed user sessions history');
    try {
      const response = await api.get('/sessions');
      return response.data;
    } catch (error) {
      FrontendLogger.error('SESSION_SERVICE', 'Error fetching detailed sessions', error);
      throw error;
    }
  },

  /**
   * Updates an existing session's top-level details (e.g., updating notes).
   * @param {string} id - The session UUID
   * @param {Object} data - { note, name }
   */
  updateSession: async (id, data) => {
    FrontendLogger.info('SESSION_SERVICE', `Updating session ID: ${id}`);
    try {
      const response = await api.patch(`/sessions/${id}`, data);
      FrontendLogger.info('SESSION_SERVICE', 'Session top-level details successfully updated');
      return response.data;
    } catch (error) {
      FrontendLogger.error('SESSION_SERVICE', `Failed to update session ID: ${id}`, error);
      throw error;
    }
  },

  /**
   * Permanently deletes a workout session and cascades deletion to its logs and params.
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