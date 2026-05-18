import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service for managing workout templates blueprint configurations.
 * Aligned with the flat relational database structure and dynamic parameters layout.
 */
export const templateService = {
  /**
   * Fetches all workout template structures allocated within the user group.
   * Path: GET /templates
   */
  getAll: async () => {
    FrontendLogger.info('TEMPLATE', 'Requesting group workout templates catalog layout');
    const response = await api.get('/templates');
    return response.data;
  },

  /**
   * Creates an isolated workout template deploying nested arrays into normalized tables.
   * @param {Object} templateData - Aligned with WorkoutTemplateCreate schema:
   * {
   * name: string,
   * description: string|null,
   * expected_duration_time: string|null,
   * scheduled_hour: string|null,
   * exercises: [
   * { exercise_id: number, num_of_sets: number, params: [{ parameter_id: number, target_value: string }] }
   * ],
   * for_users: string[] (List of User UUIDs),
   * scheduled_days: number[] (List of integers 0-6)
   * }
   * Path: POST /templates
   */
  create: async (templateData) => {
    FrontendLogger.info('TEMPLATE', `Spawning new normalized template framework entity: '${templateData.name}'`, templateData);
    const response = await api.post('/templates', templateData);
    return response.data;
  },

  /**
   * Updates fields or layout tracking arrays for an existing template entry.
   * Path: PATCH /templates/{templateId}
   */
  update: async (templateId, updateData) => {
    FrontendLogger.info('TEMPLATE', `Mutating schema configuration rules on template record node id: ${templateId}`, updateData);
    const response = await api.patch(`/templates/${templateId}`, updateData);
    return response.data;
  },

  /**
   * Deletes a specific workout template and flushes its downstream relation mappings.
   * Path: DELETE /templates/{templateId}
   */
  delete: async (templateId) => {
    FrontendLogger.info('TEMPLATE', `Completely purging workout template schema row target id: ${templateId}`);
    const response = await api.delete(`/templates/${templateId}`);
    return response.data;
  }
};

export default templateService;