import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service handling API communication for Workout Sessions lifecycle.
 */
export const sessionService = {
  /**
   * Submits a complete, finished workout session.
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
   * Retrieves workout sessions for a specific user.
   * @param {string} userId - The UUID of the user to fetch sessions for.
   */
  getSessions: async (userId) => {
    FrontendLogger.info('SESSION_SERVICE', `Fetching detailed sessions for user: ${userId}`);
    try {
      // Pass userId as a query parameter so the backend can filter by the correct user
      const response = await api.get('/sessions', { 
        params: { user_id: userId } 
      });
      return response.data;
    } catch (error) {
      FrontendLogger.error('SESSION_SERVICE', `Error fetching sessions for user: ${userId}`, error);
      throw error;
    }
  },

  /**
   * Updates an existing session's top-level details.
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
   * Permanently deletes a workout session.
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