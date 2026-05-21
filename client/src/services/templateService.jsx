import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service handling API communication for workout templates.
 * Supports deep integration with exercise mapping and parameter configurations.
 */
export const templateService = {
  getAll: async () => {
    FrontendLogger.info('TEMPLATE_SERVICE', 'Fetching full workout templates catalog including exercise associations');
    try {
      const response = await api.get('/templates');
      return response.data;
    } catch (error) {
      FrontendLogger.error('TEMPLATE_SERVICE', 'Error fetching templates', error);
      throw error;
    }
  },

  create: async (data) => {
    /**
     * Expected data structure:
     * {
     * name: string,
     * description: string,
     * group_id: uuid,
     * estimated_duration: integer,
     * exercises: Array<{ exercise_id, position, sets, params: Array<{ parameter_id, value }> }>,
     * assigned_user_ids: Array<uuid>,
     * tag_ids: Array<integer>
     * }
     */
    FrontendLogger.info('TEMPLATE_SERVICE', `Submitting complex template payload for: '${data.name}'`);
    try {
      const response = await api.post('/templates', data);
      FrontendLogger.info('TEMPLATE_SERVICE', 'Template successfully persisted to database', { id: response.data.id });
      return response.data;
    } catch (error) {
      FrontendLogger.error('TEMPLATE_SERVICE', `Failed to persist template: '${data.name}'`, error);
      throw error;
    }
  },

  delete: async (id) => {
    FrontendLogger.info('TEMPLATE_SERVICE', `Purging template record ID: ${id}`);
    try {
      await api.delete(`/templates/${id}`);
      FrontendLogger.info('TEMPLATE_SERVICE', `Template ID: ${id} successfully evicted from system`);
    } catch (error) {
      FrontendLogger.error('TEMPLATE_SERVICE', `Failed to purge template ID: ${id}`, error);
      throw error;
    }
  }
};

export default templateService;