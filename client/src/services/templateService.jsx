import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service handling API communication for workout templates.
 * Now integrated with enriched server-side data models.
 */
export const templateService = {
  getAll: async () => {
    FrontendLogger.info('TEMPLATE_SERVICE', 'Fetching enriched workout templates catalog');
    try {
      const response = await api.get('/templates');
      // The server now returns enriched data (exercises with names, full tags, etc.)
      return response.data;
    } catch (error) {
      FrontendLogger.error('TEMPLATE_SERVICE', 'Error fetching templates', error);
      throw error;
    }
  },

  create: async (data) => {
    /**
     * Updated data structure based on the cleanPayload we implemented:
     * {
     * name: string,
     * description: string,
     * estimated_duration: integer,
     * exercises: Array<{ exercise_id, position, sets, parameters: Array<{ parameter_id, default_value }> }>,
     * assigned_user_ids: Array<uuid>,
     * tag_ids: Array<integer>
     * }
     */
    FrontendLogger.info('TEMPLATE_SERVICE', `Submitting template payload for: '${data.name}'`);
    try {
      const response = await api.post('/templates', data);
      FrontendLogger.info('TEMPLATE_SERVICE', 'Template successfully persisted', { id: response.data.id });
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
      FrontendLogger.info('TEMPLATE_SERVICE', `Template ID: ${id} successfully evicted`);
    } catch (error) {
      FrontendLogger.error('TEMPLATE_SERVICE', `Failed to purge template ID: ${id}`, error);
      throw error;
    }
  }
};

export default templateService;