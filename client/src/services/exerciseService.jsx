import api from './api';

/**
 * Service for managing exercise tree nodes and parameter definitions.
 */
export const exerciseService = {
  /**
   * Fetches all exercises for the current group.
   * Path: GET /exercises/
   */
  getAll: () => api.get('/exercises/'),

  /**
   * Creates a new exercise node.
   * Path: POST /exercises/
   */
  create: (data) => api.post('/exercises/', data),

  /**
   * Updates an exercise node.
   * Path: PATCH /exercises/{id}
   */
  update: (id, data) => api.patch(`/exercises/${id}`, data),

  /**
   * Deletes an exercise node and its descendants.
   * Path: DELETE /exercises/{id}
   */
  delete: (id) => api.delete(`/exercises/${id}`),

  /**
   * Fetches active parameters linked to a specific exercise.
   * Returns metadata for both raw and virtual parameters.
   * Path: GET /exercises/{id}/active-params
   */
  getActiveParams: (id) => api.get(`/exercises/${id}/active-params`)
};