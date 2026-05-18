import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service handling the API communication for tracking measurement parameters.
 * Supports standard (Raw) parameters and Virtual parameters (Calculated/Calculated Arrays).
 */
export const parameterService = {
  /**
   * Fetch all measurement parameters for the current group context boundary.
   * Path: GET /parameters
   */
  getAll: async () => {
    FrontendLogger.info('PARAMETER', 'Fetching full group measurement parameters registry matrix');
    const response = await api.get('/parameters');
    return response.data;
  },
  
  /**
   * Create a new parameter definition token asset.
   * Supports virtual fields: is_virtual, calculation_type, source_parameter_ids, and multiplier.
   * Path: POST /parameters
   */
  create: async (data) => {
    FrontendLogger.info('PARAMETER', `Spawning new system parameter blueprint rule: '${data.name}'`, data);
    const response = await api.post('/parameters', data);
    return response.data;
  },
  
  /**
   * Update an existing parameter configuration matrix rule.
   * Path: PATCH /parameters/{id}
   */
  update: async (id, data) => {
    FrontendLogger.info('PARAMETER', `Mutating structural parameter properties for record target id: ${id}`, data);
    const response = await api.patch(`/parameters/${id}`, data);
    return response.data;
  },
  
  /**
   * Remove a parameter token definition schema boundary asset from the group pool.
   * Path: DELETE /parameters/{id}
   */
  delete: async (id) => {
    FrontendLogger.info('PARAMETER', `Completely dropping measurement parameter row record target id: ${id}`);
    const response = await api.delete(`/parameters/${id}`);
    return response.data;
  }
};

export default parameterService;