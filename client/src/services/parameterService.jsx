import api from './api';

export const parameterService = {
  /**
   * Fetch all measurement parameters for the current group.
   * Trailing slash added to match backend configuration and prevent 404 errors.
   */
  getAll: () => api.get('/parameters/'),
  
  /**
   * Create a new parameter definition.
   * The group_id is handled by the backend via the auth token.
   * @param {Object} data - Contains name and unit.
   */
  create: (data) => api.post('/parameters/', data),
  
  /**
   * Update an existing parameter's name or unit.
   * @param {number} id - The parameter ID.
   * @param {Object} data - The fields to update.
   */
  update: (id, data) => api.patch(`/parameters/${id}/`, data),
  
  /**
   * Remove a parameter definition from the group.
   * @param {number} id - The parameter ID.
   */
  delete: (id) => api.delete(`/parameters/${id}/`)
};