import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service handling API communication for athletic exercises.
 * Maps CRUD operations to the remote exercises endpoint.
 */
export const exerciseService = {
  getAll: async () => {
    FrontendLogger.info('EXERCISE_SERVICE', 'Fetching all group-isolated exercises from server');
    const response = await api.get('/exercises');
    return response.data;
  },

  create: async (data) => {
    FrontendLogger.info('EXERCISE_SERVICE', `Creating new exercise record: '${data.name}'`, data);
    const response = await api.post('/exercises', data);
    return response.data;
  },

  createBulk: async (data) => {
    FrontendLogger.info('EXERCISE_SERVICE', `Performing bulk ingestion of ${data.length} exercises`);
    const response = await api.post('/exercises/bulk', data);
    return response.data;
  },

  update: async (id, data) => {
    FrontendLogger.info('EXERCISE_SERVICE', `Updating exercise record ID: #${id}`, data);
    const response = await api.put(`/exercises/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    FrontendLogger.info('EXERCISE_SERVICE', `Purging exercise record ID: #${id}`);
    await api.delete(`/exercises/${id}`);
  }
};

export default exerciseService;