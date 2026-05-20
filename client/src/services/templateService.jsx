import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service handling API communication for workout templates.
 * Maps CRUD operations to the remote templates endpoint.
 */
export const templateService = {
  getAll: async () => {
    FrontendLogger.info('TEMPLATE_SERVICE', 'Fetching full templates catalog from server');
    const response = await api.get('/templates');
    return response.data;
  },

  create: async (data) => {
    FrontendLogger.info('TEMPLATE_SERVICE', `Submitting new template payload: '${data.name}'`, data);
    const response = await api.post('/templates', data);
    return response.data;
  },

  delete: async (id) => {
    FrontendLogger.info('TEMPLATE_SERVICE', `Purging template record ID: ${id}`);
    await api.delete(`/templates/${id}`);
  }
};

export default templateService;