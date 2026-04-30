import api from './api';

/**
 * Service handling the API communication for measurement parameters.
 * Supports standard (Raw) parameters and Virtual parameters (Calculated/Conversion).
 */
export const parameterService = {
  /**
   * Fetch all measurement parameters for the current group.
   * Includes metadata like aggregation_strategy, is_virtual, and calculation rules.
   * Trailing slash added to match backend configuration and prevent 404 errors.
   */
  getAll: () => api.get('/parameters/'),
  
  /**
   * Create a new parameter definition.
   * Supports virtual parameter fields: 
   * is_virtual, calculation_type (sum, subtract, multiply, divide, percentage, conversion), 
   * source_parameter_ids, and multiplier.
   * 
   * @param {Object} data - Contains name, unit, aggregation_strategy, and virtual logic fields.
   */
  create: (data) => api.post('/parameters/', data),
  
  /**
   * Update an existing parameter's details.
   * Supports partial updates via PATCH for any parameter field.
   * 
   * @param {number} id - The parameter ID.
   * @param {Object} data - The fields to update.
   */
  update: (id, data) => api.patch(`/parameters/${id}/`, data),
  
  /**
   * Remove a parameter definition from the group.
   * Note: Deleting a base parameter may break virtual parameters depending on it.
   * 
   * @param {number} id - The parameter ID.
   */
  delete: (id) => api.delete(`/parameters/${id}/`)
};

export default parameterService;