import api from './api';

export const parameterService = {
  /**
   * Fetch all measurement parameters for the current group.
   * Includes the aggregation_strategy (sum, max, min, avg, latest) for each parameter.
   * Trailing slash added to match backend configuration and prevent 404 errors.
   */
  getAll: () => api.get('/parameters/'),
  
  /**
   * Create a new parameter definition.
   * The group_id is handled by the backend via the auth token.
   * @param {Object} data - Contains name, unit, and aggregation_strategy.
   */
  create: (data) => api.post('/parameters/', data),
  
  /**
   * Update an existing parameter's details.
   * @param {number} id - The parameter ID.
   * @param {Object} data - The fields to update (name, unit, or aggregation_strategy).
   */
  update: (id, data) => api.patch(`/parameters/${id}/`, data),
  
  /**
   * Remove a parameter definition from the group.
   * @param {number} id - The parameter ID.
   */
  delete: (id) => api.delete(`/parameters/${id}/`)
};