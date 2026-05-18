import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service for managing exercise tree definitions and unified parameter mapping structures.
 */
export const exerciseService = {
  /**
   * Fetches all exercises for the current group perimeter.
   * Path: GET /exercises
   */
  getAll: async () => {
    FrontendLogger.info('EXERCISE', 'Requesting full group exercise registry portfolio');
    const response = await api.get('/exercises');
    return response.data;
  },

  /**
   * Retrieves a bulk batch of exercises by their specific unique IDs.
   * Path: POST /exercises/batch
   */
  getBatch: async (exerciseIds) => {
    FrontendLogger.info('EXERCISE', 'Requesting bulk batch extraction sequence for specific target exercise nodes', { exerciseIds });
    const response = await api.post('/exercises/batch', { exercise_ids: exerciseIds });
    return response.data;
  },

  /**
   * Creates a new flat exercise definition node.
   * Path: POST /exercises
   */
  create: async (data) => {
    FrontendLogger.info('EXERCISE', `Registering new flat exercise definition blueprint: '${data.name}'`, data);
    const response = await api.post('/exercises', data);
    return response.data;
  },

  /**
   * Updates structural configuration details for an exercise node.
   * Path: PATCH /exercises/{id}
   */
  update: async (id, data) => {
    FrontendLogger.info('EXERCISE', `Mutating structural parameter configurations on exercise target id: ${id}`, data);
    const response = await api.patch(`/exercises/${id}`, data);
    return response.data;
  },

  /**
   * Deletes an exercise record validation asset from the group pool.
   * Path: DELETE /exercises/{id}
   */
  delete: async (id) => {
    FrontendLogger.info('EXERCISE', `Purging exercise record validation node asset id: ${id} from database schemas`);
    const response = await api.delete(`/exercises/${id}`);
    return response.data;
  },

  /**
   * Fetches full metrics parameter schemas directly linked to a specific exercise.
   * Path: GET /exercises/{id}/active-params
   */
  getActiveParams: async (id) => {
    FrontendLogger.info('EXERCISE', `Querying active parameters schema blueprint linked to exercise instance: ${id}`);
    const response = await api.get(`/exercises/${id}/active-params`);
    return response.data;
  }
};