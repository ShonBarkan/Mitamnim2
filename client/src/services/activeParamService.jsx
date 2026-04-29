import api from './api';

export const activeParamService = {
  /**
   * Fetch all parameters currently linked to a specific exercise.
   * @param {number} exerciseId
   */
  getByExercise: (exerciseId) => api.get(`/active-params/${exerciseId}`),

  /**
   * Links a new parameter to an exercise.
   * @param {Object} data - Contains parameter_id, exercise_id, group_id, and default_value.
   */
  link: (data) => api.post('/active-params', data),

  /**
   * Removes the link between a parameter and an exercise.
   * @param {number} linkId - The ID of the entry in the active_params table.
   */
  unlink: (linkId) => api.delete(`/active-params/${linkId}`)
};