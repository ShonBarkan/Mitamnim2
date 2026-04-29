import api from './api';

/**
 * Service for managing workout templates.
 * Matches the updated FastAPI backend with renamed fields:
 * - expected_duration_time
 * - scheduled_hour
 */
export const templateService = {
  /**
   * Fetches all templates accessible to the current user.
   * Filtering logic is handled server-side.
   */
  getAll: async () => {
    return await api.get('/workout-templates');
  },

  /**
   * Creates a new workout template.
   * @param {Object} templateData - Should include name, exercises_config, etc.
   */
  create: async (templateData) => {
    return await api.post('/workout-templates', templateData);
  },

  /**
   * Updates an existing template using PATCH for partial updates.
   * @param {number} templateId - The ID of the template to update.
   * @param {Object} updateData - The fields to be updated.
   */
  update: async (templateId, updateData) => {
    return await api.patch(`/workout-templates/${templateId}`, updateData);
  },

  /**
   * Deletes a specific template by ID.
   * @param {number} templateId 
   */
  delete: async (templateId) => {
    return await api.delete(`/workout-templates/${templateId}`);
  }
};