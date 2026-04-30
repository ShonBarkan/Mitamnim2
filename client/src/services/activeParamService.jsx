import api from './api';

/**
 * Service handling the API communication for active parameters (exercise-parameter links).
 * Maintains consistency with the backend trailing slash requirements.
 */
export const activeParamService = {
  /**
   * Fetch all active parameters for the current user's group.
   * Useful for initializing the global context to minimize subsequent API calls.
   */
  getAllGroupParams: () => api.get('/active-params/'),

  /**
   * Fetch all parameters currently linked to a specific exercise.
   * @param {number} exerciseId
   */
  getByExercise: (exerciseId) => api.get(`/active-params/exercise/${exerciseId}/`),

  /**
   * Fetches active parameters based on an array of IDs.
   * If ids is empty or null, the backend returns all active parameters for the group.
   * @param {Array<number>|null} ids - Array of active_params IDs.
   */
  getBatch: (ids = null) => api.post('/active-params/batch/', { ids }),

  /**
   * Links a new parameter to an exercise node.
   * Note: If the parameter is virtual, the backend may automatically link its dependencies.
   * @param {Object} data - Contains parameter_id, exercise_id, group_id, and default_value.
   */
  link: (data) => api.post('/active-params/', data),

  /**
   * Removes the link between a parameter and an exercise.
   * Note: This operation triggers a recursive cleanup in the backend, 
   * removing any virtual parameters that depend on the unlinked parameter.
   * @param {number} linkId - The database ID of the link entry.
   */
  unlink: (linkId) => api.delete(`/active-params/${linkId}/`)
};

export default activeParamService;