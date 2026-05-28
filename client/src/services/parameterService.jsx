import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service handling the API communication for tracking measurement parameters.
 * Re-architected to align with PUT updates across atomic math configurations.
 * Enforces strict English-only code commentary and total Hebrew UI localization support.
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
   * Supports structural formula components layout matching regular, conversion, and combination models.
   * Path: POST /parameters
   */
  create: async (data) => {
    FrontendLogger.info('PARAMETER', `Spawning new system parameter blueprint rule: '${data.name}'`, data);
    const response = await api.post('/parameters', data);
    return response.data;
  },
  
  /**
   * Update an existing parameter configuration matrix rule.
   * Converted to PUT execution to enforce atomic payload validation filters in backend scope wrappers.
   * Path: PUT /parameters/{id}
   */
  update: async (id, data) => {
    FrontendLogger.info('PARAMETER', `Mutating structural parameter properties cleanly via PUT for record target id: ${id}`, data);
    const response = await api.put(`/parameters/${id}`, data);
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