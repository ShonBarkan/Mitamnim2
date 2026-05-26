import api from './api';
import FrontendLogger from '../utils/logger';

/**
 * Service handling API communication for Dashboard Configurations and Aggregated Statistics.
 */
export const dashboardConfigService = {
  
  /**
   * Creates a new dashboard configuration setting.
   */
  createConfig: async (data) => {
    FrontendLogger.info('DASHBOARD_SERVICE', 'Creating new dashboard configuration record');
    try {
      const response = await api.post('/dashboard-configs', data);
      FrontendLogger.info('DASHBOARD_SERVICE', 'Dashboard config successfully created', { id: response.data.id });
      return response.data;
    } catch (error) {
      FrontendLogger.error('DASHBOARD_SERVICE', 'Failed to create dashboard configuration', error);
      throw error;
    }
  },

  /**
   * Retrieves all dashboard configurations for the current group.
   */
  getConfigs: async () => {
    FrontendLogger.info('DASHBOARD_SERVICE', 'Fetching dashboard configurations registry');
    try {
      const response = await api.get('/dashboard-configs');
      return response.data;
    } catch (error) {
      FrontendLogger.error('DASHBOARD_SERVICE', 'Error fetching dashboard configurations', error);
      throw error;
    }
  },

  /**
   * Updates an existing dashboard configuration.
   */
  updateConfig: async (id, data) => {
    FrontendLogger.info('DASHBOARD_SERVICE', `Updating dashboard configuration ID: ${id}`);
    try {
      const response = await api.patch(`/dashboard-configs/${id}`, data);
      FrontendLogger.info('DASHBOARD_SERVICE', 'Dashboard config successfully updated');
      return response.data;
    } catch (error) {
      FrontendLogger.error('DASHBOARD_SERVICE', `Failed to update config ID: ${id}`, error);
      throw error;
    }
  },

  /**
   * Bulk updates the order/priority of configurations.
   * @param {Array} items - Array of {id, position} objects
   */
  reorderConfigs: async (items) => {
    FrontendLogger.info('DASHBOARD_SERVICE', 'Bulk updating dashboard configuration order');
    try {
      const response = await api.post('/dashboard-configs/reorder', items);
      FrontendLogger.info('DASHBOARD_SERVICE', 'Dashboard config order successfully synchronized');
      return response.data;
    } catch (error) {
      FrontendLogger.error('DASHBOARD_SERVICE', 'Failed to reorder dashboard configurations', error);
      throw error;
    }
  },

  /**
   * Deletes a dashboard configuration record.
   */
  deleteConfig: async (id) => {
    FrontendLogger.info('DASHBOARD_SERVICE', `Purging dashboard configuration record ID: ${id}`);
    try {
      await api.delete(`/dashboard-configs/${id}`);
      FrontendLogger.info('DASHBOARD_SERVICE', `Config ID: ${id} successfully evicted`);
    } catch (error) {
      FrontendLogger.error('DASHBOARD_SERVICE', `Failed to purge config ID: ${id}`, error);
      throw error;
    }
  },
};

export default dashboardConfigService;