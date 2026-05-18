import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service handling the API communication for the stats dashboard configurations.
 * Manages how exercises and parameters are displayed on the public leaderboard.
 */
const dashboardConfigService = {
  /**
   * Retrieves all dashboard configurations for the current group perimeter.
   * @returns {Promise<Array>} List of configuration objects sorted by display_order.
   */
  getConfigs: async () => {
    FrontendLogger.info('DASHBOARD_CONFIG', 'Fetching group leaderboard display metrics configuration');
    const response = await api.get('/dashboard-config');
    return response.data;
  },

  /**
   * Adds a new item to the group dashboard display.
   * @param {Object} data - Contains exercise_id, parameter_id, ranking_direction, and visibility settings.
   * @returns {Promise<Object>} The created configuration object.
   */
  createConfig: async (data) => {
    FrontendLogger.info('DASHBOARD_CONFIG', 'Registering new metric visualization layout on leaderboard', data);
    const response = await api.post('/dashboard-config', data);
    return response.data;
  },

  /**
   * Updates an existing configuration entry.
   * Primarily used for drag-and-drop reordering (display_order) or inline status toggles.
   * @param {number} id - The ID of the configuration entry.
   * @param {Object} data - The partial data to update.
   * @returns {Promise<Object>} The updated configuration object.
   */
  updateConfig: async (id, data) => {
    FrontendLogger.info('DASHBOARD_CONFIG', `Mutating dashboard layout configuration sequence for target node id: ${id}`, data);
    const response = await api.patch(`/dashboard-config/${id}`, data);
    return response.data;
  },

  /**
   * Removes an item from the dashboard configuration tracking pool.
   * @param {number} id - The ID of the configuration entry to delete.
   * @returns {Promise<void>}
   */
  removeConfig: async (id) => {
    FrontendLogger.info('DASHBOARD_CONFIG', `Evicting dashboard rule blueprint id: ${id} from layout schema bounds`);
    await api.delete(`/dashboard-config/${id}`);
  }
};

export default dashboardConfigService;