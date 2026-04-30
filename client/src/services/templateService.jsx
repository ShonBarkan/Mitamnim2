import api from './api';

/**
 * Service for managing workout templates and their configurations.
 * Aligned with the FastAPI backend structure and dynamic parameter logic.
 */
export const templateService = {
  /**
   * Fetches all templates accessible to the current user.
   * The backend handles role-based filtering (Trainer vs Trainee).
   * Path: GET /workout-templates
   */
  getAll: () => api.get('/workout-templates'),

  /**
   * Creates a new workout template.
   * Note: exercises_config must follow the simplified structure:
   * stores only parameter_id and the assigned value (manual or calculated).
   * Path: POST /workout-templates
   */
  create: (templateData) => api.post('/workout-templates', templateData),

  /**
   * Updates an existing template using PATCH for partial updates.
   * Handles updates to exercise configurations, scheduling, and user assignments.
   * Path: PATCH /workout-templates/{templateId}
   */
  update: (templateId, updateData) => api.patch(`/workout-templates/${templateId}`, updateData),

  /**
   * Deletes a specific template by ID.
   * Path: DELETE /workout-templates/{templateId}
   */
  delete: (templateId) => api.delete(`/workout-templates/${templateId}`)
};

export default templateService;