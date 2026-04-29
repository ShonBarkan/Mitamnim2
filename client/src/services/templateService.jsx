import api from './api';

/**
 * Service for managing workout templates.
 * Aligned with the FastAPI backend structure.
 */
export const templateService = {
  /**
   * Fetches all templates accessible to the current user.
   * The backend handles role-based filtering (Trainer vs Trainee).
   */
  getAll: () => api.get('/workout-templates'),

  /**
   * Creates a new workout template.
   * @param {Object} templateData - Should include name, exercises_config, etc.
   */
  create: (templateData) => api.post('/workout-templates', templateData),

  /**
   * Updates an existing template using PATCH for partial updates.
   * @param {number|string} templateId - The ID of the template to update.
   * @param {Object} updateData - The fields to be updated.
   */
  update: (templateId, updateData) => api.patch(`/workout-templates/${templateId}`, updateData),

  /**
   * Deletes a specific template by ID.
   * @param {number|string} templateId 
   */
  delete: (templateId) => api.delete(`/workout-templates/${templateId}`)
};