import api from './api';

/**
 * Service for managing workout templates (The "Planning" phase).
 */
export const templateService = {
  // Get all templates for the current group/user
  getAll: async () => {
    return await api.get('/workout-templates');
  },

  // Create a new template structure
  create: async (templateData) => {
    return await api.post('/workout-templates', templateData);
  },

  // Update parts of a template (PATCH)
  update: async (templateId, updateData) => {
    return await api.patch(`/workout-templates/${templateId}`, updateData);
  },

  // Delete a template
  delete: async (templateId) => {
    return await api.delete(`/workout-templates/${templateId}`);
  }
};

/**
 * Service for managing actual workout sessions (The "Execution" phase).
 */
export const workoutService = {
  /**
   * Finalizes an active workout.
   * Sends the summary, duration, and the list of exercises actually performed.
   */
  finishWorkout: async (sessionData) => {
    return await api.post('/workout-sessions/finish', sessionData);
  },

  /**
   * Fetches the user's historical training sessions.
   */
  getHistory: async () => {
    return await api.get('/workout-sessions/history');
  }
};